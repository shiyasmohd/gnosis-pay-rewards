/**
 * The month-to-date USD volume threshold, over which the user is no
 * longer eligible for the GNO rewards.
 */
const MONTH_TO_DATE_USD_VOLUME_THRESHOLD = 20_000;

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
  weekUsdVolume: number;
  /**
   * The GNO balance for the week
   */
  gnoBalance: number;
  /**
   * Four weeks USD volume
   */
  fourWeeksUsdVolume: number;
};

/**
 * Calculate the rewards for a given week given the net USD volume and GNO balance.
 * Negative USD volumes are ignored as they don't contribute to the rewards.
 */
export function calculateWeekRewardAmount({
  gnoUsdPrice,
  isOgNftHolder,
  weekUsdVolume,
  gnoBalance,
  fourWeeksUsdVolume,
}: CalculateWeekRewardCommonParams): number {
  if (gnoUsdPrice <= 0) {
    throw new Error('gnoUsdPrice must be greater than 0');
  }

  // If the month-to-date USD volume is greater than the threshold, the user is eligible for the OG NFT holder reward
  if (fourWeeksUsdVolume >= MONTH_TO_DATE_USD_VOLUME_THRESHOLD) {
    return 0;
  }

  if (weekUsdVolume <= 0 || gnoBalance === 0) {
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
  const gnoRewards = ((rewardPercentage / 100) * weekUsdVolume) / gnoUsdPrice;

  return gnoRewards;
}
