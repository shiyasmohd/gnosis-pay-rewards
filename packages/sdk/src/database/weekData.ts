import dayjsCore from 'dayjs';
import dayjsUtcPlugin from 'dayjs/plugin/utc.js';
import updateLocalePlugin from 'dayjs/plugin/updateLocale.js';

dayjsCore.extend(dayjsUtcPlugin);
dayjsCore.extend(updateLocalePlugin);

const WEEK_ID_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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
export function toWeekId(unixTimestamp: number): WeekIdFormatType {
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
  return weekDataId.match(WEEK_ID_REGEX) !== null; // YYYY-MM-DD
}

/**
 * Find the week data ID for a given Unix timestamp
 * @param unixTimestampOrString - The Unix timestamp
 * @returns The week data ID
 * @throws An error if the input is not a valid Unix timestamp or week data ID
 */
export function findWeekDataId(stringWithWeekDataId: string): WeekIdFormatType | null {
  if (typeof stringWithWeekDataId !== 'string') {
    throw new Error(`findWeekDataId: invalid value (${stringWithWeekDataId})`);
  }

  // find the YYYY-MM-DD format
  const yyyyMMDD = stringWithWeekDataId.match(WEEK_ID_REGEX);

  if (yyyyMMDD && yyyyMMDD.length > 0) {
    return yyyyMMDD[0] as WeekIdFormatType;
  }

  return null;
}
