import {
  getGnosisPayTokenByAddress,
  GnosisPayTransactionFieldsType_Populated,
  getOraclePriceAtBlockNumber,
  gnoToken,
  toWeekId,
  GnosisPayTransactionFieldsType_Unpopulated,
  GnosisPayTransactionType,
  calculateNetUsdVolume,
  ConditionalReturnType,
  calculateWeekRewardAmount,
  usdcBridgeToken,
  circleUsdcToken,
  getTokenBalanceOf,
} from '@karpatkey/gnosis-pay-rewards-sdk';
import {
  createWeekRewardsSnapshotDocument,
  createWeekMetricsSnapshotDocument,
  GnosisPaySafeAddressDocumentFieldsType_Unpopulated,
  createGnosisPaySafeAddressDocument,
  createWeekCashbackRewardDocumentId,
  createGnosisTokenBalanceSnapshotDocument,
} from '@karpatkey/gnosis-pay-rewards-sdk/mongoose';
import { Model } from 'mongoose';
import dayjs from 'dayjs';
import dayjsUtcPlugin from 'dayjs/plugin/utc.js';
import { formatUnits, Address, isAddressEqual } from 'viem';
import { getGnosisPaySpendLogs } from '../gp/getGnosisPaySpendLogs.js';
import { getBlockByNumber } from './actions.js';
import { getGnosisPaySafeAddressFromModule } from '../gp/getGnosisPaySafeAddressFromModule.js';
import { getGnosisPayRefundLogs } from '../gp/getGnosisPayRefundLogs.js';
import { hasGnosisPayOgNft } from '../gp/hasGnosisPayOgNft.js';
import { getGnosisPaySafeOwners as getGnosisPaySafeOwnersCore } from '../gp/getGnosisPaySafeOwners.js';

import { MongooseConfiguredModels, ProcessLogFnDataType, ProcessLogFunctionParams } from './types.js';

dayjs.extend(dayjsUtcPlugin);

export async function processSpendLog({
  client,
  log,
  mongooseModels,
}: ProcessLogFunctionParams<Awaited<ReturnType<typeof getGnosisPaySpendLogs>>[number]>): Promise<
  ConditionalReturnType<true, ProcessLogFnDataType, Error> | ConditionalReturnType<false, ProcessLogFnDataType, Error>
