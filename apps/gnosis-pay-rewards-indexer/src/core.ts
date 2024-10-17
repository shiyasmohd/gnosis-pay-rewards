import {
  gnosisPayStartBlock,
  bigMath,
  gnosisPayTokens,
  IndexerStateAtomType,
  WeekIdFormatType,
} from '@karpatkey/gnosis-pay-rewards-sdk';
import {
  createGnosisPayTransactionModel,
  createTokenModel,
  saveGnosisPayTokensToDatabase,
  createMongooseLogger,
  createWeekMetricsSnapshotModel,
  createBlockModel,
  createWeekCashbackRewardModel,
  LogLevel,
  createGnosisTokenBalanceSnapshotModel,
  createGnosisPayRewardDistributionModel,
  createGnosisPaySafeAddressModel,
  createLoggerModel,
} from '@karpatkey/gnosis-pay-rewards-sdk/mongoose';
import { Mongoose } from 'mongoose';
import { atom, createStore } from 'jotai';
import { PublicClient, Transport } from 'viem';
import { gnosis } from 'viem/chains';

import { clampToBlockRange } from './utils.js';
import { buildSocketIoServer, buildExpressApp } from './server.js';
import { SOCKET_IO_SERVER_PORT, HTTP_SERVER_HOST, HTTP_SERVER_PORT } from './config/env.js';
import { waitForBlock } from './waitForBlock.js';

import { addHttpRoutes } from './addHttpRoutes.js';
import { addSocketComms } from './addSocketComms.js';
import { getGnosisPaySpendLogs } from './gp/getGnosisPaySpendLogs.js';
import { getGnosisPayRefundLogs } from './gp/getGnosisPayRefundLogs.js';
import { getGnosisTokenTransferLogs } from './gp/getGnosisTokenTransferLogs.js';
import { getGnosisPayRewardDistributionLogs } from './gp/getGnosisPayRewardDistributionLogs.js';
import { getGnosisPayClaimOgNftLogs } from './gp/getGnosisPayClaimOgNftLogs.js';
import { processRefundLog, processSpendLog } from './process/processSpendLog.js';
import { processGnosisTokenTransferLog } from './process/processGnosisTokenTransferLog.js';
import { processGnosisPayRewardDistributionLog } from './process/processGnosisPayRewardDistributionLog.js';
import { processGnosisPayClaimOgNftLog } from './process/processGnosisPayClaimOgNftLog.js';

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
    gnosisPaySafeAddressModel: ReturnType<typeof createGnosisPaySafeAddressModel>;
    gnosisPayTransactionModel: ReturnType<typeof createGnosisPayTransactionModel>;
    weekCashbackRewardModel: ReturnType<typeof createWeekCashbackRewardModel>;
    weekMetricsSnapshotModel: ReturnType<typeof createWeekMetricsSnapshotModel>;
    gnosisPayTokenModel: ReturnType<typeof createTokenModel>;
    loggerModel: ReturnType<typeof createLoggerModel>;
    blockModel: ReturnType<typeof createBlockModel>;
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

  console.log('Starting indexing');

  // Initialize the latest block
  const latestBlockInitial = await client.getBlock({ includeTransactions: false });
  const fromBlockNumberInitial = gnosisPayStartBlock;
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
      console.log(`Resuming indexing from ${fromBlockNumber}`);
    } else {
      console.warn(`No transactions found, starting from the beginning at block ${fromBlockNumberInitial}`);
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
      gnosisTokenBalanceSnapshotModel,
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
      const message = `Fetching logs from ${fromBlockNumber} to ${toBlockNumber}`;
      console.log(message);
      await logger.logDebug({ message });
    } catch (e) {}

    const getLogsCommonParams = {
      client,
      fromBlock: fromBlockNumber,
      toBlock: toBlockNumber,
      verbose: true,
    };

    // Fetch all the logs
    const spendLogs = await getGnosisPaySpendLogs(getLogsCommonParams);
    const refundLogs = await getGnosisPayRefundLogs(getLogsCommonParams);
    const gnosisTokenTransferLogs = await getGnosisTokenTransferLogs(getLogsCommonParams);
    const gnosisPayRewardDistributionLogs = await getGnosisPayRewardDistributionLogs(getLogsCommonParams);

    try {
      const message = `Found ${spendLogs.length} spend, ${refundLogs.length} refund, ${gnosisTokenTransferLogs.length} gnosis token transfers, and ${gnosisPayRewardDistributionLogs.length} gnosis pay reward distribution logs in block ${fromBlockNumber} to ${toBlockNumber}`;
      console.log(message);
      await logger.logDebug({ message, metadata: { fromBlockNumber, toBlockNumber } });
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
    });

    await handleGnosisPayRewardsDistributionLogs({
      client,
      mongooseModels: {
        gnosisPayRewardDistributionModel,
        weekCashbackRewardModel,
      },
      logs: gnosisPayRewardDistributionLogs,
      logger,
    });

    await handleGnosisPayOgNftTransferLogs({
      client,
      mongooseModels: {
        gnosisPaySafeAddressModel,
      },
      logs: claimOgNftLogs,
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
        const message = `Waiting for block ${targetBlockNumber} to continue indexing`;
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
}: WithLogger<{
  logs: (
    | Awaited<ReturnType<typeof getGnosisPaySpendLogs>>[0]
    | Awaited<ReturnType<typeof getGnosisPayRefundLogs>>[0]
  )[];
  client: PublicClient<Transport, typeof gnosis>;
  mongooseModels: Parameters<typeof processSpendLog>[0]['mongooseModels'];
  socketIoServer: ReturnType<typeof buildSocketIoServer>;
}>) {
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
}: WithLogger<
  Omit<Parameters<typeof processGnosisTokenTransferLog>[0], 'log'> & {
    logs: LogsType<typeof getGnosisTokenTransferLogs>;
  }
