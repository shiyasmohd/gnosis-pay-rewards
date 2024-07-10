import {
  gnoTokenAddress,
  getGnosisPayTokenByAddress,
  SpendTransactionFieldsTypePopulated,
  getOraclePriceAtBlockNumber,
  gnoToken,
  toWeekDataId,
  weekDataIdFormat,
} from '@karpatkey/gnosis-pay-rewards-sdk';
import { Address, PublicClient, Transport, erc20Abi, formatUnits } from 'viem';
import { gnosis } from 'viem/chains';
import { getGnosisPaySpendLogs } from './getGnosisPaySpendLogs.js';
import { getSpendTransactionModel } from './database/spendTransaction.js';
import { getOrCreateWeekCashbackRewardDocument, getWeekCashbackRewardModel } from './database/weekCashbackReward.js';
import { getBlockByNumber } from './getBlockByNumber.js';

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
      error: new Error(`Spend log ${log.transactionHash} already processed`),
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
    /**
     * @todo make this a retryable error
     */
    console.error(`Block #${log.blockNumber} not found`);
    return {
      data: null,
      error: new Error(`Block #${log.blockNumber} not found`),
    };
  }

  const gnosisPaySafeAddress = (await client.readContract({
    abi: [
      {
        name: 'avatar',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'avatar',
    address: rolesModuleAddress,
    blockNumber: log.blockNumber,
  })) as Address;

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

  const spentAmount = Number(formatUnits(spendAmountRaw, spentToken.decimals));
  const spentAmountUsd = latestRoundDataAtBlock.data?.price ? spentAmount * latestRoundDataAtBlock.data.price : 0;

  const gnoBalanceFloat = Number(formatUnits(gnosisPaySafeGnoTokenBalance, gnoToken.decimals));

  const spendTransactionDocument = await new spendTransactionModel({
    _id: log.transactionHash,
    blockNumber: Number(log.blockNumber),
    blockTimestamp: Number(block.timestamp),
    transactionHash: log.transactionHash,
    gnoBalanceRaw: gnosisPaySafeGnoTokenBalance.toString(),
    gnoBalance: gnoBalanceFloat,
    safeAddress: gnosisPaySafeAddress,
    spentAmountRaw: spendAmountRaw.toString(),
    spentAmount,
    spentAmountUsd,
    spentToken: spentTokenAddress,
  }).save();

  const spendTransactionUnpopulated = spendTransactionDocument.toJSON();

  // Manually populate the spentToken and safeAddress fields
  const spendTransactionJsonData: SpendTransactionFieldsTypePopulated = {
    ...spendTransactionUnpopulated,
    spentToken: {
      ...spentToken,
      _id: spentTokenAddress,
    },
  };

  // Update the week cashback reward document
  const weekCashbackRewardDocument = await getOrCreateWeekCashbackRewardDocument({
    week: toWeekDataId(Number(block.timestamp)) as typeof weekDataIdFormat,
    address: gnosisPaySafeAddress,
    weekCashbackRewardModel,
  });

  weekCashbackRewardDocument.gnoBalanceRaw = gnosisPaySafeGnoTokenBalance.toString();
  /**
   * @todo fix this logic later, it must be the lowest GNO balance of the week
   */
  weekCashbackRewardDocument.gnoBalance = gnoBalanceFloat;
  weekCashbackRewardDocument.netUsdVolume = spentAmountUsd;
  await weekCashbackRewardDocument.save();

  const weekCashbackRewardJsonData = weekCashbackRewardDocument.toJSON();

  return {
    error: null,
    data: {
      spendTransaction: spendTransactionJsonData,
      weekCashbackReward: weekCashbackRewardJsonData,
    },
  };
}

function getGnoTokenBalance({
  client,
  address,
  blockNumber,
}: {
  client: PublicClient<Transport, typeof gnosis>;
  address: Address;
  blockNumber: bigint;
}) {
  return client.readContract({
    abi: erc20Abi,
    address: gnoTokenAddress,
    functionName: 'balanceOf',
    args: [address],
    blockNumber,
  });
}
