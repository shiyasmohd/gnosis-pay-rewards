import './sentry.js'; // imported first to setup sentry
import { Address, PublicClient, Transport, erc20Abi, formatEther } from 'viem';
import {
  gnosisPayStartBlock,
  gnoTokenAddress,
  calcRewardAmount,
  bigMath,
  getGnosisPayTokenByAddress,
} from '@karpatkey/gnosis-pay-rewards-sdk';
import { gnosis } from 'viem/chains';
import { gnosisChainPublicClient } from './publicClient.js';
import { getGnosisPaySpendLogs } from './getGnosisPaySpendLogs.js';
import { migrateGnosisPayTokensToDatabase } from './database/gnosisPayToken.js';
import { clampToBlockRange } from './utils.js';
import { buildSocketIoServer, buildExpressApp } from './server.js';
import { SOCKET_IO_SERVER_PORT, MONGODB_URI } from './config/env.js';
import { waitForBlock } from './waitForBlock.js';
import { createConnection } from './database/createConnection.js';
import { getPendingRewardModel } from './database/pendingReward.js';
import { getBlockByNumber } from './getBlockByNumber.js';
import { addHttpRoutes } from './addHttpRoutes.js';

const indexBlockSize = 12n; // 12 blocks is roughly 60 seconds of data

async function startIndexing(client: PublicClient<Transport, typeof gnosis>) {
  // Connect to the database
  const mongooseConnection = await createConnection(MONGODB_URI);

  console.log('Migrating Gnosis Pay tokens to database');
  await migrateGnosisPayTokensToDatabase(mongooseConnection);

  const pendingRewardModel = getPendingRewardModel(mongooseConnection);

  const expressApp = addHttpRoutes({
    expressApp: buildExpressApp(),
    pendingRewardModel,
  });
  const { socketIoServer } = buildSocketIoServer(expressApp);

  // Emit the 10 recent pending rewards to the UI when a client connects
  socketIoServer.on('connection', async (socketClient) => {
    socketClient.on('disconnect', () => {
      console.log('Client disconnected');
    });

    socketClient.on('getRecentPendingRewards', async (limit: number) => {
      const pendingRewards = await pendingRewardModel.find().limit(limit).sort({ blockNumber: -1 });
      socketClient.emit(
        'recentPendingRewards',
        pendingRewards.map((r) => r.toJSON())
      );
    });
  });

  socketIoServer.listen(SOCKET_IO_SERVER_PORT);

  console.log('Starting indexing');

  // Initialize the latest block
  let latestBlock = await client.getBlock({ includeTransactions: false });
  let fromBlockNumber = gnosisPayStartBlock;
  let toBlockNumber = clampToBlockRange(fromBlockNumber, latestBlock.number, indexBlockSize);

  // Watch for new blocks
  client.watchBlocks({
    includeTransactions: false,
    onBlock(block) {
      latestBlock = block;
    },
  });

  const shouldFetchLogs = toBlockNumber <= latestBlock.number;

  console.log({ fromBlockNumber, toBlockNumber, shouldFetchLogs });

  // Index all the logs until the latest block
  while (toBlockNumber <= latestBlock.number) {
    const logs = await getGnosisPaySpendLogs({
      client,
      fromBlock: fromBlockNumber,
      toBlock: toBlockNumber,
      verbose: true,
    });

    for (const log of logs) {
      const { blockNumber, transactionHash } = log;
      const { account: rolesModuleAddress, amount: spendAmountRaw, asset: spentTokenAddress } = log.args;
      // Verify that the token is registered as GP token like EURe, GBPe, and USDC
      const spentToken = getGnosisPayTokenByAddress(spentTokenAddress);

      if (!spentToken) {
        console.warn(`Unknown token: ${spentTokenAddress}`);
        continue;
      }

      const { data: block } = await getBlockByNumber({ client, blockNumber: log.blockNumber });

      if (!block) {
        /**
         * @todo make this a retryable error
         */
        console.error(`Block #${log.blockNumber} not found`);
        continue;
      }

      const gnosisPaySafeAddress = (await gnosisChainPublicClient.readContract({
        abi: [
          {
            name: 'owner',
            outputs: [{ internalType: 'address', name: '', type: 'address' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        functionName: 'owner',
        address: rolesModuleAddress,
        blockNumber,
      })) as Address;

      // Fetch the GNO token balance for the GP Safe at the spend block
      const gnosisPaySafeGnoTokenBalance = await client.readContract({
        abi: erc20Abi,
        address: gnoTokenAddress,
        functionName: 'balanceOf',
        args: [gnosisPaySafeAddress],
        blockNumber,
      });

      const formattedGnoBalance = formatEther(gnosisPaySafeGnoTokenBalance);

      const { amount: gnoRewardsAmount, bips: gnoRewardsBips } = calcRewardAmount(Number(formattedGnoBalance));

      const consoleLogStrings = [
        `GP Safe: ${gnosisPaySafeAddress} spent ${formatEther(spendAmountRaw)} ${spentToken.symbol} @ ${blockNumber}`,
      ];

      if (gnosisPaySafeGnoTokenBalance > BigInt(0)) {
        consoleLogStrings.push(
          `They have ${formattedGnoBalance} GNO and will receive ${gnoRewardsAmount} GNO rewards (@${gnoRewardsBips} BPS).`
        );
      }

      console.log(consoleLogStrings.join('\n'));

      try {
        const pendingRewardDocument = await new pendingRewardModel({
          _id: `${blockNumber}-${rolesModuleAddress}-${spentTokenAddress}`,
          gnosisPaySafeAddress,
          gnoRewardsAmount,
          gnoRewardsBps: gnoRewardsBips,
          blockNumber,
          transactionHash,
          gnoTokenBalance: formattedGnoBalance,
          safeAddress: gnosisPaySafeAddress,
          spentAmount: spendAmountRaw.toString(),
          spentToken: spentTokenAddress,
          blockTimestamp: block.timestamp,
        }).save();

        // Emit to the UI
        socketIoServer.emit('newPendingReward', pendingRewardDocument.toJSON());
      } catch (e) {
        console.error(e);
      }
    }

    // Move to the next block range
    fromBlockNumber += indexBlockSize;
    toBlockNumber = clampToBlockRange(fromBlockNumber, latestBlock.number, indexBlockSize);

    // Sanity check to make sure we're not going too fast
    const distanceToLatestBlock = bigMath.abs(toBlockNumber - latestBlock.number);
    console.log({ distanceToLatestBlock });
    // Cooldown for 20 seconds if we're within a distance of 10 blocks
    if (distanceToLatestBlock < 10n) {
      console.log(
        `Cooldown for 20 seconds becaure toBlockNumber (#${toBlockNumber}) is within 10 blocks of latestBlock (#${latestBlock.number})`
      );

      const targetBlockNumber = toBlockNumber + indexBlockSize * 30n;

      console.log(`Waiting for #${targetBlockNumber}`);

      await waitForBlock({
        client,
        blockNumber: targetBlockNumber,
      });
    }
  }
}

startIndexing(gnosisChainPublicClient).catch((e) => {
  console.error(e);
  process.exit(1);
});
