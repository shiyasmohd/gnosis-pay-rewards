import type { Server as SocketIoServer } from 'socket.io';

import { GnosisPayTransactionFieldsType_Populated } from './database/spendTransaction';
import { WeekSnapshotDocumentFieldsType } from './database/weekData';

export interface GnosisPayRewardsServerToClientEventsType {
  newTransaction: (data: GnosisPayTransactionFieldsType_Populated) => void;
  recentTransactions: (data: GnosisPayTransactionFieldsType_Populated[]) => void;
  newSpendTransaction: (data: GnosisPayTransactionFieldsType_Populated) => void;
  recentSpendTransactions: (data: GnosisPayTransactionFieldsType_Populated[]) => void;
  newRefundTransaction: (data: GnosisPayTransactionFieldsType_Populated) => void;
  recentRefundTransactions: (data: GnosisPayTransactionFieldsType_Populated[]) => void;
  currentWeekData: (data: WeekSnapshotDocumentFieldsType) => void;
  currentWeekDataUpdated: (data: WeekSnapshotDocumentFieldsType) => void;
  weekDataByTimestamp: (data: WeekSnapshotDocumentFieldsType | null) => void;
  allWeekData: (data: WeekSnapshotDocumentFieldsType[]) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export type GnosisPayRewardsClientToServerEventsType = {
  getRecentSpendTransactions: (limit: number) => void;
  getCurrentWeekData: () => void;
  getWeekDataByTimestamp: (weekTimestamp: number) => void;
  getAllWeekData: () => void;
};

export interface GnosisPayRewardsInterServerEventsType {
  ping: () => void;
  pong: () => void;
}

export type GnosisPayRewardsServerInstanceType = SocketIoServer<
  GnosisPayRewardsClientToServerEventsType,
  GnosisPayRewardsServerToClientEventsType,
  GnosisPayRewardsInterServerEventsType,
  Record<string, unknown>
>;
