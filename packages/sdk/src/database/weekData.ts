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
