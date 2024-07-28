import dayjsCore from 'dayjs';
import dayjsUtcPlugin from 'dayjs/plugin/utc.js';
import updateLocalePlugin from 'dayjs/plugin/updateLocale.js';

dayjsCore.extend(dayjsUtcPlugin);
dayjsCore.extend(updateLocalePlugin);

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

export type WeekIdFormatType = 'YYYY-MM-DD';

/**
 * ISO 8601 date format
 */
export const weekIdFormat = 'YYYY-MM-DD' as const;

/**
 * Convert a Unix timestamp to a week data ID
 * @param unixTimestamp - The Unix timestamp
 * @returns The week data ID
 */
export function toWeekDataId(unixTimestamp: number): WeekIdFormatType {
  const weekStart = dayjsCore.unix(unixTimestamp).utc().startOf('week');
  const yyyyMMDD = weekStart.format(weekIdFormat);

  return yyyyMMDD as WeekIdFormatType;
}

/**
 * Check if a week data ID is valid
 * @param weekDataId - The week data ID
 * @returns True if the week data ID is valid, false otherwise
 */
export function isValidWeekDataId(weekDataId: string): boolean {
  return weekDataId.match(/^\d{4}-\d{2}-\d{2}$/) !== null; // YYYY-MM-DD
}
