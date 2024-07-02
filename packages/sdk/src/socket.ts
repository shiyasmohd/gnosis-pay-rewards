import type { Server as SocketIoServer } from 'socket.io';

import { PendingRewardFieldsTypePopulated } from './database/pendingReward';

export interface GnosisPayRewardsServerToClientEventsType {
  newPendingReward: (data: PendingRewardFieldsTypePopulated) => void;
  recentPendingRewards: (data: PendingRewardFieldsTypePopulated[]) => void;
  pong: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export type GnosisPayRewardsClientToServerEventsType = {
  getRecentPendingRewards: (limit: number) => void;
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
