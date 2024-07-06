import { gnosisPaySpendAddress, gnosisPaySpenderModuleAddress } from '@karpatkey/gnosis-pay-rewards-sdk';
import { PublicClient, Transport } from 'viem';
import { gnosis } from 'viem/chains';

import { Address } from 'viem';

export async function getGnosisPayRefundLogs({
  client,
  fromBlock,
  toBlock,
  tokenAddresses,
  retries = 30,
  verbose = false,
}: {
  tokenAddresses: Address[];
  /**
   * The start block to index from
   */
  fromBlock: bigint;
  /**
   * The end block to index to
   */
  toBlock: bigint;
  /**
   * The public client to use
   */
  client: PublicClient<Transport, typeof gnosis>;
  /**
   * Number of retries to attempt if the request fails
   */
  retries?: number;
  verbose?: boolean;
}) {
  try {
    const logs = await client.getLogs({
      fromBlock,
      toBlock,
      event: erc20TokenTransferAbiItem,
      args: {
        from: gnosisPaySpendAddress,
      },
      address: tokenAddresses,
      strict: true,
    });
    return logs;
  } catch (error) {
    if (verbose) {
      console.error(error);
    }
    if (retries > 0) {
      return getGnosisPayRefundLogs({ client, fromBlock, toBlock, tokenAddresses, retries: retries - 1 });
    }

    throw error;
  }
}

export const erc20TokenTransferAbiItem = {
  name: 'Transfer',
  type: 'event',
  inputs: [
    { indexed: false, internalType: 'address', name: 'from', type: 'address' },
    { indexed: false, internalType: 'address', name: 'to', type: 'address' },
    { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' },
  ],
} as const;
