import { gnosisPayStartBlock, bigMath, gnosisPayTokens } from '@karpatkey/gnosis-pay-rewards-sdk';
import {
  createConnection,
  getGnosisPayTransactionModel,
  getTokenModel,
  saveGnosisPayTokensToDatabase,
  createMongooseLogger,
  getLoggerModel,
  getWeekMetricsSnapshotModel,
  getBlockModel,
  getGnosisPaySafeAddressModel,
  getWeekCashbackRewardModel,
  LogLevel,
} from '@karpatkey/gnosis-pay-rewards-sdk/mongoose';
import { PublicClient, Transport } from 'viem';
import { gnosis } from 'viem/chains';

import { getGnosisPaySpendLogs } from './gp/getGnosisPaySpendLogs.js';
import { clampToBlockRange } from './utils.js';
import { buildSocketIoServer, buildExpressApp } from './server.js';
import { SOCKET_IO_SERVER_PORT, MONGODB_URI, HTTP_SERVER_HOST, HTTP_SERVER_PORT } from './config/env.js';
import { waitForBlock } from './waitForBlock.js';

import { addHttpRoutes } from './addHttpRoutes.js';
import { addSocketComms } from './addSocketComms.js';
import { processRefundLog, processSpendLog } from './processSpendLog.js';
import { getGnosisPayRefundLogs } from './gp/getGnosisPayRefundLogs.js';
import { atom, createStore } from 'jotai';
import { IndexerStateAtomType } from './state.js';

