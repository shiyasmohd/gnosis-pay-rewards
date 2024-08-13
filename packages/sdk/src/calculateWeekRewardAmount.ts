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
   * The net USD volume for the week
   */
  netUsdVolume: number;
  /**
   * The GNO balance for the week
   */
  gnoBalance: number;
};

/**
 * Calculate the rewards for a given week given the net USD volume and GNO balance.
 * Negative USD volumes are ignored as they don't contribute to the rewards.
 */
export function calculateWeekRewardAmount({
  gnoUsdPrice,
  isOgNftHolder,
  netUsdVolume,
  gnoBalance,
}: CalculateWeekRewardCommonParams) {
  if (netUsdVolume <= 0 || gnoBalance === 0) {
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
