import {
  createGnosisTokenBalanceSnapshotModel,
  getGnosisPaySafeAddressModel,
  getWeekCashbackRewardModel,
  toDocumentId,
} from '@karpatkey/gnosis-pay-rewards-sdk/mongoose';
import { GnosisTokenBalanceSnapshotDocumentType, gnoToken, toWeekDataId } from '@karpatkey/gnosis-pay-rewards-sdk';
import { GnosisChainPublicClient } from './types';
import { getGnosisTokenTransferLogs } from '../gp/getGnosisTokenTransferLogs';
import { isGnosisPaySafeAddress } from '../gp/isGnosisPaySafeAddress.js';
import { getBlockByNumber as getBlockByNumberCore } from '../getBlockByNumber.js';
import { erc20Abi, formatUnits } from 'viem';

type MongooseModels = {
  gnosisPaySafeAddressModel: ReturnType<typeof getGnosisPaySafeAddressModel>;
  gnosisTokenBalanceSnapshotModel: ReturnType<typeof createGnosisTokenBalanceSnapshotModel>;
  weekCashbackRewardModel: ReturnType<typeof getWeekCashbackRewardModel>;
};

export async function processGnosisTokenTransferLog({
  client,
  log,
  mongooseModels,
}: {
  client: GnosisChainPublicClient;
  log: Awaited<ReturnType<typeof getGnosisTokenTransferLogs>>[number];
  mongooseModels: MongooseModels;
}) {
  try {
    const { blockNumber, transactionHash } = log;
    const { gnosisPaySafeAddressModel, gnosisTokenBalanceSnapshotModel, weekCashbackRewardModel } = mongooseModels;
    const { from, to } = log.args;

    // Validate that the log has not already been processed
    await validateLogIsNotAlreadyProcessed(mongooseModels.gnosisTokenBalanceSnapshotModel, transactionHash);

    const [isSenderGnosisPaySafe, isReceiverGnosisPaySafe] = await Promise.all(
      [from, to].map((address) =>
        isGnosisPaySafeAddress({
          address,
          client,
          gnosisPaySafeAddressModel,
        })
      )
    );

    // If either the sender or receiver is a Gnosis Pay Safe,
    // take a snapshot of the Gnosis Pay Safe's balance
    if (!isSenderGnosisPaySafe && !isReceiverGnosisPaySafe) {
      throw new Error('Neither sender nor receiver is a Gnosis Pay Safe');
    }

    const safeAddress = isSenderGnosisPaySafe ? from : to;

    // Fetch the block to get the timestamp
    const block = await getBlockByNumber({
      blockNumber,
      client,
    });

    const gnoBalanceRaw = await client.readContract({
      abi: erc20Abi,
      address: gnoToken.address,
      args: [safeAddress],
      blockNumber,
      functionName: 'balanceOf',
    });

    const weekId = toWeekDataId(Number(block.timestamp));

    const mongooseSession = await gnosisTokenBalanceSnapshotModel.startSession();
    mongooseSession.startTransaction();

    // Create the Gnosis token balance snapshot
    const gnoBalanceSnapshotDocument = await new gnosisTokenBalanceSnapshotModel<
      GnosisTokenBalanceSnapshotDocumentType
    >({
      blockNumber: Number(blockNumber),
      safe: safeAddress,
      balance: Number(formatUnits(gnoBalanceRaw, gnoToken.decimals)),
      balanceRaw: gnoBalanceRaw.toString(),
      blockTimestamp: Number(block.timestamp),
      weekId,
    }).save({ session: mongooseSession });

    // Update the week cashback reward
    await weekCashbackRewardModel.findByIdAndUpdate(
      toDocumentId(weekId, safeAddress),
      { $push: { gnoBalanceSnapshots: gnoBalanceSnapshotDocument.id } },
      { session: mongooseSession }
    );

    // Update the Gnosis Pay Safe's gnoBalanceSnapshots
    await gnosisPaySafeAddressModel.updateOne(
      { _id: safeAddress },
      {
        $push: {
          gnoBalanceSnapshots: gnoBalanceSnapshotDocument.id,
        },
      },
      { session: mongooseSession }
    );

    await mongooseSession.commitTransaction();
    await mongooseSession.endSession();

    return {
      data: gnoBalanceSnapshotDocument.toJSON(),
      error: null,
    };
  } catch (e) {
    return {
      data: null,
      error: e as Error,
    };
  }
}

async function validateLogIsNotAlreadyProcessed(
  gnosisTokenBalanceSnapshotModel: ReturnType<typeof createGnosisTokenBalanceSnapshotModel>,
  transactionHash: string
) {
  const existing = await gnosisTokenBalanceSnapshotModel.findById(transactionHash);
  if (existing) {
    throw new Error('Log already processed');
  }
}

async function getBlockByNumber(params: Parameters<typeof getBlockByNumberCore>[0]) {
  const { data: block } = await getBlockByNumberCore(params);

  if (!block) {
    throw new Error(`Block #${params.blockNumber} not found`, {
      cause: 'BLOCK_NOT_FOUND',
    });
  }

  return block;
}
