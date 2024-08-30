import {
  createConnection,
  getWeekCashbackRewardModel,
  getWeekMetricsSnapshotModel,
  getBlockModel,
  getTokenModel,
  getGnosisPaySafeAddressModel,
  getGnosisPayTransactionModel,
  createGnosisPayRewardDistributionModel,
  createGnosisTokenBalanceSnapshotModel,
} from '@karpatkey/gnosis-pay-rewards-sdk/mongoose';
import { privateKeyToAccount } from 'viem/accounts';
import { PublicClient, Transport } from 'viem';
import { gnosis } from 'viem/chains';

import { addHttpRoutes } from './addHttpRoutes.js';
import {
  MONGODB_URI,
  HTTP_SERVER_HOST,
  HTTP_SERVER_PORT,
  GNOSIS_SAFE_ADDRESS_PROPOSER_PRIVATE_KEY,
} from './config/env.js';
import { buildExpressApp } from './server.js';

export async function startApp({}: { client: PublicClient<Transport, typeof gnosis> }) {
  // Connect to the database
  const mongooseConnection = await createConnection(MONGODB_URI);

  const weekCashbackRewardModel = getWeekCashbackRewardModel(mongooseConnection);
  const weekMetricsSnapshotModel = getWeekMetricsSnapshotModel(mongooseConnection);
  // Register other models so mongoose can refer them
  getBlockModel(mongooseConnection);
  getTokenModel(mongooseConnection);
  getGnosisPaySafeAddressModel(mongooseConnection);
  getGnosisPayTransactionModel(mongooseConnection);
  createGnosisPayRewardDistributionModel(mongooseConnection);
  createGnosisTokenBalanceSnapshotModel(mongooseConnection);

  const proposerAccount = privateKeyToAccount(GNOSIS_SAFE_ADDRESS_PROPOSER_PRIVATE_KEY);

  const restApiServer = addHttpRoutes({
    expressApp: buildExpressApp(),
    weekCashbackRewardModel,
    weekMetricsSnapshotModel,
    proposerAccount,
  });

  restApiServer.listen(HTTP_SERVER_PORT, HTTP_SERVER_HOST, () => {
    console.log(`Server is running on http://${HTTP_SERVER_HOST}:${HTTP_SERVER_PORT}`);
  });
}
