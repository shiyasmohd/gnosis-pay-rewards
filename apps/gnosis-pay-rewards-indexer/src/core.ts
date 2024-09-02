import { gnosisPayStartBlock, bigMath, gnosisPayTokens, IndexerStateAtomType } from '@karpatkey/gnosis-pay-rewards-sdk';
import {
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
  createGnosisTokenBalanceSnapshotModel,
  createGnosisPayRewardDistributionModel,
} from '@karpatkey/gnosis-pay-rewards-sdk/mongoose';
import { Mongoose } from 'mongoose';
import { atom, createStore } from 'jotai';
import { PublicClient, Transport } from 'viem';
import { gnosis } from 'viem/chains';

import { getGnosisPaySpendLogs } from './gp/getGnosisPaySpendLogs.js';
import { clampToBlockRange } from './utils.js';
import { buildSocketIoServer, buildExpressApp } from './server.js';
import { SOCKET_IO_SERVER_PORT, HTTP_SERVER_HOST, HTTP_SERVER_PORT } from './config/env.js';
import { waitForBlock } from './waitForBlock.js';

import { addHttpRoutes } from './addHttpRoutes.js';
import { addSocketComms } from './addSocketComms.js';
import { processRefundLog, processSpendLog } from './process/processSpendLog.js';
import { processGnosisTokenTransferLog } from './process/processGnosisTokenTransferLog.js';
import { processGnosisPayRewardDistributionLog } from './process/processGnosisPayRewardDistributionLog.js';
import { getGnosisPayRefundLogs } from './gp/getGnosisPayRefundLogs.js';
import { getGnosisTokenTransferLogs } from './gp/getGnosisTokenTransferLogs.js';
import { getGnosisPayRewardDistributionLogs } from './gp/getGnosisPayRewardDistributionLogs.js';

export type StartIndexingParamsType = {
  client: PublicClient<Transport, typeof gnosis>;
  /**
   * If true, the indexer will resume indexing from the latest pending reward in the database.
   * If the database is empty, the indexer will start indexing from the Gnosis Pay start block.
   * See {@link gnosisPayStartBlock} for the start block.
   */
  readonly resumeIndexing?: boolean;
  readonly fetchBlockSize?: bigint;
  mongooseConnection: Mongoose;
  mongooseModels: {
    gnosisPaySafeAddressModel: ReturnType<typeof getGnosisPaySafeAddressModel>;
    gnosisPayTransactionModel: ReturnType<typeof getGnosisPayTransactionModel>;
    weekCashbackRewardModel: ReturnType<typeof getWeekCashbackRewardModel>;
    weekMetricsSnapshotModel: ReturnType<typeof getWeekMetricsSnapshotModel>;
    gnosisPayTokenModel: ReturnType<typeof getTokenModel>;
    loggerModel: ReturnType<typeof getLoggerModel>;
    blockModel: ReturnType<typeof getBlockModel>;
    gnosisTokenBalanceSnapshotModel: ReturnType<typeof createGnosisTokenBalanceSnapshotModel>;
    gnosisPayRewardDistributionModel: ReturnType<typeof createGnosisPayRewardDistributionModel>;
  };
  logger: ReturnType<typeof createMongooseLogger>;
};

