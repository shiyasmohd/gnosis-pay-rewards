import { Address } from 'viem';
import { WeekIdFormatType } from './weekData';

export type GnosisTokenBalanceSnapshotDocumentType = {
  weekId: WeekIdFormatType;
  safe: Address;
  balanceRaw: string;
  balance: number;
  blockNumber: number;
  blockTimestamp: number;
};
