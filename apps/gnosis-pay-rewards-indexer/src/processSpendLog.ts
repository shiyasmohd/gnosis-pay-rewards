import { Address, PublicClient, Transport, erc20Abi, formatEther, formatUnits } from 'viem';
import {
  gnoTokenAddress,
  calcRewardAmount,
  getGnosisPayTokenByAddress,
  SpendTransactionFieldsTypePopulated,
  getOraclePriceAtBlockNumber,
} from '@karpatkey/gnosis-pay-rewards-sdk';
import { gnosis } from 'viem/chains';
import { getGnosisPaySpendLogs } from './getGnosisPaySpendLogs.js';
import { getSpendTransactionModel } from './database/spendTransaction.js';
import { getBlockByNumber } from './getBlockByNumber.js';
import { gnoToken } from '@karpatkey/gnosis-pay-rewards-sdk';

export async function processSpendLog({
  client,
  log,
  spendTransactionModel,
}: {
  client: PublicClient<Transport, typeof gnosis>;
  log: Awaited<ReturnType<typeof getGnosisPaySpendLogs>>[number];
  spendTransactionModel: ReturnType<typeof getSpendTransactionModel>;
}) {
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

  // Fetch the GNO token balance for the GP Safe at the spend block
  const gnosisPaySafeGnoTokenBalance = await client.readContract({
    abi: erc20Abi,
    address: gnoTokenAddress,
    functionName: 'balanceOf',
    args: [gnosisPaySafeAddress],
    blockNumber: log.blockNumber,
  });

  const formattedGnoBalance = formatEther(gnosisPaySafeGnoTokenBalance);

  const { amount: gnoRewardsAmount, bips: gnoRewardsBips } = calcRewardAmount(Number(formattedGnoBalance));

  const consoleLogStrings = [
    `GP Safe: ${gnosisPaySafeAddress} spent ${formatEther(spendAmountRaw)} ${spentToken.symbol} @ ${log.blockNumber}`,
  ];

  if (gnosisPaySafeGnoTokenBalance > BigInt(0)) {
    consoleLogStrings.push(
      `They have ${formattedGnoBalance} GNO and will receive ${gnoRewardsAmount} GNO rewards (@${gnoRewardsBips} BPS).`
    );
  }

  console.log(consoleLogStrings.join('\n'));

  const latestRoundDataAtBlock = await getOraclePriceAtBlockNumber({
    client,
    token: spentTokenAddress,
    blockNumber: log.blockNumber,
  });

  const spentAmount = Number(formatUnits(spendAmountRaw, spentToken.decimals));
  const spentAmountUsd = latestRoundDataAtBlock.data?.price ? spentAmount * latestRoundDataAtBlock.data.price : 0;

  const spendTransactionDocument = await new spendTransactionModel({
    _id: log.transactionHash,
    blockNumber: Number(log.blockNumber),
    blockTimestamp: Number(block.timestamp),
    transactionHash: log.transactionHash,
    gnoBalanceRaw: gnosisPaySafeGnoTokenBalance.toString(),
    gnoBalance: Number(formatUnits(gnosisPaySafeGnoTokenBalance, gnoToken.decimals)),
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

  return {
    error: null,
    data: spendTransactionJsonData,
  };
}
