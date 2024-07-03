process.env.TZ = 'UTC';
import './sentry.js'; // imported first to setup sentry
import { PublicClient, Transport, formatUnits } from 'viem';
import { gnosisPayStartBlock, bigMath } from '@karpatkey/gnosis-pay-rewards-sdk';
import { gnosis } from 'viem/chains';
import { gnosisChainPublicClient } from './publicClient.js';
import { getGnosisPaySpendLogs } from './getGnosisPaySpendLogs.js';
import { getTokenModel, migrateGnosisPayTokensToDatabase } from './database/gnosisPayToken.js';
import { clampToBlockRange } from './utils.js';
import { buildSocketIoServer, buildExpressApp } from './server.js';
import { SOCKET_IO_SERVER_PORT, MONGODB_URI } from './config/env.js';
import { waitForBlock } from './waitForBlock.js';
import { createConnection } from './database/createConnection.js';
import { getPendingRewardModel } from './database/pendingReward.js';
import { addHttpRoutes } from './addHttpRoutes.js';
import { addSocketComms } from './addSocketComms.js';
import { processSpendLog } from './processSpendLog.js';
import { getOrCreateWeekDataDocument, getWeekDataModel } from './database/weekData.js';

const indexBlockSize = 12n; // 12 blocks is roughly 60 seconds of data
const resumeIndexing = false;

async function startIndexing({
  client,
  resumeIndexing = false,
}: {
  client: PublicClient<Transport, typeof gnosis>;
  /**
   * If true, the indexer will resume indexing from the latest pending reward in the database.
   * If the database is empty, the indexer will start indexing from the Gnosis Pay start block.
   * See {@link gnosisPayStartBlock} for the start block.
   */
  resumeIndexing?: boolean;
}) {
  // Connect to the database
  const mongooseConnection = await createConnection(MONGODB_URI);

  console.log('Migrating Gnosis Pay tokens to database');
  await migrateGnosisPayTokensToDatabase(getTokenModel(mongooseConnection));

  const pendingRewardModel = getPendingRewardModel(mongooseConnection);
  const weekDataModel = getWeekDataModel(mongooseConnection);

  const expressApp = addHttpRoutes({
    expressApp: buildExpressApp(),
    pendingRewardModel,
  });

  const socketIoServer = addSocketComms({
    socketIoServer: buildSocketIoServer(expressApp),
    pendingRewardModel,
  });

  socketIoServer.listen(SOCKET_IO_SERVER_PORT);

  console.log('Starting indexing');

  // Initialize the latest block
  let latestBlock = await client.getBlock({ includeTransactions: false });

  // default value is June 29th, 2024. Otherwise, we fetch the latest block from the indexed pending rewards
  let fromBlockNumber = gnosisPayStartBlock;

  if (resumeIndexing === true) {
    const [latestPendingReward] = await pendingRewardModel.find().sort({ blockNumber: -1 }).limit(1);
    if (latestPendingReward !== undefined) {
      fromBlockNumber = BigInt(latestPendingReward.blockNumber) - indexBlockSize;
      console.log(`Resuming indexing from #${fromBlockNumber}`);
    } else {
      console.warn(`No pending rewards found, starting from the beginning at #${gnosisPayStartBlock}`);
    }
  } else {
    // Clean up the database
    await pendingRewardModel.deleteMany();
  }

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
      try {
        const { data: pendingRewardDocument } = await processSpendLog({
          client,
          log,
          pendingRewardModel,
        });

        if (pendingRewardDocument) {
          socketIoServer.emit('newPendingReward', pendingRewardDocument);

          // Normalize the pending reward data into the week's data
          const weekDataDocument = await getOrCreateWeekDataDocument({
            unixTimestamp: pendingRewardDocument.blockTimestamp,
            weekDataModel,
          });

          // weekDataDocument.transactions.push(pendingRewardDocument._id);
          weekDataDocument.totalUsdVolume = weekDataDocument.totalUsdVolume + pendingRewardDocument.spentAmountUsd;

          await weekDataDocument.save();
        }
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

      const targetBlockNumber = toBlockNumber + indexBlockSize + 3n;

      console.log(`Waiting for #${targetBlockNumber}`);

      await waitForBlock({
        client,
        blockNumber: targetBlockNumber,
      });
    }
  }
}

startIndexing({ client: gnosisChainPublicClient, resumeIndexing }).catch((e) => {
  console.error(e);
  process.exit(1);
});