>) {
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
  client,
}: WithLogger<
  Omit<Parameters<typeof processGnosisPayRewardDistributionLog>[0], 'log'> & {
    logs: LogsType<typeof getGnosisPayRewardDistributionLogs>;
  }
>) {
  // Set of blocks to update
  const weekIdsSet = new Set<string>();
  const addressesPerWeek = new Map<
    string,
    {
      receivedRewardsCount: number;
      notReceivedRewardsCount: number;
    }
  >();

  for (const log of logs) {
    try {
      const { error, data } = await processGnosisPayRewardDistributionLog({
        log,
        mongooseModels,
        client,
      });

      if (error) throw error;

      if (data.week !== null) {
        const weekId = data.week;
        weekIdsSet.add(data.week);

        const weekData = addressesPerWeek.get(weekId) ?? {
          receivedRewardsCount: 0,
          notReceivedRewardsCount: 0,
        };

        weekData.receivedRewardsCount++;
        addressesPerWeek.set(weekId, weekData);
      }
    } catch (e) {
      handleError(logger, e as Error, log as any);
    }
  }

  // For each week id, update all the addresses that have not received a transaction to 0
  for (const week of Array.from(weekIdsSet) as WeekIdFormatType[]) {
    try {
      // Set each address that has not received a reward for the week to 0
      const query = {
        week,
        $and: [{ earnedReward: { $exists: false } }, { earnedReward: null }],
      };

      const queryResult = await mongooseModels.weekCashbackRewardModel.updateMany(query, {
        $set: {
          earnedReward: 0,
        },
      });

      const weekData = addressesPerWeek.get(week) ?? {
        receivedRewardsCount: 0,
        notReceivedRewardsCount: 0,
      };

      weekData.notReceivedRewardsCount += queryResult.modifiedCount;
      addressesPerWeek.set(week, weekData);
    } catch (e) {
      handleError(logger, e as Error, { blockNumber: 0n, eventName: 'none', transactionHash: 'none' });
    }
  }

  // Log the results
  for (const [week, { receivedRewardsCount, notReceivedRewardsCount }] of addressesPerWeek) {
    try {
      const message = `Week ${week} rewards distribution: ${receivedRewardsCount} received, ${notReceivedRewardsCount} not received`;
      console.log(message);
      await logger.logDebug({ message });
    } catch (e) {}
  }
}

async function handleGnosisPayOgNftTransferLogs({
  mongooseModels,
  logger,
  client,
  logs,
}: WithLogger<
  Omit<Parameters<typeof processGnosisPayClaimOgNftLog>[0], 'log'> & {
    logs: LogsType<typeof getGnosisPayClaimOgNftLogs>;
  }
>) {
  for (const log of logs) {
    try {
      const { error } = await processGnosisPayClaimOgNftLog({
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

function handleError(
  logger: ReturnType<typeof createMongooseLogger>,
  error: Error,
  logish: { eventName: string; transactionHash: string; blockNumber: bigint },
) {
  if (error.cause !== 'LOG_ALREADY_PROCESSED') {
    console.error(error);
  }

  logger.log({
    level: error.cause === 'LOG_ALREADY_PROCESSED' ? LogLevel.WARN : LogLevel.ERROR,
    message: `Error processing ${logish.eventName} log (${logish.transactionHash}) at block ${logish.blockNumber} with error: ${error.message}`,
    metadata: {
      originalError: error.message,
      log: {
        ...logish,
        blockNumber: Number(logish.blockNumber),
      },
    },
  });
}

type WithLogger<T> = T & {
  logger: ReturnType<typeof createMongooseLogger>;
};

type LogsType<FunctionType extends (...args: any[]) => unknown> = Awaited<ReturnType<FunctionType>>;
