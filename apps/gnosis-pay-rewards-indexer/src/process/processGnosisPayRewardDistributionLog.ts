import {
  getGnosisPaySafeAddressModel,
  createGnosisPayRewardDistributionModel,
  GnosisPayRewardDistributionDocumentFieldsType,
} from '@karpatkey/gnosis-pay-rewards-sdk/mongoose';
import { gnosisPayRewardDistributionSafeAddress, gnoToken } from '@karpatkey/gnosis-pay-rewards-sdk';
import { Address, formatUnits, isAddressEqual } from 'viem';
import { getGnosisPayRewardDistributionLogs } from '../gp/getGnosisPayRewardDistributionLogs.js';

type MongooseModels = {
  gnosisPaySafeAddressModel: ReturnType<typeof getGnosisPaySafeAddressModel>;
  gnosisPayRewardDistributionModel: ReturnType<typeof createGnosisPayRewardDistributionModel>;
};

export async function processGnosisPayRewardDistributionLog({
  log,
  mongooseModels,
}: {
  // client: GnosisChainPublicClient;
  log: Awaited<ReturnType<typeof getGnosisPayRewardDistributionLogs>>[number];
  mongooseModels: MongooseModels;
}) {
  try {
    const { blockNumber, transactionHash } = log;
    const { gnosisPayRewardDistributionModel } = mongooseModels;

    if (!isAddressEqual(log.args.from, gnosisPayRewardDistributionSafeAddress)) {
      throw new Error(`Invalid safe address: ${log.args.from}`, {
        cause: 'NOT_FROM_KARPATKEY_REWARD_DISTRIBUTION_SAFE',
      });
    }

    // Validate that the log has not already been processed
    await validateLogIsNotAlreadyProcessed(gnosisPayRewardDistributionModel, transactionHash);

    const distributionDocument = await new gnosisPayRewardDistributionModel<
      GnosisPayRewardDistributionDocumentFieldsType
    >({
      _id: transactionHash,
      amount: Number(formatUnits(log.args.value, gnoToken.decimals)),
      blockNumber: Number(blockNumber),
      transactionHash,
      safe: log.args.to.toLowerCase() as Address,
    }).save();

    const distributionJson = distributionDocument.toJSON();

    return {
      data: distributionJson,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error as Error,
    };
  }
}

async function validateLogIsNotAlreadyProcessed(
  gnosisPayRewardDistributionModel: MongooseModels['gnosisPayRewardDistributionModel'],
  transactionHash: string
) {
  const existingLog = await gnosisPayRewardDistributionModel.findOne({ transactionHash });
  if (existingLog !== null) {
    throw new Error(`Log already processed: ${transactionHash}`, {
      cause: 'LOG_ALREADY_PROCESSED',
    });
  }
}
