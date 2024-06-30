export function createEmptyArray<ArrayItemType extends number[]>(length: number) {
  return Array.from({
    length,
  }) as ArrayItemType;
}

export function clampToBlockRange(startBlock: bigint, latestBlockNumber: bigint, blockSize: bigint): bigint {
  const toBlock = startBlock + blockSize;
  return toBlock > latestBlockNumber ? latestBlockNumber : toBlock;
}
