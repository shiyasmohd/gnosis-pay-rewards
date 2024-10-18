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

    const safeAddress = log.args.to.toLowerCase() as Address;

    if (!safeAddress || !isAddress(safeAddress)) {
      throw new Error(`Invalid to address: ${safeAddress}`, {
        cause: 'NOT_ADDRESS',
      });
    }

    const block = await getBlockByNumber({
      blockNumber,
      client,
    });

    const documentId = toGnosisPayRewardDistributionDocumentId(transactionHash, safeAddress);
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
        safe: safeAddress,
        week: lastWeekId,
      });

    await distributionDocument.save({ session: mongooseSession });

    // Update the week cashback reward document
    await mongooseModels.weekCashbackRewardModel.findOneAndUpdate(
      {
        week: lastWeekId,
        safe: safeAddress,
      },
      {
        $set: {
          earnedReward: distributionDocument.amount,
        },
      },
      { session: mongooseSession },
    );

    await mongooseSession.commitTransaction();
    await mongooseSession.endSession();

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
