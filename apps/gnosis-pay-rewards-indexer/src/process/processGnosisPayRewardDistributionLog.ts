import {
  GnosisPayRewardDistributionDocumentFieldsType,
  GnosisPayRewardDistributionModelType,
  toGnosisPayRewardDistributionDocumentId,
  WeekCashbackRewardModelType,
} from '@karpatkey/gnosis-pay-rewards-sdk/mongoose';
import { gnosisPayRewardDistributionSafeAddress, gnoToken, toWeekId } from '@karpatkey/gnosis-pay-rewards-sdk';
import { Address, formatUnits, isAddress, isAddressEqual } from 'viem';
import { getGnosisPayRewardDistributionLogs } from '../gp/getGnosisPayRewardDistributionLogs.js';
import { getBlockByNumber } from './actions.js';
import { GnosisChainPublicClient } from './types.js';

type MongooseModels = {
  gnosisPayRewardDistributionModel: GnosisPayRewardDistributionModelType;
  weekCashbackRewardModel: WeekCashbackRewardModelType;
};

/**
 * Handles the distribution of rewards for a given week.
 * Creates a new reward distribution document and updates the `earnedReward` field of the corresponding week cashback reward document.
 */
export async function processGnosisPayRewardDistributionLog({
  log,
  mongooseModels,
  client,
}: {
  // client: GnosisChainPublicClient;
  log: Awaited<ReturnType<typeof getGnosisPayRewardDistributionLogs>>[number];
  mongooseModels: MongooseModels;
  client: GnosisChainPublicClient;
}) {
  try {
    const { blockNumber, transactionHash } = log;
    const { gnosisPayRewardDistributionModel } = mongooseModels;

    if (!isAddressEqual(log.args.from as Address, gnosisPayRewardDistributionSafeAddress)) {
      throw new Error(`Invalid from address: ${log.args.from}`, {
        cause: 'NOT_FROM_KARPATKEY_REWARD_DISTRIBUTION_SAFE',
      });
    }

    if (!log.args.to || !isAddress(log.args.to)) {
      throw new Error(`Invalid to address: ${log.args.to}`, {
        cause: 'NOT_ADDRESS',
      });
    }

    const block = await getBlockByNumber({
      blockNumber,
      client,
    });

    const documentId = toGnosisPayRewardDistributionDocumentId(transactionHash, log.args.to as Address);
    // Get the last week id
    // Distributions are for the last week happen on the current week, so we roll back one week
    const lastWeekId = toWeekId(block.timestamp, 1);

    // Validate that the log has not already been processed
    const existingLog = await gnosisPayRewardDistributionModel.findById(documentId);
    if (existingLog !== null) {
      throw new Error(`Log already processed: ${documentId}`, {
        cause: 'LOG_ALREADY_PROCESSED',
      });
    }

    const mongooseSession = await mongooseModels.gnosisPayRewardDistributionModel.startSession();
    mongooseSession.startTransaction();

    const distributionDocument =
      await new gnosisPayRewardDistributionModel<GnosisPayRewardDistributionDocumentFieldsType>({
        _id: documentId,
        amount: Number(formatUnits(log.args.value as bigint, gnoToken.decimals)),
        blockNumber: Number(blockNumber),
        transactionHash,
        safe: log.args.to.toLowerCase() as Address,
        week: lastWeekId,
      });

    await distributionDocument.save({ session: mongooseSession });

    await mongooseModels.weekCashbackRewardModel.findOneAndUpdate(
      {
        week: lastWeekId,
        safe: log.args.to.toLowerCase() as Address,
      },
      {
        $set: {
          earnedReward: distributionDocument.amount,
        },
      },
    );

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
