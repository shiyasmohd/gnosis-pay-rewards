process.env.TZ = 'UTC'; // Set the timezone to UTC
import './sentry.js'; // imported first to setup sentry
import { gnosisChainPublicClient as client } from './publicClient.js';
import { startIndexing, StartIndexingParamsType } from './core.js';
import { FETCH_BLOCK_SIZE, MONGODB_URI, RESUME_INDEXING } from './config/env.js';
import {
  createConnection,
  createGnosisPayRewardDistributionModel,
  createGnosisTokenBalanceSnapshotModel,
  createMongooseLogger,
  getBlockModel,
  getGnosisPaySafeAddressModel,
  getGnosisPayTransactionModel,
  getLoggerModel,
  getTokenModel,
  getWeekCashbackRewardModel,
  getWeekMetricsSnapshotModel,
} from '@karpatkey/gnosis-pay-rewards-sdk/mongoose';

async function main(resumeIndexing: boolean = RESUME_INDEXING) {
  try {
    const mongooseConnection = await createConnection(MONGODB_URI);

    console.log('Connected to mongodb at', mongooseConnection.connection.host);

    const mongooseModels: StartIndexingParamsType['mongooseModels'] = {
      gnosisPaySafeAddressModel: getGnosisPaySafeAddressModel(mongooseConnection),
      gnosisPayTransactionModel: getGnosisPayTransactionModel(mongooseConnection),
      weekCashbackRewardModel: getWeekCashbackRewardModel(mongooseConnection),
      weekMetricsSnapshotModel: getWeekMetricsSnapshotModel(mongooseConnection),
      gnosisPayTokenModel: getTokenModel(mongooseConnection),
      loggerModel: getLoggerModel(mongooseConnection),
      blockModel: getBlockModel(mongooseConnection),
      gnosisTokenBalanceSnapshotModel: createGnosisTokenBalanceSnapshotModel(mongooseConnection),
      gnosisPayRewardDistributionModel: createGnosisPayRewardDistributionModel(mongooseConnection),
    };

    const logger = createMongooseLogger(mongooseModels.loggerModel);

    await startIndexing({
      client,
      fetchBlockSize: FETCH_BLOCK_SIZE,
      mongooseConnection,
      mongooseModels,
      logger,
      resumeIndexing,
    });
  } catch (e) {
    main(true);
  }
}

main();