const indexBlockSize = 120n; // 12 blocks is roughly 60 seconds of data

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

  console.log('Connected to mongodb at', mongooseConnection.connection.host);

  console.log('Migrating Gnosis Pay tokens to database');

  const mongooseModels = {
    gnosisPaySafeAddressModel: getGnosisPaySafeAddressModel(mongooseConnection),
    gnosisPayTransactionModel: getGnosisPayTransactionModel(mongooseConnection),
    weekCashbackRewardModel: getWeekCashbackRewardModel(mongooseConnection),
    weekMetricsSnapshotModel: getWeekMetricsSnapshotModel(mongooseConnection),
    gnosisPayTokenModel: getTokenModel(mongooseConnection),
    loggerModel: getLoggerModel(mongooseConnection),
    blockModel: getBlockModel(mongooseConnection),
  };

  const logger = createMongooseLogger(mongooseModels.loggerModel);

  console.log('Starting indexing');

  // Initialize the latest block
  const latestBlockInitial = await client.getBlock({ includeTransactions: false });
  // default value is June 29th, 2024. Otherwise, we fetch the latest block from the indexed pending rewards
  const fromBlockNumberInitial = gnosisPayStartBlock;
  const toBlockNumberInitial = clampToBlockRange(fromBlockNumberInitial, latestBlockInitial.number, indexBlockSize);

  const indexerStateAtom = atom<IndexerStateAtomType>({
    latestBlockNumber: latestBlockInitial.number,
    fromBlockNumber: fromBlockNumberInitial,
    toBlockNumber: toBlockNumberInitial,
  });
  const indexerStateStore = createStore();
  const getIndexerState = () => indexerStateStore.get(indexerStateAtom);

  if (resumeIndexing === true) {
    const [latestGnosisPayTransaction] = await mongooseModels.gnosisPayTransactionModel
      .find()
      .sort({ blockNumber: -1 })
      .limit(1);

    if (latestGnosisPayTransaction !== undefined) {
      const fromBlockNumber = BigInt(latestGnosisPayTransaction.blockNumber) - indexBlockSize;
      indexerStateStore.set(indexerStateAtom, (prev) => ({
        ...prev,
        fromBlockNumber,
      }));
      console.log(`Resuming indexing from #${fromBlockNumber}`);
    } else {
      console.warn(`No pending rewards found, starting from the beginning at #${fromBlockNumberInitial}`);
    }
  } else {
    const session = await mongooseConnection.startSession();
    // Clean up the database
    await session.withTransaction(async () => {
      for (const modelName of mongooseConnection.modelNames()) {
        await mongooseConnection.model(modelName).deleteMany();
      }
    });
    await session.commitTransaction();
    await session.endSession();
    // Save the Gnosis Pay tokens to the database
    await saveGnosisPayTokensToDatabase(mongooseModels.gnosisPayTokenModel, gnosisPayTokens);
  }

  // Watch for new blocks
  client.watchBlocks({
    includeTransactions: false,
    onBlock(block) {
      indexerStateStore.set(indexerStateAtom, (prev) => ({
        ...prev,
        latestBlockNumber: block.number,
      }));
    },
  });

  const restApiServer = addHttpRoutes({
    expressApp: buildExpressApp(),
    gnosisPayTransactionModel: mongooseModels.gnosisPayTransactionModel,
    weekCashbackRewardModel: mongooseModels.weekCashbackRewardModel,
    logger,
    getIndexerState() {
      return indexerStateStore.get(indexerStateAtom);
    },
  });

  const socketIoServer = addSocketComms({
    socketIoServer: buildSocketIoServer(restApiServer),
    gnosisPayTransactionModel: mongooseModels.gnosisPayTransactionModel,
    weekMetricsSnapshotModel: mongooseModels.weekMetricsSnapshotModel,
  });

  restApiServer.listen(HTTP_SERVER_PORT, HTTP_SERVER_HOST);
  socketIoServer.listen(SOCKET_IO_SERVER_PORT);

  // Index all the logs until the latest block
  while (shouldFetchLogs(getIndexerState)) {
    const { fromBlockNumber, toBlockNumber, latestBlockNumber } = getIndexerState();

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

    await handleBatchLogs({
      client,
      mongooseModels: {
        gnosisPayTransactionModel: mongooseModels.gnosisPayTransactionModel,
        weekCashbackRewardModel: mongooseModels.weekCashbackRewardModel,
        weekMetricsSnapshotModel: mongooseModels.weekMetricsSnapshotModel,
        gnosisPaySafeAddressModel: mongooseModels.gnosisPaySafeAddressModel,
      },
      logs: [...spendLogs, ...refundLogs],
      logger,
      socketIoServer,
    });

    // Move to the next block range
    const nextFromBlockNumber = fromBlockNumber + indexBlockSize;
    const nextToBlockNumber = clampToBlockRange(nextFromBlockNumber, latestBlockNumber, indexBlockSize);

    indexerStateStore.set(indexerStateAtom, (prev) => ({
      ...prev,
      fromBlockNumber: nextFromBlockNumber,
      toBlockNumber: nextToBlockNumber,
    }));

    // Sanity check to make sure we're not going too fast
    const distanceToLatestBlock = bigMath.abs(nextToBlockNumber - latestBlockNumber);
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

function shouldFetchLogs(getIndexerState: () => IndexerStateAtomType) {
  const { toBlockNumber, latestBlockNumber } = getIndexerState();

  return toBlockNumber <= latestBlockNumber;
}

async function handleBatchLogs({
  client,
  mongooseModels,
  socketIoServer,
  logger,
  logs,
}: {
  logs: (
    | Awaited<ReturnType<typeof getGnosisPaySpendLogs>>[0]
    | Awaited<ReturnType<typeof getGnosisPayRefundLogs>>[0]
  )[];
  client: PublicClient<Transport, typeof gnosis>;
  mongooseModels: Parameters<typeof processSpendLog>[0]['mongooseModels'];
  logger: ReturnType<typeof createMongooseLogger>;
  socketIoServer: ReturnType<typeof buildSocketIoServer>;
}) {
  for (const log of logs) {
    try {
      if (log.eventName === 'Spend') {
        const { data, error } = await processSpendLog({
          client,
          log,
          mongooseModels,
        });

        if (error) {
          throw error;
        }

        if (data !== null) {
          socketIoServer.emit('newSpendTransaction', data.gnosisPayTransaction);
          socketIoServer.emit('newTransaction', data.gnosisPayTransaction);
          socketIoServer.emit('currentWeekMetricsSnapshotUpdated', data.weekMetricsSnapshot);
        }
      } else if (log.eventName === 'Transfer') {
        const { data, error } = await processRefundLog({
          client,
          log,
          mongooseModels,
        });

        if (error) {
          throw error;
        }

        if (data !== null) {
          socketIoServer.emit('newRefundTransaction', data.gnosisPayTransaction);
          socketIoServer.emit('newTransaction', data.gnosisPayTransaction);
          socketIoServer.emit('currentWeekMetricsSnapshotUpdated', data.weekMetricsSnapshot);
        }
      }
    } catch (e) {
      const error = e as Error;

      console.error(error);

      logger.log({
        level: error.cause === 'LOG_ALREADY_PROCESSED' ? LogLevel.WARN : LogLevel.ERROR,
        message: `Error processing ${log.eventName} log (${log.transactionHash}) at #${log.blockNumber} with error: ${error.message}`,
        metadata: {
          originalError: error.message,
          log,
        },
      });
    }
  }
}
