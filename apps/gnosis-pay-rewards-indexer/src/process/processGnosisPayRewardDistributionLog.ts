import {
  GnosisPayRewardDistributionDocumentFieldsType,
  GnosisPayRewardDistributionModelType,
  toGnosisPayRewardDistributionDocumentId,
} from '@karpatkey/gnosis-pay-rewards-sdk/mongoose';
import { gnosisPayRewardDistributionSafeAddress, gnoToken } from '@karpatkey/gnosis-pay-rewards-sdk';
import { Address, formatUnits, isAddressEqual } from 'viem';
import { getGnosisPayRewardDistributionLogs } from '../gp/getGnosisPayRewardDistributionLogs.js';

type MongooseModels = {
  gnosisPayRewardDistributionModel: GnosisPayRewardDistributionModelType;
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

    if (!isAddressEqual(log.args.from as Address, gnosisPayRewardDistributionSafeAddress)) {
      throw new Error(`Invalid safe address: ${log.args.from}`, {
        cause: 'NOT_FROM_KARPATKEY_REWARD_DISTRIBUTION_SAFE',
      });
    }

    const documentId = toGnosisPayRewardDistributionDocumentId(transactionHash, log.args.to as Address);

    // Validate that the log has not already been processed
    const existingLog = await gnosisPayRewardDistributionModel.findById(documentId);
    if (existingLog !== null) {
      throw new Error(`Log already processed: ${documentId}`, {
        cause: 'LOG_ALREADY_PROCESSED',
      });
    }

    const distributionDocument = await new gnosisPayRewardDistributionModel<
      GnosisPayRewardDistributionDocumentFieldsType
    >({
      _id: documentId,
      amount: Number(formatUnits(log.args.value as bigint, gnoToken.decimals)),
      blockNumber: Number(blockNumber),
      transactionHash,
      safe: log.args.to?.toLowerCase() as Address,
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
