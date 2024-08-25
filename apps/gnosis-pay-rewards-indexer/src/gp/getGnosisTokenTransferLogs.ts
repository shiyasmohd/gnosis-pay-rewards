import { gnoToken } from '@karpatkey/gnosis-pay-rewards-sdk';
import { PublicClient, Transport } from 'viem';
import { gnosis } from 'viem/chains';

export async function getGnosisTokenTransferLogs({
  client,
  fromBlock,
  toBlock,
  retries = 30,
  verbose = false,
}: {
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
      address: gnoToken.address,
      event: erc20TokenTransferAbiItem,
      strict: true,
    });
    return logs;
  } catch (error) {
    if (verbose) {
      console.error(error);
    }
    if (retries > 0) {
      return getGnosisTokenTransferLogs({ client, fromBlock, toBlock, retries: retries - 1 });
    }

    throw error;
  }
}

const erc20TokenTransferAbiItem = {
  name: 'Transfer',
  type: 'event',
  inputs: [
    { indexed: false, internalType: 'address', name: 'from', type: 'address' },
    { indexed: false, internalType: 'address', name: 'to', type: 'address' },
    { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' },
  ],
} as const;