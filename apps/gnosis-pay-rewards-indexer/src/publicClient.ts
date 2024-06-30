import { createPublicClient, http, webSocket } from 'viem';
import { JSON_RPC_PROVIDER_GNOSIS, WEBSOCKET_JSON_RPC_PROVIDER_GNOSIS } from './config/env.js';
import { gnosis } from 'viem/chains';

/**
 * Gnosis chain public client for the running indexer
 */
export const gnosisChainPublicClient = createPublicClient({
  chain: gnosis,
  transport: WEBSOCKET_JSON_RPC_PROVIDER_GNOSIS
    ? webSocket(WEBSOCKET_JSON_RPC_PROVIDER_GNOSIS)
    : http(JSON_RPC_PROVIDER_GNOSIS),
  batch: {
    multicall: true,
  },
});
