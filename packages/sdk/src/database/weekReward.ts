import { Address } from 'viem';
import { WeekIdFormatType } from './weekData';
import { GnosisPayTransactionFieldsType_Unpopulated } from './spendTransaction';
import { GnosisTokenBalanceSnapshotDocumentType } from './gnosisTokenBalanceSnapshot';

export type WeekCashbackRewardDocumentFieldsTypeBase<TransactionsFieldType, GnosisTokenBalanceSnapshotFieldType> = {
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
  /**
   * The GNO balance snapshots of the user at the end of the week
   */
  gnoBalanceSnapshots: GnosisTokenBalanceSnapshotFieldType[];
};

export type WeekCashbackRewardDocumentFieldsType_Unpopulated = WeekCashbackRewardDocumentFieldsTypeBase<string, string>;
export type WeekCashbackRewardDocumentFieldsType_Populated =
  WeekCashbackRewardDocumentFieldsTypeBase<GnosisPayTransactionFieldsType_Unpopulated, GnosisTokenBalanceSnapshotDocumentType>;
