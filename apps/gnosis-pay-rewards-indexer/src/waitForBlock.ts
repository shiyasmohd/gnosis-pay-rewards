import { PublicClient, Transport, BlockTag } from 'viem';
import { gnosis } from 'viem/chains';

export function waitForBlock<TBlockTag extends BlockTag>({
  blockNumber,
  blockTag,
  client,
}: {
  blockNumber: bigint;
  /**
   * The public client to use
   */
  client: PublicClient<Transport, typeof gnosis>;
  blockTag?: TBlockTag;
}) {
  return new Promise((resolve) => {
    client.watchBlocks<false, TBlockTag>({
      blockTag: blockTag,
      onBlock(block) {
        if (block && block.number && block.number >= blockNumber) {
          resolve(block);
        }
      },
    });
  });
}
