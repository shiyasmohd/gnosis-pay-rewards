import './sentry.js'; // imported first to setup sentry

import { Address, PublicClient, Transport, erc20Abi, formatEther } from 'viem';

import {
  gnosisPayStartBlock,
  gnoTokenAddress,
  calcRewardAmount,
  bigMath,
  getGnosisPayTokenByAddress,
} from '@karpatkey/gnosis-pay-rewards-sdk';
import { gnosisChainPublicClient } from './publicClient.js';
import { getGnosisPaySpendLogs } from './getGnosisPaySpendLogs.js';
import { migrateGnosisPayTokensToDatabase } from './database/gnosisPayToken.js';
import { clampToBlockRange } from './utils.js';
import { startServer } from './server.js';
import { SOCKET_IO_SERVER_PORT, MONGODB_URI } from './config/env.js';
import { waitForBlock } from './waitForBlock.js';
import { gnosis } from 'viem/chains';
import { dbConnect } from './database/dbConnect.js';

const indexBlockSize = 12n; // 12 blocks is roughly 60 seconds of data

const mongooseConnection = await dbConnect(MONGODB_URI);

async function startIndexing(client: PublicClient<Transport, typeof gnosis>) {
  console.log('Migrating Gnosis Pay tokens to database');
  await migrateGnosisPayTokensToDatabase(mongooseConnection);

  const socketIoServer = startServer({ httpPort: SOCKET_IO_SERVER_PORT, httpHost: '0.0.0.0' });

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
      const { blockNumber } = log;
      const { account: rolesModuleAddress, amount: spendAmountRaw, asset } = log.args;

      const token = getGnosisPayTokenByAddress(asset);

      if (!token) {
        console.warn(`Unknown token: ${asset}`);
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

      const formattedGnoBalance = Number(formatEther(gnosisPaySafeGnoTokenBalance));

      const { amount: gnoRewardsAmount, bips: gnoRewardsBips } = calcRewardAmount(formattedGnoBalance);

      const consoleLogStrings = [
        `GP Safe: ${gnosisPaySafeAddress} spent ${formatEther(spendAmountRaw)} ${token?.symbol} @ ${blockNumber}`,
      ];

      if (gnosisPaySafeGnoTokenBalance > BigInt(0)) {
        consoleLogStrings.push(
          `They have ${formattedGnoBalance} GNO and will receive ${gnoRewardsAmount} GNO rewards (@${gnoRewardsBips} BPS).`
        );
      }

      console.log(consoleLogStrings.join('\n'));

      // Emit to the UI
      socketIoServer.emit('spend', {
        spendAmount: Number(spendAmountRaw),
        token,
        gnosisPaySafeAddress,
        gnoRewardsAmount,
        gnoRewardsBps: gnoRewardsBips,
      });
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
