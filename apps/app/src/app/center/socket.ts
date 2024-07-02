'use client';
import type {
  GnosisPayRewardsServerToClientEventsType,
  GnosisPayRewardsClientToServerEventsType,
} from '@karpatkey/gnosis-pay-rewards-sdk';
import { io, Socket } from 'socket.io-client';

export let url = 'http://localhost:3003';

if (process.env.NEXT_PUBLIC_INDEXER_SOCKET_URL) {
  url = process.env.NEXT_PUBLIC_INDEXER_SOCKET_URL;
} else {
  console.warn('NEXT_PUBLIC_INDEXER_SOCKET_URL is not set. Using default URL: ws://localhost:4000');
}

/**
 * The socket.io client
 */
export const gnosisPayRewardsIndexerSocket: Socket<
  GnosisPayRewardsServerToClientEventsType,
  GnosisPayRewardsClientToServerEventsType
> = io(url as string);