export async function startIndexing({
  client,
  resumeIndexing = false,
  fetchBlockSize = 12n * 5n,
  mongooseConnection,
  mongooseModels,
  logger,
}: StartIndexingParamsType) {
  const {
    gnosisPayRewardDistributionModel,
    gnosisPaySafeAddressModel,
    gnosisPayTransactionModel,
    gnosisTokenBalanceSnapshotModel,
    weekCashbackRewardModel,
    weekMetricsSnapshotModel,
  } = mongooseModels;

  console.log('Migrating Gnosis Pay tokens to database');

  console.log('Starting indexing');

  // Initialize the latest block
  const latestBlockInitial = await client.getBlock({ includeTransactions: false });
  // default value is June 29th, 2024. Otherwise, we fetch the latest block from the indexed pending rewards
  // const fromBlockNumberInitial = gnosisPayStartBlock;
  const fromBlockNumberInitial = 35790982n;
  const toBlockNumberInitial = clampToBlockRange(fromBlockNumberInitial, latestBlockInitial.number, fetchBlockSize);

  const indexerStateAtom = atom<IndexerStateAtomType>({
    startBlock: fromBlockNumberInitial,
    fetchBlockSize,
    latestBlockNumber: latestBlockInitial.number,
    distanceToLatestBlockNumber: bigMath.abs(latestBlockInitial.number - fromBlockNumberInitial),
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
      const fromBlockNumber = BigInt(latestGnosisPayTransaction.blockNumber) - 1n;
      const toBlockNumber = clampToBlockRange(fromBlockNumber, latestBlockInitial.number, fetchBlockSize);

      indexerStateStore.set(indexerStateAtom, (prev) => ({
        ...prev,
        startBlock: fromBlockNumber,
        distanceToLatestBlockNumber: bigMath.abs(latestBlockInitial.number - fromBlockNumber),
        fromBlockNumber,
        toBlockNumber,
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
    client,
    mongooseModels: {
      gnosisPaySafeAddressModel,
      gnosisPayTransactionModel,
      weekCashbackRewardModel,
      gnosisPayRewardDistributionModel,
      weekMetricsSnapshotModel,
    },
    logger,
    getIndexerState() {
      return indexerStateStore.get(indexerStateAtom);
    },
  });

  const socketIoServer = addSocketComms({
    socketIoServer: buildSocketIoServer(restApiServer),
    gnosisPayTransactionModel,
    weekMetricsSnapshotModel,
  });

  restApiServer.listen(HTTP_SERVER_PORT, HTTP_SERVER_HOST);
  socketIoServer.listen(SOCKET_IO_SERVER_PORT);

  const apiServerUrl = `http://${HTTP_SERVER_HOST}:${HTTP_SERVER_PORT}`;
  const wsServerUrl = `ws://${HTTP_SERVER_HOST}:${SOCKET_IO_SERVER_PORT}`;

  console.log('WebSocket server available at', wsServerUrl);
  console.log('REST API server available at', apiServerUrl);

  // Index all the logs until the latest block
  while (shouldFetchLogs(getIndexerState)) {
    const { fromBlockNumber, toBlockNumber, latestBlockNumber } = getIndexerState();

    try {
      const message = `Fetching logs from #${fromBlockNumber} to #${toBlockNumber}`;
      console.log(message);
      await logger.logDebug({ message });
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

    const gnosisTokenTransferLogs = await getGnosisTokenTransferLogs({
      client,
      fromBlock: fromBlockNumber,
      toBlock: toBlockNumber,
      verbose: true,
    });

    const gnosisPayRewardDistributionLogs = await getGnosisPayRewardDistributionLogs({
      client,
      fromBlock: fromBlockNumber,
      toBlock: toBlockNumber,
      verbose: true,
    });

    try {
      const message = `Found ${spendLogs.length} spend logs, ${refundLogs.length} refund logs, ${gnosisTokenTransferLogs.length} gnosis token transfer logs, and ${gnosisPayRewardDistributionLogs.length} gnosis pay reward distribution logs in #${fromBlockNumber} to #${toBlockNumber}`;
      console.log(message);
      await logger.logDebug({ message });
    } catch (e) {}

    await handleBatchLogs({
      client,
      mongooseModels: {
        gnosisPayTransactionModel,
        weekCashbackRewardModel,
        weekMetricsSnapshotModel,
        gnosisPaySafeAddressModel,
        gnosisTokenBalanceSnapshotModel,
      },
      logs: [...spendLogs, ...refundLogs],
      logger,
      socketIoServer,
    });

    await handleGnosisTokenTransferLogs({
      client,
      mongooseModels: {
        gnosisPaySafeAddressModel,
        gnosisTokenBalanceSnapshotModel,
        weekCashbackRewardModel,
      },
      logs: gnosisTokenTransferLogs,
      logger,
      socketIoServer,
    });

    await handleGnosisPayRewardsDistributionLogs({
      mongooseModels: {
        gnosisPayRewardDistributionModel,
      },
      logs: gnosisPayRewardDistributionLogs,
      logger,
    });

    // Move to the next block range
    const nextFromBlockNumber = fromBlockNumber + fetchBlockSize;
    const nextToBlockNumber = clampToBlockRange(nextFromBlockNumber, latestBlockNumber, fetchBlockSize);
    // Sanity check to make sure we're not going too fast
    const distanceToLatestBlockNumber = bigMath.abs(nextToBlockNumber - latestBlockNumber);

    indexerStateStore.set(indexerStateAtom, (prev) => ({
      ...prev,
      fromBlockNumber: nextFromBlockNumber,
      distanceToLatestBlockNumber,
      toBlockNumber: nextToBlockNumber,
    }));

    console.log('distance to latest block', Number(distanceToLatestBlockNumber));

    // Cooldown for 20 seconds if we're within a distance of 10 blocks
    if (distanceToLatestBlockNumber <= 10n) {
      const targetBlockNumber = toBlockNumber + fetchBlockSize + 3n;

      try {
        const message = `Waiting for #${targetBlockNumber} to continue indexing`;
        console.log(message);
        await logger.logDebug({ message });
      } catch (e) {}

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

        if (error) throw error;

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

        if (error) throw error;

        if (data !== null) {
          socketIoServer.emit('newRefundTransaction', data.gnosisPayTransaction);
          socketIoServer.emit('newTransaction', data.gnosisPayTransaction);
          socketIoServer.emit('currentWeekMetricsSnapshotUpdated', data.weekMetricsSnapshot);
        }
      }
    } catch (e) {
      handleError(logger, e as Error, log as any);
    }
  }
}

async function handleGnosisTokenTransferLogs({
  client,
  mongooseModels,
  logger,
  logs,
}: {
  logs: Awaited<ReturnType<typeof getGnosisTokenTransferLogs>>;
  client: PublicClient<Transport, typeof gnosis>;
  mongooseModels: Parameters<typeof processGnosisTokenTransferLog>[0]['mongooseModels'];
  logger: ReturnType<typeof createMongooseLogger>;
  socketIoServer: ReturnType<typeof buildSocketIoServer>;
}) {
  for (const log of logs) {
    try {
      const { error } = await processGnosisTokenTransferLog({
        client,
        log,
        mongooseModels,
      });

      if (error) throw error;
    } catch (e) {
      handleError(logger, e as Error, log as any);
    }
  }
}

async function handleGnosisPayRewardsDistributionLogs({
  mongooseModels,
  logger,
  logs,
}: {
  logs: Awaited<ReturnType<typeof getGnosisPayRewardDistributionLogs>>;
  mongooseModels: Parameters<typeof processGnosisPayRewardDistributionLog>[0]['mongooseModels'];
  logger: ReturnType<typeof createMongooseLogger>;
}) {
  for (const log of logs) {
    try {
      const { error } = await processGnosisPayRewardDistributionLog({
        log,
        mongooseModels,
      });

      if (error) throw error;
    } catch (e) {
      handleError(logger, e as Error, log as any);
    }
  }
}

function handleError(
  logger: ReturnType<typeof createMongooseLogger>,
  error: Error,
  logish: { eventName: string; transactionHash: string; blockNumber: number }
) {
  if (error.cause !== 'LOG_ALREADY_PROCESSED') {
    console.error(error);
  }

  logger.log({
    level: error.cause === 'LOG_ALREADY_PROCESSED' ? LogLevel.WARN : LogLevel.ERROR,
    message: `Error processing ${logish.eventName} log (${logish.transactionHash}) at #${logish.blockNumber} with error: ${error.message}`,
    metadata: {
      originalError: error.message,
      log: logish,
    },
  });
}
