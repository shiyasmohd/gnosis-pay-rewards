import { gnoToken, gnosisPayRewardDistributionSafeAddress } from '@karpatkey/gnosis-pay-rewards-sdk';
import { PublicClient, Transport, erc20Abi } from 'viem';
import { gnosis } from 'viem/chains';

export async function getGnosisPayRewardDistributionLogs({
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
      address: gnoToken.address,
      args: {
        from: gnosisPayRewardDistributionSafeAddress,
      },
      event: erc20Abi[1],
      fromBlock,
      toBlock,
      strict: true,
    });
    return logs;
  } catch (error) {
    if (verbose) {
      console.error(error);
    }
    if (retries > 0) {
      return getGnosisPayRewardDistributionLogs({ client, fromBlock, toBlock, retries: retries - 1 });
    }

    throw error;
  }
}
