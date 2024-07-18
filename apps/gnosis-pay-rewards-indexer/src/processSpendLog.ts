import {
  getGnosisPayTokenByAddress,
  GnosisPayTransactionFieldsType_Populated,
  getOraclePriceAtBlockNumber,
  gnoToken,
  toWeekDataId,
  GnosisPayTransactionFieldsType_Unpopulated,
  GnosisPayTransactionType,
  calculateNetUsdVolume,
} from '@karpatkey/gnosis-pay-rewards-sdk';
import { Model } from 'mongoose';
import { PublicClient, Transport, formatUnits, Address } from 'viem';
import { gnosis } from 'viem/chains';
import { getGnosisPaySpendLogs } from './gp/getGnosisPaySpendLogs.js';
import { WeekCashbackRewardModelType, getOrCreateWeekCashbackRewardDocument } from './database/weekCashbackReward.js';
import { getBlockByNumber as getBlockByNumberCore } from './getBlockByNumber.js';
import { getGnosisPaySafeAddressFromModule } from './gp/getGnosisPaySafeAddressFromModule.js';
import { getGnoTokenBalance } from './getGnoTokenBalance.js';
import { calculateWeekRewardWithTransactions } from './calculateWeekReward.js';
import { getGnosisPayRefundLogs } from './gp/getGnosisPayRefundLogs.js';

type ProcessLogFnParams<LogType extends Record<string, unknown>> = {
  client: PublicClient<Transport, typeof gnosis>;
  log: LogType;
  gnosisPayTransactionModel: Model<GnosisPayTransactionFieldsType_Unpopulated>;
  weekCashbackRewardModel: WeekCashbackRewardModelType;
};

export async function processSpendLog({
  client,
  log,
  gnosisPayTransactionModel,
  weekCashbackRewardModel,
}: ProcessLogFnParams<Awaited<ReturnType<typeof getGnosisPaySpendLogs>>[number]>) {
  try {
    await validateLogIsNotAlreadyProcessed(gnosisPayTransactionModel, log.transactionHash);

    const { blockNumber, transactionHash } = log;
    const { account: rolesModuleAddress, amount: spendAmountRaw, asset: spentTokenAddress } = log.args;
    // Throw an error if the token is not registered as GP token
    const spentToken = validateToken(spentTokenAddress);

    const block = await getBlockByNumber({
      blockNumber: log.blockNumber,
      client,
    });

    const safeAddress = await getGnosisPaySafeAddressFromModule({
      rolesModuleAddress,
      blockNumber,
      client,
    });

    const gnosisPaySafeGnoTokenBalance = await getGnoTokenBalance({
      address: safeAddress,
      blockNumber,
      client,
    });

    const latestRoundDataAtBlock = await getOraclePriceAtBlockNumber({
      blockNumber,
      client,
      token: spentTokenAddress,
    });

    const gnoTokenPriceDataAtBlock = await getOraclePriceAtBlockNumber({
      blockNumber,
      client,
      token: gnoToken.address,
    });

    const weekId = toWeekDataId(Number(block.timestamp));
    const amount = Number(formatUnits(spendAmountRaw, spentToken.decimals));
    const amountUsd = latestRoundDataAtBlock.data?.price ? amount * latestRoundDataAtBlock.data.price : 0;
    const gnoBalance = Number(formatUnits(gnosisPaySafeGnoTokenBalance, gnoToken.decimals));
    const gnoUsdPrice = gnoTokenPriceDataAtBlock.data?.price ?? 0;

    const { gnosisPayTransactionJsonData, weekCashbackRewardJsonData } = await saveToDatabase(
      {
        _id: transactionHash,
        amount,
        amountRaw: spendAmountRaw.toString(),
        amountToken: spentTokenAddress,
        amountUsd,
        blockNumber: Number(blockNumber),
        blockTimestamp: Number(block.timestamp),
        gnoBalance,
        gnoBalanceRaw: gnosisPaySafeGnoTokenBalance.toString(),
        gnoUsdPrice,
        estiamtedGnoRewardAmount: 0,
        safeAddress,
        type: GnosisPayTransactionType.Spend,
        transactionHash,
        weekId,
      },
      {
        gnosisPayTransactionModel,
        weekCashbackRewardModel,
      }
    );

    return {
      data: {
        gnosisPayTransactionJsonData,
        weekCashbackRewardJsonData,
      },
      error: null,
    };
  } catch (e) {
    return {
      data: null,
      error: e as Error,
    };
  }
}

