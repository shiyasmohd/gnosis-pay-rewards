import type { Server as SocketIoServer } from 'socket.io';

import { PendingRewardFieldsTypePopulated } from './database/pendingReward';

export interface GnosisPayRewardsServerToClientEventsType {
  spend: (data: PendingRewardFieldsTypePopulated) => void;
  pong: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export type GnosisPayRewardsClientToServerEventsType = Record<string, never>;

export interface GnosisPayRewardsInterServerEventsType {
  ping: () => void;
  pong: () => void;
}

export type GnosisPayRewardsServerInstanceType = SocketIoServer<
  GnosisPayRewardsClientToServerEventsType,
  GnosisPayRewardsServerToClientEventsType,
  GnosisPayRewardsInterServerEventsType,
  any
>;
