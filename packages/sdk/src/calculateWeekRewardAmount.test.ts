import { describe, expect, test } from '@jest/globals';

import { calculateWeekRewardAmount } from './calculateWeekRewardAmount';

describe('calculateWeekRewardAmount', () => {
  const fourWeeksUsdVolumeThreshold = 22_000; // using the USDC threshold for tests
  const gnoUsdPrice = 200;

  const cases = [
    { gnoBalance: 100, expectedRewardPercentage: 4 },
    { gnoBalance: 10, expectedRewardPercentage: 3 },
    { gnoBalance: 1, expectedRewardPercentage: 2 },
    { gnoBalance: 0.1, expectedRewardPercentage: 1 },
  ];

  for (const { gnoBalance, expectedRewardPercentage } of cases) {
    const weekUsdVolume = 7_000;
    const fourWeeksUsdVolume = 23_000;

    test(`returns ${expectedRewardPercentage}% for ${gnoBalance} GNO balance`, () => {
      const rewardAmount = calculateWeekRewardAmount({
        gnoUsdPrice,
        fourWeeksUsdVolumeThreshold,
        gnoBalance,
        isOgNftHolder: false,
        fourWeeksUsdVolume,
        weekUsdVolume,
      });
      const actualRewardPercentage = (rewardAmount * 100 * gnoUsdPrice) / weekUsdVolume;
      expect(actualRewardPercentage).toBe(expectedRewardPercentage);
    });

    test(`returns ${expectedRewardPercentage}+1% when ${gnoBalance} GNO balance for OG NFT holders `, () => {
      const rewardAmount = calculateWeekRewardAmount({
        gnoUsdPrice,
        fourWeeksUsdVolumeThreshold,
        gnoBalance,
        isOgNftHolder: true,
        weekUsdVolume,
        fourWeeksUsdVolume,
      });
      const actualRewardPercentage = (rewardAmount * 100 * gnoUsdPrice) / weekUsdVolume;
      console.log(actualRewardPercentage);
      expect(actualRewardPercentage).toBe(expectedRewardPercentage + 1);
    });
  }

  test('returns 0 if the week volume is above the threshold', () => {
    const rewardAmount = calculateWeekRewardAmount({
      gnoUsdPrice,
      fourWeeksUsdVolumeThreshold,
      gnoBalance: 100,
      isOgNftHolder: false,
      weekUsdVolume: 22_001,
      fourWeeksUsdVolume: 23_000,
    });
    expect(rewardAmount).toBe(0);
  });

  test('returns 0 if the past 4 weeks volume is above the threshold and the week volume is greater than the threshold', () => {
    const rewardAmount = calculateWeekRewardAmount({
      gnoUsdPrice,
      fourWeeksUsdVolumeThreshold,
      gnoBalance: 100,
      isOgNftHolder: false,
      weekUsdVolume: 22_001,
      fourWeeksUsdVolume: 23_000,
    });
    expect(rewardAmount).toBe(0);
  });

  test('throws error if gnoUsdPrice <= 0', () => {
    expect(() =>
      calculateWeekRewardAmount({
        fourWeeksUsdVolumeThreshold,
        gnoUsdPrice: 0,
        gnoBalance: 100,
        isOgNftHolder: false,
        weekUsdVolume: 1000,
        fourWeeksUsdVolume: 1000,
      })
    ).toThrow('gnoUsdPrice must be greater than 0');
  });

  test('throws error if fourWeeksUsdVolumeThreshold <= 0', () => {
    expect(() =>
      calculateWeekRewardAmount({
        fourWeeksUsdVolumeThreshold: 0,
        gnoUsdPrice,
        gnoBalance: 100,
        isOgNftHolder: false,
        weekUsdVolume: 1000,
        fourWeeksUsdVolume: 1000,
      })
    ).toThrow('fourWeeksUsdVolumeThreshold must be greater than 0');
  });
});
