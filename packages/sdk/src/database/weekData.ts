import dayjs from 'dayjs';
import dayjsUtils from 'dayjs/plugin/utc';

dayjs.extend(dayjsUtils);

export type WeekSnapshotDocumentFieldsType = {
  /**
   * Week date in YYYY-MM-DD format
   */
  date: string;
  /**
   * Total USD volume for the week
   */
  totalUsdVolume: number;
  /**
   * Transactions for the week
   */
  transactions: string[];
};

/**
 * ISO 8601 date format
 */
export const weekDataIdFormat = 'YYYY-MM-DD' as const;

/**
 * Convert a Unix timestamp to a week data ID
 * @param unixTimestamp - The Unix timestamp
 * @returns The week data ID
 */
export function toWeekDataId(unixTimestamp: number): string {
  const weekStart = dayjs.unix(unixTimestamp).utc().startOf('week');
  const yyyyMMDD = weekStart.format(weekDataIdFormat);

  return yyyyMMDD;
}
