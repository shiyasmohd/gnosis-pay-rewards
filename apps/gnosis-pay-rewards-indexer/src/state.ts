export type IndexerStateAtomType = {
  /**
   * Start block to index from
   */
  startBlock: bigint;
  /**
   * The block size to index in each fetch, defaults to
   */
  fetchBlockSize: bigint;
  /**
   * Distance to latest block in block numbers
   */
  distanceToLatestBlockNumber: bigint;
  latestBlockNumber: bigint;
  fromBlockNumber: bigint;
  toBlockNumber: bigint;
};