> {
  try {
    await validateLogIsNotAlreadyProcessed(mongooseModels.gnosisPayTransactionModel, log.transactionHash);

    const { blockNumber, transactionHash } = log;
    const { account: rolesModuleAddress, amount: spendAmountRaw, asset: spentTokenAddress } = log.args;
    // Throw an error if the token is not registered as GP token
    const spentToken = validateToken(spentTokenAddress);

    const block = await getBlockByNumber({
      blockNumber: log.blockNumber,
      client,
      useCache: true,
    });

    const safeAddress = await getGnosisPaySafeAddressFromModule({
      rolesModuleAddress,
      blockNumber,
      client,
    });

    const safeOwners = await getGnosisPaySafeOwners({
      safeAddress,
      client,
      blockNumber,
    });

    const safeHasOgNft = await hasGnosisPayOgNft(client, safeOwners).then((hasArray) =>
      hasArray.some((addr) => addr === true),
    );

    const gnosisPaySafeGnoTokenBalance = await getTokenBalanceOf({
      address: safeAddress,
      blockNumber,
      client,
      token: gnoToken.address,
    });

    const tokenUsdPrice = await getTokenUsdPrice({
      blockNumber,
      client,
      token: spentToken.address,
    });

    const gnoUsdPrice = await getTokenUsdPrice({
      blockNumber,
      client,
      token: gnoToken.address,
    });

    const weekId = toWeekId(block.timestamp);
    const amount = Number(formatUnits(spendAmountRaw, spentToken.decimals));
    const amountUsd = tokenUsdPrice * amount;
    const gnoBalance = Number(formatUnits(gnosisPaySafeGnoTokenBalance, gnoToken.decimals));

    const savedData = await saveToDatabase(
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
        _id: safeAddress,
        address: safeAddress,
        gnoBalance,
        isOg: safeHasOgNft,
        owners: safeOwners,
        netUsdVolume: 0,
        transactions: [],
        gnoBalanceSnapshots: [],
      },
      mongooseModels,
    );

    return {
      data: savedData,
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
  mongooseModels,
}: ProcessLogFunctionParams<Awaited<ReturnType<typeof getGnosisPayRefundLogs>>[number]>) {
  try {
    await validateLogIsNotAlreadyProcessed(mongooseModels.gnosisPayTransactionModel, log.transactionHash);

    const { blockNumber, transactionHash } = log;
    const amountTokenAddress = log.address;
    const { to: safeAddress, value: amountRaw } = log.args;

    // Throw an error if the token is not registered as GP token
    const spentToken = validateToken(amountTokenAddress);

    const block = await getBlockByNumber({
      blockNumber,
      client,
      useCache: true,
    });

    const safeOwners = await getGnosisPaySafeOwners({
      safeAddress,
      client,
      blockNumber,
    });

    const safeHasOgNft = await hasGnosisPayOgNft(client, safeOwners).then((hasArray) =>
      hasArray.some((addr) => addr === true),
    );

    const gnosisPaySafeGnoTokenBalance = await getTokenBalanceOf({
      address: safeAddress,
      blockNumber,
      client,
      token: gnoToken.address,
    });

    const tokenUsdPrice = await getTokenUsdPrice({
      blockNumber,
      client,
      token: spentToken.address,
    });

    const gnoUsdPrice = await getTokenUsdPrice({
      blockNumber,
      client,
      token: gnoToken.address,
    });

    const weekId = toWeekId(block.timestamp);
    const amount = Number(formatUnits(amountRaw, spentToken.decimals));
    const amountUsd = tokenUsdPrice * amount;
    const gnoBalance = Number(formatUnits(gnosisPaySafeGnoTokenBalance, gnoToken.decimals));

    const savedData = await saveToDatabase(
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
        type: GnosisPayTransactionType.Refund,
        transactionHash,
        weekId,
      },
      {
        _id: safeAddress,
        address: safeAddress,
        gnoBalance,
        isOg: safeHasOgNft,
        owners: safeOwners,
        netUsdVolume: 0,
        transactions: [],
        gnoBalanceSnapshots: [],
      },
      mongooseModels,
    );

    return {
      data: savedData,
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
  logId: string,
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

async function getGnosisPaySafeOwners(params: Parameters<typeof getGnosisPaySafeOwnersCore>[0]) {
  const { data: owners } = await getGnosisPaySafeOwnersCore(params);

  if (!owners) {
    throw new Error(`Owners not found for safe address ${params.safeAddress}`, {
      cause: 'OWNERS_NOT_FOUND',
    });
  }

  return owners;
}

async function getTokenUsdPrice(
  params: { token: Address } & Omit<Parameters<typeof getOraclePriceAtBlockNumber>[0], 'oracle'>,
) {
  if (isAddressEqual(params.token, usdcBridgeToken.address) || isAddressEqual(params.token, circleUsdcToken.address)) {
    return 1;
  }

  // Custom finder for gno token
  const tokenInfo = isAddressEqual(params.token, gnoToken.address)
    ? gnoToken
    : getGnosisPayTokenByAddress(params.token);

  if (!tokenInfo?.oracle) {
    throw new Error(`Token (${params.token}) either not found or not registered as GP token`);
  }

  const { data, error } = await getOraclePriceAtBlockNumber({
    ...params,
    oracle: tokenInfo.oracle,
  });

  if (!data) {
    throw error;
  }

  return data.price;
}

async function saveToDatabase(
  transactionPayload: GnosisPayTransactionFieldsType_Unpopulated,
  gnosisPaySafeAddressPayload: GnosisPaySafeAddressDocumentFieldsType_Unpopulated,
  mongooseModels: MongooseConfiguredModels,
): Promise<ProcessLogFnDataType> {
  const {
    gnosisPayTransactionModel,
    weekCashbackRewardModel,
    weekMetricsSnapshotModel,
    gnosisPaySafeAddressModel,
    gnosisTokenBalanceSnapshotModel,
  } = mongooseModels;
  transactionPayload.safeAddress = transactionPayload.safeAddress.toLowerCase() as Address;
  transactionPayload.amountToken = transactionPayload.amountToken.toLowerCase() as Address;
  const { weekId, gnoUsdPrice, gnoBalance, safeAddress, gnoBalanceRaw, blockNumber, blockTimestamp } =
    transactionPayload;

  // Start a session to ensure atomicity
  const mongooseSession = await gnosisPayTransactionModel.startSession();
  mongooseSession.startTransaction();

  const transactionDocument = await new gnosisPayTransactionModel<GnosisPayTransactionFieldsType_Unpopulated>(
    transactionPayload,
  ).save({ session: mongooseSession });

  // Update the week cashback reward document
  const weekRewardDocument = await createWeekRewardsSnapshotDocument(
    weekCashbackRewardModel,
    weekId,
    safeAddress,
    mongooseSession,
  );

  // Create the Gnosis Token Balance Snapshot document
  const gnosisTokenBalanceSnapshotDocument = await createGnosisTokenBalanceSnapshotDocument(
    gnosisTokenBalanceSnapshotModel,
    {
      balance: gnoBalance,
      balanceRaw: gnoBalanceRaw,
      blockNumber,
      blockTimestamp,
      safe: safeAddress,
      weekId,
    },
    mongooseSession,
  );

  // Initialize the net usd volume field
  let prevNetUsdVolume = weekRewardDocument.netUsdVolume;

  // If this is the first transaction for the week,
  // we need to check if the previous week cashback net volume is in the negative
  // if it is negative, we need to carry the negative volume over to the new week
  if (weekRewardDocument.transactions.length === 0) {
    const prevWeekId = toWeekId(dayjs(weekId).subtract(1, 'week').unix());
    const prevDocumentId = createWeekCashbackRewardDocumentId(prevWeekId, safeAddress);
    const previousWeekCashbackReward = await weekCashbackRewardModel.findById(prevDocumentId);

    if (previousWeekCashbackReward !== null && previousWeekCashbackReward.netUsdVolume < 0) {
      prevNetUsdVolume = previousWeekCashbackReward.netUsdVolume;
    }
  }
  // Update the net usd volume field
  weekRewardDocument.netUsdVolume =
    transactionPayload.type === GnosisPayTransactionType.Spend
      ? prevNetUsdVolume + transactionPayload.amountUsd
      : prevNetUsdVolume - transactionPayload.amountUsd;
  // Add the spend transaction to the week cashback reward document
  weekRewardDocument.transactions.push(transactionDocument._id);
  weekRewardDocument.gnoBalanceSnapshots.push(gnosisTokenBalanceSnapshotDocument._id);

  if (!weekRewardDocument.maxGnoBalance) {
    weekRewardDocument.maxGnoBalance = gnoBalance;
  } else if (gnoBalance > weekRewardDocument.maxGnoBalance) {
    weekRewardDocument.maxGnoBalance = gnoBalance;
  }

  if (!weekRewardDocument.minGnoBalance) {
    weekRewardDocument.minGnoBalance = gnoBalance;
  } else if (gnoBalance <= weekRewardDocument.minGnoBalance) {
    weekRewardDocument.minGnoBalance = gnoBalance;
  }

  // Retrieve the last three weeks of data
  const fourWeekSnapshots = await weekCashbackRewardModel
    .find({ safe: safeAddress }, { netUsdVolume: 1, week: 1 })
    .sort({ week: -1 })
    .limit(4)
    .lean();

  const fourWeeksUsdVolume = fourWeekSnapshots.reduce((acc, curr) => acc + curr.netUsdVolume, 0);

  // Calculate the estimated reward for the week
  const estimatedReward = calculateWeekRewardAmount({
    fourWeeksUsdVolume,
    gnoBalance: weekRewardDocument.minGnoBalance,
    gnoUsdPrice,
    isOgNftHolder: gnosisPaySafeAddressPayload.isOg,
    weekUsdVolume: weekRewardDocument.netUsdVolume,
  });

  // Calculate the estimated reward for the week
  weekRewardDocument.estimatedReward = estimatedReward;
  await weekRewardDocument.save({ session: mongooseSession });

  // Create the safe address document
  {
    // All GnosisPay transactions for this safe address
    const allGnosisPayTransactions = [
      transactionDocument.toJSON(), // we include this manually this since the document hasn't been saved to the database yet
      ...(await gnosisPayTransactionModel.find({ safeAddress }).lean()),
    ];

    const gnosisPaySafeAddressDocument = await createGnosisPaySafeAddressDocument(
      {
        safeAddress,
        isOg: gnosisPaySafeAddressPayload.isOg,
        owners: gnosisPaySafeAddressPayload.owners,
      },
      gnosisPaySafeAddressModel,
      mongooseSession,
    );

    gnosisPaySafeAddressDocument.gnoBalanceSnapshots.push(gnosisTokenBalanceSnapshotDocument._id);
    gnosisPaySafeAddressDocument.transactions.push(transactionDocument._id);
    gnosisPaySafeAddressDocument.netUsdVolume = calculateNetUsdVolume(allGnosisPayTransactions);
    gnosisPaySafeAddressDocument.owners = gnosisPaySafeAddressPayload.owners;

    await gnosisPaySafeAddressDocument.save({ session: mongooseSession });
  }

  // Update the week metrics snapshot
  const weekMetricsOldSnapshot = await createWeekMetricsSnapshotDocument(
    {
      weekId,
      weekMetricsSnapshotModel,
    },
    mongooseSession,
  );
  // Add the spend transaction to the week metrics snapshot
  weekMetricsOldSnapshot.transactions.push(transactionDocument._id);
  const weekMetricsNewSnapshot = await weekMetricsOldSnapshot.save({ session: mongooseSession });

  await mongooseSession.commitTransaction();
  await mongooseSession.endSession();

  // Manually populate the spentToken and safeAddress fields
  const gnosisPayTransactionJsonData: GnosisPayTransactionFieldsType_Populated = (
    await transactionDocument.populate('amountToken')
  ).toJSON();

  return {
    gnosisPayTransaction: gnosisPayTransactionJsonData,
    weekCashbackReward: weekRewardDocument.toJSON(),
    weekMetricsSnapshot: weekMetricsNewSnapshot.toJSON(),
  };
}