export async function processRefundLog({
  client,
  log,
  gnosisPayTransactionModel,
  weekCashbackRewardModel,
}: ProcessLogFnParams<Awaited<ReturnType<typeof getGnosisPayRefundLogs>>[number]>) {
  try {
    await validateLogIsNotAlreadyProcessed(gnosisPayTransactionModel, log.transactionHash);

    const { blockNumber, transactionHash } = log;
    const amountTokenAddress = log.address;
    const { to: safeAddress, value: amountRaw } = log.args;

    // Throw an error if the token is not registered as GP token
    const spentToken = validateToken(amountTokenAddress);

    const block = await getBlockByNumber({
      blockNumber,
      client,
    });

    const gnosisPaySafeGnoTokenBalance = await getGnoTokenBalance({
      address: safeAddress,
      blockNumber,
      client,
    });

    const latestRoundDataAtBlock = await getOraclePriceAtBlockNumber({
      blockNumber,
      client,
      token: amountTokenAddress,
    });

    const gnoTokenPriceDataAtBlock = await getOraclePriceAtBlockNumber({
      blockNumber,
      client,
      token: gnoToken.address,
    });

    const weekId = toWeekDataId(Number(block.timestamp));
    const amount = Number(formatUnits(amountRaw, spentToken.decimals));
    const gnoUsdPrice = gnoTokenPriceDataAtBlock.data?.price ?? 0;
    const amountUsd = latestRoundDataAtBlock.data?.price ? amount * latestRoundDataAtBlock.data.price : 0;
    const gnoBalance = Number(formatUnits(gnosisPaySafeGnoTokenBalance, gnoToken.decimals));

    const { gnosisPayTransactionJsonData, weekCashbackRewardJsonData } = await saveToDatabase(
      {
        _id: transactionHash,
        amount,
        amountRaw: amountRaw.toString(),
        amountToken: amountTokenAddress,
        amountUsd,
        blockNumber: Number(blockNumber),
        blockTimestamp: Number(block.timestamp),
        gnoBalance,
        gnoBalanceRaw: gnosisPaySafeGnoTokenBalance.toString(),
        gnoUsdPrice,
        estiamtedGnoRewardAmount: 0,
        safeAddress,
        type: GnosisPayTransactionType.Spend,
        transactionHash,
        weekId,
      },
      {
        gnosisPayTransactionModel,
        weekCashbackRewardModel,
      }
    );

    return {
      data: {
        gnosisPayTransactionJsonData,
        weekCashbackRewardJsonData,
      },
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
  gnosisPayTransactionModel: Model<GnosisPayTransactionFieldsType_Unpopulated>,
  logId: string
) {
  const savedLog = await gnosisPayTransactionModel.findOne({ _id: logId });
  if (savedLog !== null) {
    throw new Error(`Log ${logId} already processed`, {
      cause: 'LOG_ALREADY_PROCESSED',
    });
  }
}

function validateToken(tokenAddress: Address) {
  // Verify that the token is registered as GP token like EURe, GBPe, and USDC
  const spentToken = getGnosisPayTokenByAddress(tokenAddress);

  if (!spentToken) {
    throw new Error(`Unknown token: ${tokenAddress}`, {
      cause: 'UNKNOWN_TOKEN',
    });
  }

  return spentToken;
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

async function saveToDatabase(
  gnosispayTransactionPayload: GnosisPayTransactionFieldsType_Unpopulated,
  mongooseModels: {
    gnosisPayTransactionModel: Model<GnosisPayTransactionFieldsType_Unpopulated>;
    weekCashbackRewardModel: WeekCashbackRewardModelType;
  }
) {
  const { gnosisPayTransactionModel, weekCashbackRewardModel } = mongooseModels;

  gnosispayTransactionPayload.safeAddress = gnosispayTransactionPayload.safeAddress.toLowerCase() as Address;
  const { weekId, gnoUsdPrice, gnoBalance, safeAddress } = gnosispayTransactionPayload;

  // Start a session to ensure atomicity
  const mongooseSession = await gnosisPayTransactionModel.startSession();
  mongooseSession.startTransaction();

  const gnosisPayTransactionDocument = await new gnosisPayTransactionModel<GnosisPayTransactionFieldsType_Unpopulated>(
    gnosispayTransactionPayload
  ).save({ session: mongooseSession });

  // All spend transactions for the week
  const allGnosisPayTransactions = [
    gnosisPayTransactionDocument.toJSON(), // we include this manually this since the document hasn't been saved to the database yet
    ...(await gnosisPayTransactionModel
      .find({
        weekId,
        safeAddress,
      })
      .lean()),
  ];

  // Update the week cashback reward document
  const weekCashbackRewardOldSnapshot = await getOrCreateWeekCashbackRewardDocument(
    {
      address: safeAddress,
      weekCashbackRewardModel,
      week: weekId,
    },
    mongooseSession
  );

  weekCashbackRewardOldSnapshot.netUsdVolume = calculateNetUsdVolume(allGnosisPayTransactions);
  // Add the spend transaction to the week cashback reward document
  weekCashbackRewardOldSnapshot.transactions.push(gnosisPayTransactionDocument._id);

  if (gnoBalance > weekCashbackRewardOldSnapshot.maxGnoBalance) {
    weekCashbackRewardOldSnapshot.maxGnoBalance = gnoBalance;
  }
  if (gnoBalance < weekCashbackRewardOldSnapshot.minGnoBalance) {
    weekCashbackRewardOldSnapshot.minGnoBalance = gnoBalance;
  }

  const estimatedReward = calculateWeekRewardWithTransactions({
    gnoUsdPrice,
    transactions: allGnosisPayTransactions,
    isOgNftHolder: false,
  });

  // Calculate the estimated reward for the week
  weekCashbackRewardOldSnapshot.estimatedReward = estimatedReward;
  const weekCashbackRewardNewSnapshot = await weekCashbackRewardOldSnapshot.save({ session: mongooseSession });

  await mongooseSession.commitTransaction();
  await mongooseSession.endSession();

  // Manually populate the spentToken and safeAddress fields
  const gnosisPayTransactionJsonData: GnosisPayTransactionFieldsType_Populated = (
    await gnosisPayTransactionDocument.populate('amountToken')
  ).toJSON();
  const weekCashbackRewardJsonData = weekCashbackRewardNewSnapshot.toJSON();

  return {
    gnosisPayTransactionJsonData,
    weekCashbackRewardJsonData,
  };
}
