import { GnosisPayTransactionFieldsType_Unpopulated } from './database/spendTransaction';
import { calculateNetUsdVolume } from './database/utils';

type CalculateWeekRewardCommonParams = {
  /**
   * The GNO USD price reference to use when calculating rewards
   */
  gnoUsdPrice: number;
  /**
   * Whether the user is an Gnois Pay OG NFT holder. This adds 1% to the reward percentage.
   * See [https://gnosispay.niftyfair.io/](https://gnosispay.niftyfair.io/)
   */
  isOgNftHolder: boolean;
  /**
   * The transactions to calculate the rewards for
   */
  transactions: GnosisPayTransactionFieldsType_Unpopulated[];
};

/**
 * Calculate the rewards for a given week with a list of transactions.
 * Requires a list of transactions to calculate the rewards for and calculates the net USD volume for the week.
 *
 * The GNO balance is the lowest GNO balance among the transactions.
 *
 * Negative USD volumes are ignored as they don't contribute to the rewards.
 */
export function calculateWeekRewardAmount({
  gnoUsdPrice,
  isOgNftHolder,
  transactions,
}: CalculateWeekRewardCommonParams) {
  const netUsdVolume = calculateNetUsdVolume(transactions);

  if (netUsdVolume <= 0) {
    return 0;
  }

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
    rewardPercentage = 3 + (gnoBalance - 10) / 90;
  } else if (gnoBalance >= 1) {
    rewardPercentage = 2 + (gnoBalance - 1) / 9;
  } else if (gnoBalance >= 0.1) {
    rewardPercentage = 1 + (gnoBalance - 0.1) / 0.9;
  } else {
    rewardPercentage = 0; // Not eligible for rewards
  }

  // Add OG GP NFT holder boost if applicable
  if (isOgNftHolder && gnoBalance >= 0.1) {
    rewardPercentage += 1;
  }

  // Calculate GNO rewards
  const gnoRewards = ((rewardPercentage / 100) * netUsdVolume) / gnoUsdPrice;

  return gnoRewards;
}
