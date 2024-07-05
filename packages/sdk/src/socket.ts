import type { Server as SocketIoServer } from 'socket.io';

import { PendingRewardFieldsTypePopulated } from './database/pendingReward';
import { WeekSnapshotDocumentFieldsType } from './database/weekData';

export interface GnosisPayRewardsServerToClientEventsType {
  newPendingReward: (data: PendingRewardFieldsTypePopulated) => void;
  recentPendingRewards: (data: PendingRewardFieldsTypePopulated[]) => void;
  currentWeekData: (data: WeekSnapshotDocumentFieldsType) => void;
  currentWeekDataUpdated: (data: WeekSnapshotDocumentFieldsType) => void;
  weekDataByTimestamp: (data: WeekSnapshotDocumentFieldsType | null) => void;
  allWeekData: (data: WeekSnapshotDocumentFieldsType[]) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export type GnosisPayRewardsClientToServerEventsType = {
  getRecentPendingRewards: (limit: number) => void;
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
