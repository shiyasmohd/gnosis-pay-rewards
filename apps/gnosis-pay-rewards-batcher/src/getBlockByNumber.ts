import { ConditionalReturnType } from '@karpatkey/gnosis-pay-rewards-sdk';
import { PublicClient, Transport, Block } from 'viem';
import { gnosis } from 'viem/chains';

const blockCache = new Map<bigint, Block>();

export async function getBlockByNumber({
  blockNumber,
  client,
  useCache = true,
}: {
  /**
   * The block number to get
   */
  blockNumber: bigint;
  /**
   * The public client to use
   */
  client: PublicClient<Transport, typeof gnosis>;
  /**
   * Whether to use the cache
   * @default true
   */
  useCache?: boolean;
}): Promise<ConditionalReturnType<true, Block, Error> | ConditionalReturnType<false, Block, Error>> {
  if (useCache === true && blockCache.has(blockNumber)) {
    return {
      data: blockCache.get(blockNumber),
      error: null,
    } as ConditionalReturnType<true, Block, Error>;
  }

  try {
    const data = await client.getBlock({ blockNumber });

    blockCache.set(blockNumber, data);

    return {
      data,
      error: null,
    } as ConditionalReturnType<true, Block, Error>;
  } catch (getBlockError) {
    return {
      data: null,
      error: getBlockError as Error,
    } as ConditionalReturnType<false, Block, Error>;
  }
}
