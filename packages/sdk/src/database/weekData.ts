import dayjs from 'dayjs';
import dayjsUtcPlugin from 'dayjs/plugin/utc.js';

dayjs.extend(dayjsUtcPlugin);

export type WeekSnapshotDocumentFieldsType = {
  /**
   * Week date in YYYY-MM-DD format
   */
  date: string;
  /**
   * Total USD volume for the week
   */
  netUsdVolume: number;
  /**
   * Transactions for the week
   */
  transactions: string[];
};

export type WeekIdType = 'YYYY-MM-DD';

/**
 * ISO 8601 date format
 */
export const weekDataIdFormat = 'YYYY-MM-DD' as const;

/**
 * Convert a Unix timestamp to a week data ID
 * @param unixTimestamp - The Unix timestamp
 * @returns The week data ID
 */
export function toWeekDataId(unixTimestamp: number): WeekIdType {
  const weekStart = dayjs.unix(unixTimestamp).utc().startOf('week');
  const yyyyMMDD = weekStart.format(weekDataIdFormat);

  return yyyyMMDD as WeekIdType;
}

/**
 * Check if a week data ID is valid
 * @param weekDataId - The week data ID
 * @returns True if the week data ID is valid, false otherwise
 */
export function isValidWeekDataId(weekDataId: string): boolean {
  return weekDataId.match(/^\d{4}-\d{2}-\d{2}$/) !== null; // YYYY-MM-DD
}
