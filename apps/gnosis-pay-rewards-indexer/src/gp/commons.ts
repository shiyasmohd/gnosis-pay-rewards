import { PublicClient, Transport } from 'viem';
import { gnosis } from 'viem/chains';

/**
 * Common params for all GnosisPay getLogs functions
 */
export type GnosisPayGetLogsParams = {
  client: PublicClient<Transport, typeof gnosis>;
  fromBlock: bigint;
  toBlock: bigint;
  retries?: number;
  verbose?: boolean;
};

export const erc20TransferEventAbiItem = {
  name: 'Transfer',
  type: 'event',
  inputs: [
    { indexed: false, internalType: 'address', name: 'from', type: 'address' },
    { indexed: false, internalType: 'address', name: 'to', type: 'address' },
    { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' },
  ],
} as const;

export const gnosisPaySafeAvatarFunctionAbiItem = {
  inputs: [],
  name: 'avatar',
  outputs: [{ internalType: 'address', name: '', type: 'address' }],
  stateMutability: 'view',
  type: 'function',
} as const;

export const erc721TransferEventAbiItem = {
  type: 'event',
  name: 'Transfer',
  inputs: [
    { indexed: true, name: 'from', type: 'address' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: true, name: 'tokenId', type: 'uint256' },
  ],
} as const;
