import { Address } from 'viem';
import { WeekIdFormatType } from './weekData';
import { GnosisPayTransactionFieldsType_Unpopulated } from './spendTransaction';

export type WeekCashbackRewardDocumentFieldsTypeBase<TransactionsFieldType> = {
  _id: `${WeekIdFormatType}/${Address}`; // e.g. 2024-03-01/0x123456789abcdef123456789abcdef123456789ab
  address: Address;
  week: WeekIdFormatType;
  /**
   * The estimated reward for the week
   */
  estimatedReward: number;
  /**
   * The highest GNO balance of the user at the end of the week
   */
  maxGnoBalance: number;
  /**
   * The lowest GNO balance of the user at the end of the week
   */
  minGnoBalance: number;
  /**
   * The net USD volume of the user at the end of the week, refunds will reduce this number
   */
  netUsdVolume: number;
  /**
   * The transactions that were used to calculate the cashback reward
   */
  transactions: TransactionsFieldType[];
};

export type WeekCashbackRewardDocumentFieldsType_Unpopulated = WeekCashbackRewardDocumentFieldsTypeBase<string>;
export type WeekCashbackRewardDocumentFieldsType_Populated =
  WeekCashbackRewardDocumentFieldsTypeBase<GnosisPayTransactionFieldsType_Unpopulated>;
