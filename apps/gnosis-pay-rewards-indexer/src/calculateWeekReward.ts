import { GnosisPayTransactionFieldsType_Unpopulated, calculateNetUsdVolume } from '@karpatkey/gnosis-pay-rewards-sdk';
import { WeekCashbackRewardDocumentFieldsType_Populated } from './database/weekCashbackReward.js';

/**
 * Calculate the rewards for a given week
 */
export async function calculateWeekRewardWithSnapshot({
  gnoUsdPrice,
  weekCashbackRewardSnapshot,
  isOgNftHolder,
}: {
  /**
   * The week cashback reward snapshot
   */
  weekCashbackRewardSnapshot: WeekCashbackRewardDocumentFieldsType_Populated;
  /**
   * The GNO USD price reference to use when calculating rewards
   */
  gnoUsdPrice: number;
  /**
   * @description Whether the user is an OG NFT holder
   * @see https://gnosispay.niftyfair.io/
   */
  isOgNftHolder: boolean;
}) {
  // No volume
  if (weekCashbackRewardSnapshot.netUsdVolume === 0 && weekCashbackRewardSnapshot.transactions.length === 0) {
    return 0;
  }

  return calculateWeekRewardWithTransactions({
    gnoUsdPrice,
    isOgNftHolder,
    transactions: weekCashbackRewardSnapshot.transactions,
  });
}

export function calculateWeekRewardWithTransactions({
  gnoUsdPrice,
  isOgNftHolder,
  transactions,
}: {
  transactions: GnosisPayTransactionFieldsType_Unpopulated[];
  gnoUsdPrice: number;
  isOgNftHolder: boolean;
}) {
  if (transactions.length === 0) {
    return 0;
  }

  const netUsdVolume = calculateNetUsdVolume(transactions);
  // To get the week's GNO balance, we find the lowest GNO balance among the transactions
  const gnoBalance = Math.min(...transactions.map((transaction) => transaction.gnoBalance));

  if (gnoBalance === 0) {
    return 0;
  }

  // Calculate base reward percentage based on GNO holdings
  let rewardPercentage = 0;
  if (gnoBalance >= 100) {
    rewardPercentage = 4;
  } else if (gnoBalance >= 10) {
    rewardPercentage = 3;
  } else if (gnoBalance >= 1) {
    rewardPercentage = 2;
  } else if (gnoBalance >= 0.1) {
    rewardPercentage = 1;
  }

  // Add OG GP NFT holder boost if applicable
  if (isOgNftHolder && gnoBalance >= 0.1) {
    rewardPercentage += 1;
  }

  // Calculate GNO rewards
  const gnoRewards = ((rewardPercentage / 100) * netUsdVolume) / gnoUsdPrice;

  return gnoRewards;
}
