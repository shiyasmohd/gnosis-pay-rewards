import { BigInt } from '@graphprotocol/graph-ts';
import { GnosisPayTransaction } from '../generated/schema';

/**
 * Calculate the rewards for a given week with a list of transactions.
 * Requires a list of transactions to calculate the rewards for and calculates the net USD volume for the week.
 *
 * The GNO balance is the lowest GNO balance among the transactions.
 *
 * Negative USD volumes are ignored as they don't contribute to the rewards.
 */
export function calculateWeekRewardAmount(
  gnoUsdPrice: BigInt,
  transactions: GnosisPayTransaction[],
  isOgNftHolder: boolean,
): BigInt {
  let gnoRewards = BigInt.fromI32(0);

  const netUsdVolume = calculateNetUsdVolume(transactions);

  if (netUsdVolume.isZero()) {
    return gnoRewards;
  }

  // To get the week's GNO balance, we find the lowest GNO balance among the transactions
  const gnoBalance = transactions.reduce((min, transaction) => {
    if (transaction.gnoBalance.gt(min)) {
      return transaction.gnoBalance;
    }
    return min;
  }, BigInt.fromI32(0));

  if (gnoBalance.isZero()) {
    return gnoRewards;
  }

  // Calculate base reward percentage based on GNO holdings
  let rewardPercentage = BigInt.fromI32(0);
  if (gnoBalance.ge(BigInt.fromI32(100))) {
    rewardPercentage = BigInt.fromI32(4);
  } else if (gnoBalance.ge(BigInt.fromI32(10))) {
    rewardPercentage = BigInt.fromI32(3);
  } else if (gnoBalance.ge(BigInt.fromI32(1))) {
    rewardPercentage = BigInt.fromI32(2);
  } else if (gnoBalance.ge(BigInt.fromI32(0.1))) {
    rewardPercentage = BigInt.fromI32(1);
  }

  // Add OG GP NFT holder boost if applicable
  if (isOgNftHolder && gnoBalance.ge(BigInt.fromI32(0.1))) {
    rewardPercentage = rewardPercentage.plus(BigInt.fromI32(1));
  }

  // Calculate GNO rewards
  gnoRewards = (rewardPercentage.div(BigInt.fromI32(100))).times(netUsdVolume).div(gnoUsdPrice);

  return gnoRewards;
}


export function calculateNetUsdVolume(transactions: GnosisPayTransaction[]): BigInt {
  let netUsdVolume = BigInt.fromI32(0);


  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];
    if (transaction.valueUsd.gt(BigInt.fromI32(0))) {
      netUsdVolume = netUsdVolume.plus(transaction.valueUsd);
    }
  }

  return netUsdVolume;
}