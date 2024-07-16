import {
  getGnosisPayTokenByAddress,
  SpendTransactionFieldsTypePopulated,
  getOraclePriceAtBlockNumber,
  gnoToken,
  toWeekDataId,
  weekDataIdFormat,
} from '@karpatkey/gnosis-pay-rewards-sdk';
import { PublicClient, Transport, formatUnits } from 'viem';
import { gnosis } from 'viem/chains';
import { getGnosisPaySpendLogs } from './getGnosisPaySpendLogs.js';
import { getSpendTransactionModel } from './database/spendTransaction.js';
import {
  WeekCashbackRewardDocumentFieldsType_Unpopulated,
  getOrCreateWeekCashbackRewardDocument,
  getWeekCashbackRewardModel,
} from './database/weekCashbackReward.js';
import { getBlockByNumber } from './getBlockByNumber.js';
import { getGnosisPaySafeAddressFromModule } from './getGnosisPaySafeAddressFromModule.js';
import { getGnoTokenBalance } from './getGnoTokenBalance.js';
import { calculateWeekRewardWithTransactions } from './calculateWeekReward.js';

export async function processSpendLog({
  client,
  log,
  spendTransactionModel,
  weekCashbackRewardModel,
}: {
  client: PublicClient<Transport, typeof gnosis>;
  log: Awaited<ReturnType<typeof getGnosisPaySpendLogs>>[number];
  spendTransactionModel: ReturnType<typeof getSpendTransactionModel>;
  weekCashbackRewardModel: ReturnType<typeof getWeekCashbackRewardModel>;
}) {
  const savedLog = await spendTransactionModel.findOne({ _id: log.transactionHash });
  if (savedLog !== null) {
    return {
      data: null,
      error: new Error(`Spend log ${log.transactionHash} already processed`, {
        cause: 'LOG_ALREADY_PROCESSED',
      }),
    };
  }

  const { account: rolesModuleAddress, amount: spendAmountRaw, asset: spentTokenAddress } = log.args;
  // Verify that the token is registered as GP token like EURe, GBPe, and USDC
  const spentToken = getGnosisPayTokenByAddress(spentTokenAddress);

  if (!spentToken) {
    return {
      data: null,
      error: new Error(`Unknown token: ${spentTokenAddress}`),
    };
  }

  const { data: block } = await getBlockByNumber({ client, blockNumber: log.blockNumber });

  if (!block) {
    return {
      data: null,
      error: new Error(`Block #${log.blockNumber} not found`, {
        cause: 'BLOCK_NOT_FOUND',
      }),
    };
  }

  const gnosisPaySafeAddress = await getGnosisPaySafeAddressFromModule({
    rolesModuleAddress,
    blockNumber: log.blockNumber,
    client,
  });

  const gnosisPaySafeGnoTokenBalance = await getGnoTokenBalance({
    address: gnosisPaySafeAddress,
    blockNumber: log.blockNumber,
    client,
  });

  const latestRoundDataAtBlock = await getOraclePriceAtBlockNumber({
    blockNumber: log.blockNumber,
    client,
    token: spentTokenAddress,
  });

  const gnoTokenPriceDataAtBlock = await getOraclePriceAtBlockNumber({
    blockNumber: log.blockNumber,
    client,
    token: gnoToken.address,
  });

  const spentAmount = Number(formatUnits(spendAmountRaw, spentToken.decimals));
  const spentAmountUsd = latestRoundDataAtBlock.data?.price ? spentAmount * latestRoundDataAtBlock.data.price : 0;
  const gnoBalanceFloat = Number(formatUnits(gnosisPaySafeGnoTokenBalance, gnoToken.decimals));

  // Start a session to ensure atomicity
  const mongooseSession = await spendTransactionModel.startSession();

  let spendTransactionJsonData = {} as SpendTransactionFieldsTypePopulated;
  let weekCashbackRewardJsonData = {} as WeekCashbackRewardDocumentFieldsType_Unpopulated;

  await mongooseSession.withTransaction(async () => {
    const spendTransactionDocument = await new spendTransactionModel({
      _id: log.transactionHash,
      blockNumber: Number(log.blockNumber),
      blockTimestamp: Number(block.timestamp),
      weekId: toWeekDataId(Number(block.timestamp)),
      transactionHash: log.transactionHash,
      gnoBalanceRaw: gnosisPaySafeGnoTokenBalance.toString(),
      gnoBalance: gnoBalanceFloat,
      safeAddress: gnosisPaySafeAddress,
      spentAmountRaw: spendAmountRaw.toString(),
      spentAmount,
      spentAmountUsd,
      spentToken: spentTokenAddress,
    }).save({ session: mongooseSession });

    // Manually populate the spentToken and safeAddress fields
    spendTransactionJsonData = {
      ...spendTransactionDocument.toJSON(),
      spentToken: {
        ...spentToken,
        _id: spentTokenAddress,
      },
    };

    // All spend transactions for the week
    const allSpendTransactions = [
      spendTransactionDocument.toJSON(), // we include this manually this since the document hasn't been saved to the database yet
      ...(await spendTransactionModel
        .find({
          safeAddress: gnosisPaySafeAddress,
          weekId: toWeekDataId(Number(block.timestamp)) as typeof weekDataIdFormat,
        })
        .lean()),
    ];

    // Update the week cashback reward document
    const weekCashbackRewardSnapshot = await getOrCreateWeekCashbackRewardDocument({
      address: gnosisPaySafeAddress,
      weekCashbackRewardModel,
      week: toWeekDataId(Number(block.timestamp)) as typeof weekDataIdFormat,
    });

    weekCashbackRewardSnapshot.netUsdVolume = spentAmountUsd;
    // Add the spend transaction to the week cashback reward document
    weekCashbackRewardSnapshot.transactions.push(spendTransactionDocument._id);

    if (gnoBalanceFloat > weekCashbackRewardSnapshot.maxGnoBalance) {
      weekCashbackRewardSnapshot.maxGnoBalance = gnoBalanceFloat;
    }
    if (gnoBalanceFloat < weekCashbackRewardSnapshot.minGnoBalance) {
      weekCashbackRewardSnapshot.minGnoBalance = gnoBalanceFloat;
    }

    const estimatedReward = await calculateWeekRewardWithTransactions({
      gnoUsdPrice: gnoTokenPriceDataAtBlock.data?.price ?? 0,
      transactions: allSpendTransactions,
      isOgNftHolder: false,
    });

    // Calculate the estimated reward for the week
    weekCashbackRewardSnapshot.estimatedReward = estimatedReward;

    await weekCashbackRewardSnapshot.save({ session: mongooseSession });
    weekCashbackRewardJsonData = weekCashbackRewardSnapshot.toJSON();
  });

  await mongooseSession.commitTransaction();
  await mongooseSession.endSession();

  return {
    error: null,
    data: {
      spendTransaction: spendTransactionJsonData,
      weekCashbackReward: weekCashbackRewardJsonData,
    },
  };
}
