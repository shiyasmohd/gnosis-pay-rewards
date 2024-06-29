const gnoBalanceToRewardBips: { [key: number]: number } = {
  0.1: 100, // 1%
  1: 200, // 2%
  10: 300, // 3%
  100: 400, // 4%
  1000: 500, // 5%
} as const;

/**
 *
 * @param gnoBalance - GNO balance in GNO
 * @returns Rewards BIPS
 */
export function calcRewardAmount(gnoBalance: number): { amount: number; bips: number } {
  const tiers = Object.keys(gnoBalanceToRewardBips)
    .map(Number)
    .sort((a, b) => a - b);

  let rewardBips = 0;

  for (let i = tiers.length - 1; i >= 0; i--) {
    if (gnoBalance >= tiers[i]) {
      rewardBips = gnoBalanceToRewardBips[tiers[i]];
    }
  }

  // Return the amount of GNO balance  that is eligible for rewards
  return {
    amount: (rewardBips / 10_000) * gnoBalance,
    bips: rewardBips,
  };
}
