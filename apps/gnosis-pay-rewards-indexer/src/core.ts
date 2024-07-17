import { gnosisPayStartBlock, bigMath, gnosisPayTokens } from '@karpatkey/gnosis-pay-rewards-sdk';
import { PublicClient, Transport } from 'viem';
import { gnosis } from 'viem/chains';

import { getGnosisPaySpendLogs } from './gp/getGnosisPaySpendLogs.js';
import { getTokenModel, migrateGnosisPayTokensToDatabase } from './database/gnosisPayToken.js';
import { clampToBlockRange } from './utils.js';
import { buildSocketIoServer, buildExpressApp } from './server.js';
import { SOCKET_IO_SERVER_PORT, MONGODB_URI, HTTP_SERVER_HOST, HTTP_SERVER_PORT } from './config/env.js';
import { waitForBlock } from './waitForBlock.js';
import { createConnection } from './database/createConnection.js';
import { getGnosisPayTransactionModel } from './database/gnosisPayTransaction.js';
import { addHttpRoutes } from './addHttpRoutes.js';
import { addSocketComms } from './addSocketComms.js';
import { processSpendLog } from './processSpendLog.js';
import { getGnosisPayRefundLogs } from './gp/getGnosisPayRefundLogs.js';
import { getWeekCashbackRewardModel } from './database/weekCashbackReward.js';
import { createMongooseLogger, getLoggerModel } from './database/logger.js';
import { getWeekDataModel } from './database/weekData.js';
import { getBlockModel, saveBlock } from './database/block.js';

const indexBlockSize = 12n; // 12 blocks is roughly 60 seconds of data

export async function startIndexing({
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

  const gnosisPayTransactionModel = getGnosisPayTransactionModel(mongooseConnection);
  const weekCashbackRewardModel = getWeekCashbackRewardModel(mongooseConnection);
  const weekDataModel = getWeekDataModel(mongooseConnection);
  const loggerModel = getLoggerModel(mongooseConnection);
  const blockModel = getBlockModel(mongooseConnection);

  const logger = createMongooseLogger(loggerModel);

  const restApiServer = addHttpRoutes({
    expressApp: buildExpressApp(),
    gnosisPayTransactionModel,
    weekCashbackRewardModel,
    logger,
  });

  const socketIoServer = addSocketComms({
    socketIoServer: buildSocketIoServer(restApiServer),
    gnosisPayTransactionModel,
    weekDataModel,
  });

  restApiServer.listen(HTTP_SERVER_PORT, HTTP_SERVER_HOST);
  socketIoServer.listen(SOCKET_IO_SERVER_PORT);

  console.log('Starting indexing');

  // Initialize the latest block
  let latestBlock = await client.getBlock({ includeTransactions: false });

  // default value is June 29th, 2024. Otherwise, we fetch the latest block from the indexed pending rewards
  let fromBlockNumber = gnosisPayStartBlock;

  if (resumeIndexing === true) {
    const [latestGnosisPayTransaction] = await gnosisPayTransactionModel.find().sort({ blockNumber: -1 }).limit(1);
    if (latestGnosisPayTransaction !== undefined) {
      fromBlockNumber = BigInt(latestGnosisPayTransaction.blockNumber) - indexBlockSize;
      console.log(`Resuming indexing from #${fromBlockNumber}`);
    } else {
      console.warn(`No pending rewards found, starting from the beginning at #${gnosisPayStartBlock}`);
    }
  } else {
    const session = await mongooseConnection.startSession();

    await session.withTransaction(async () => {
      // Clean up the database
      await gnosisPayTransactionModel.deleteMany();
      await weekCashbackRewardModel.deleteMany();
      await weekDataModel.deleteMany();
      await loggerModel.deleteMany();
    });
  }

  let toBlockNumber = clampToBlockRange(fromBlockNumber, latestBlock.number, indexBlockSize);

  // Watch for new blocks
  client.watchBlocks({
    includeTransactions: false,
    onBlock(block) {
      latestBlock = block;

      saveBlock(
        {
          number: Number(block.number),
          hash: block.hash,
          timestamp: Number(block.timestamp),
        },
        blockModel
      ).catch((e) => {
        console.error('Error creating block', e);
      });
    },
  });

  const shouldFetchLogs = toBlockNumber <= latestBlock.number;

  console.log({ fromBlockNumber, toBlockNumber, shouldFetchLogs });

  // Index all the logs until the latest block
  while (toBlockNumber <= latestBlock.number) {
    try {
      await logger.logDebug({
        message: `Fetching logs from #${fromBlockNumber} to #${toBlockNumber}`,
      });
    } catch (e) {}

    const spendLogs = await getGnosisPaySpendLogs({
      client,
      fromBlock: fromBlockNumber,
      toBlock: toBlockNumber,
      verbose: true,
    });

    const refundLogs = await getGnosisPayRefundLogs({
      client,
      fromBlock: fromBlockNumber,
      toBlock: toBlockNumber,
      verbose: true,
      tokenAddresses: gnosisPayTokens.map((token) => token.address),
    });

    for (const spendLog of spendLogs) {
      try {
        const { data, error } = await processSpendLog({
          client,
          log: spendLog,
          gnosisPayTransactionModel,
          weekCashbackRewardModel,
        });

        // Emit the new spend transaction and current week data
        if (data !== null && data.gnosisPayTransactionJsonData) {
          socketIoServer.emit('newSpendTransaction', data.gnosisPayTransactionJsonData);
          socketIoServer.emit('currentWeekDataUpdated', data.weekCashbackRewardJsonData as any);
        }

        // Ignore already processed logs
        else if (error?.cause === 'LOG_ALREADY_PROCESSED') {
          logger.logDebug({
            message: `Spend log ${spendLog.transactionHash} already processed`,
            metadata: {
              spendLog,
            },
          });

          // Log other errors
        } else {
          throw error;
        }
      } catch (e) {
        const error = e as Error;

        console.error(error);

        logger.logError({
          message: `Error processing spend log (${spendLog.transactionHash}) at #${spendLog.blockNumber} with error: ${error.message}`,
          metadata: {
            originalError: error.message,
            spendLog,
          },
        });
      }
    }

    for (const refundLog of refundLogs) {
      console.log({ refundLog });
    }

    // Move to the next block range
    fromBlockNumber += indexBlockSize;
    toBlockNumber = clampToBlockRange(fromBlockNumber, latestBlock.number, indexBlockSize);

    // Sanity check to make sure we're not going too fast
    const distanceToLatestBlock = bigMath.abs(toBlockNumber - latestBlock.number);
    console.log({ distanceToLatestBlock });
    // Cooldown for 20 seconds if we're within a distance of 10 blocks
    if (distanceToLatestBlock < 10n) {
      const targetBlockNumber = toBlockNumber + indexBlockSize + 3n;

      console.log(`Waiting for #${targetBlockNumber}`);

      await logger.logDebug({
        message: `Waiting for #${targetBlockNumber} to continue indexing`,
      });

      await waitForBlock({
        client,
        blockNumber: targetBlockNumber,
      });
    }
  }
}
