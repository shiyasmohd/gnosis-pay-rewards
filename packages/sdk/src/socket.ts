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
  currentWeekMetricsSnapshot: (data: WeekSnapshotDocumentFieldsType) => void;
  currentWeekMetricsSnapshotUpdated: (data: WeekSnapshotDocumentFieldsType) => void;
  weekMetricsSnapshotByTimestamp: (data: WeekSnapshotDocumentFieldsType | null) => void;
  allWeekMetricsSnapshots: (data: WeekSnapshotDocumentFieldsType[]) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export type GnosisPayRewardsClientToServerEventsType = {
  getRecentTransactions: (limit: number) => void;
  getCurrentWeekMetricsSnapshot: () => void;
  getWeekMetricsSnapshotByTimestamp: (weekTimestamp: number) => void;
  getAllWeekMetricsSnapshots: () => void;
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
