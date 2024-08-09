import {
  getGnosisPayTokenByAddress,
  GnosisPayTransactionFieldsType_Populated,
  getOraclePriceAtBlockNumber,
  gnoToken,
  toWeekDataId,
  GnosisPayTransactionFieldsType_Unpopulated,
  GnosisPayTransactionType,
  calculateNetUsdVolume,
  WeekSnapshotDocumentFieldsType,
  WeekCashbackRewardDocumentFieldsType_Populated,
  ConditionalReturnType,
  calculateWeekRewardAmount,
} from '@karpatkey/gnosis-pay-rewards-sdk';
import {
  WeekCashbackRewardModelType,
  createWeekCashbackRewardDocument,
  createWeekMetricsSnapshotDocument,
  GnosisPaySafeAddressDocumentFieldsType_Unpopulated,
  createGnosisPaySafeAddressDocument,
} from '@karpatkey/gnosis-pay-rewards-sdk/mongoose';
import { Model } from 'mongoose';
import { PublicClient, Transport, formatUnits, Address } from 'viem';
import { gnosis } from 'viem/chains';
import { getGnosisPaySpendLogs } from './gp/getGnosisPaySpendLogs.js';

import { getBlockByNumber as getBlockByNumberCore } from './getBlockByNumber.js';
import { getGnosisPaySafeAddressFromModule } from './gp/getGnosisPaySafeAddressFromModule.js';
import { getGnoTokenBalance } from './getGnoTokenBalance.js';
import { getGnosisPayRefundLogs } from './gp/getGnosisPayRefundLogs.js';
import { hasGnosisPayOgNft } from './gp/hasGnosisPayOgNft.js';
import { getGnosisPaySafeOwners as getGnosisPaySafeOwnersCore } from './gp/getGnosisPaySafeOwners.js';

type MongooseConfiguredModels = {
  gnosisPayTransactionModel: Model<GnosisPayTransactionFieldsType_Unpopulated>;
  gnosisPaySafeAddressModel: Model<GnosisPaySafeAddressDocumentFieldsType_Unpopulated>;
  weekCashbackRewardModel: WeekCashbackRewardModelType;
  weekMetricsSnapshotModel: Model<WeekSnapshotDocumentFieldsType>;
};

type ProcessLogFnParams<LogType extends Record<string, unknown>> = {
  client: PublicClient<Transport, typeof gnosis>;
  log: LogType;
  mongooseModels: MongooseConfiguredModels;
};

type ProcessLogFnDataType = {
  gnosisPayTransaction: GnosisPayTransactionFieldsType_Populated;
  weekCashbackReward: WeekCashbackRewardDocumentFieldsType_Populated;
  weekMetricsSnapshot: WeekSnapshotDocumentFieldsType;
};

export async function processSpendLog({
  client,
  log,
  mongooseModels,
}: ProcessLogFnParams<Awaited<ReturnType<typeof getGnosisPaySpendLogs>>[number]>): Promise<
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
      hasArray.some((addr) => addr === true)
    );

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
      },
      mongooseModels
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
}: ProcessLogFnParams<Awaited<ReturnType<typeof getGnosisPayRefundLogs>>[number]> & {
  mongooseModels: MongooseConfiguredModels;
}) {
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
    });

    const safeOwners = await getGnosisPaySafeOwners({
      safeAddress,
      client,
      blockNumber,
    });

    const safeHasOgNft = await hasGnosisPayOgNft(client, safeOwners).then((hasArray) =>
      hasArray.some((addr) => addr === true)
    );

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
      },
      mongooseModels
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

async function getGnosisPaySafeOwners(params: Parameters<typeof getGnosisPaySafeOwnersCore>[0]) {
  const { data: owners } = await getGnosisPaySafeOwnersCore(params);

  if (!owners) {
    throw new Error(`Owners not found for safe address ${params.safeAddress}`, {
      cause: 'OWNERS_NOT_FOUND',
    });
  }

  return owners;
}

async function saveToDatabase(
  gnosispayTransactionPayload: GnosisPayTransactionFieldsType_Unpopulated,
  gnosisPaySafeAddressPayload: GnosisPaySafeAddressDocumentFieldsType_Unpopulated,
  mongooseModels: MongooseConfiguredModels
): Promise<ProcessLogFnDataType> {
  const {
    gnosisPayTransactionModel,
    weekCashbackRewardModel,
    weekMetricsSnapshotModel,
    gnosisPaySafeAddressModel,
  } = mongooseModels;
  gnosispayTransactionPayload.safeAddress = gnosispayTransactionPayload.safeAddress.toLowerCase() as Address;
  gnosispayTransactionPayload.amountToken = gnosispayTransactionPayload.amountToken.toLowerCase() as Address;
  const { weekId, gnoUsdPrice, gnoBalance, safeAddress } = gnosispayTransactionPayload;

  // Start a session to ensure atomicity
  const mongooseSession = await gnosisPayTransactionModel.startSession();
  mongooseSession.startTransaction();

  const gnosisPayTransactionDocument = await new gnosisPayTransactionModel<GnosisPayTransactionFieldsType_Unpopulated>(
    gnosispayTransactionPayload
  ).save({ session: mongooseSession });

  // All spend transactions for the week
  const weekGnosisPayTransactions = [
    gnosisPayTransactionDocument.toJSON(), // we include this manually this since the document hasn't been saved to the database yet
    ...(await gnosisPayTransactionModel
      .find({
        weekId,
        safeAddress,
      })
      .lean()),
  ];

  // Update the week cashback reward document
  const weekCashbackRewardOldSnapshot = await createWeekCashbackRewardDocument(
    {
      address: safeAddress,
      weekCashbackRewardModel,
      week: weekId,
    },
    mongooseSession
  );

  weekCashbackRewardOldSnapshot.netUsdVolume = calculateNetUsdVolume(weekGnosisPayTransactions);
  // Add the spend transaction to the week cashback reward document
  weekCashbackRewardOldSnapshot.transactions.push(gnosisPayTransactionDocument._id);

  if (gnoBalance > weekCashbackRewardOldSnapshot.maxGnoBalance) {
    weekCashbackRewardOldSnapshot.maxGnoBalance = gnoBalance;
  }
  if (gnoBalance < weekCashbackRewardOldSnapshot.minGnoBalance) {
    weekCashbackRewardOldSnapshot.minGnoBalance = gnoBalance;
  }

  // Calculate the estimated reward for the week
  const estimatedReward = calculateWeekRewardAmount({
    gnoUsdPrice,
    transactions: weekGnosisPayTransactions,
    isOgNftHolder: gnosisPaySafeAddressPayload.isOg,
  });

  // Calculate the estimated reward for the week
  weekCashbackRewardOldSnapshot.estimatedReward = estimatedReward;
  const weekCashbackRewardNewSnapshot = await weekCashbackRewardOldSnapshot.save({ session: mongooseSession });

  // Create the safe address document
  {
    // All GnosisPay transactions for this safe address
    const allGnosisPayTransactions = [
      gnosisPayTransactionDocument.toJSON(), // we include this manually this since the document hasn't been saved to the database yet
      ...(await gnosisPayTransactionModel.find({ safeAddress }).lean()),
    ];

    const safeAddressOldSnapshot = await createGnosisPaySafeAddressDocument(
      {
        safeAddress,
        isOg: gnosisPaySafeAddressPayload.isOg,
        owners: gnosisPaySafeAddressPayload.owners,
      },
      gnosisPaySafeAddressModel,
      mongooseSession
    );

    safeAddressOldSnapshot.transactions.push(gnosisPayTransactionDocument._id);
    safeAddressOldSnapshot.netUsdVolume = calculateNetUsdVolume(allGnosisPayTransactions);
    safeAddressOldSnapshot.owners = gnosisPaySafeAddressPayload.owners;
    safeAddressOldSnapshot.gnoBalance = gnoBalance;

    await safeAddressOldSnapshot.save({ session: mongooseSession });
  }

  // Update the week metrics snapshot
  const weekMetricsOldSnapshot = await createWeekMetricsSnapshotDocument(
    {
      weekId,
      weekMetricsSnapshotModel,
    },
    mongooseSession
  );
  // Add the spend transaction to the week metrics snapshot
  weekMetricsOldSnapshot.transactions.push(gnosisPayTransactionDocument._id);
  const weekMetricsNewSnapshot = await weekMetricsOldSnapshot.save({ session: mongooseSession });

  await mongooseSession.commitTransaction();
  await mongooseSession.endSession();

  // Manually populate the spentToken and safeAddress fields
  const gnosisPayTransactionJsonData: GnosisPayTransactionFieldsType_Populated = (
    await gnosisPayTransactionDocument.populate('amountToken')
  ).toJSON();

  return {
    gnosisPayTransaction: gnosisPayTransactionJsonData,
    weekCashbackReward: weekCashbackRewardNewSnapshot.toJSON(),
    weekMetricsSnapshot: weekMetricsNewSnapshot.toJSON(),
  };
}
