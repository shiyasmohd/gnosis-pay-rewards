export type IndexerStateAtomType = {
  /**
   * The block size to index in each fetch, defaults to
   */
  fetchBlockSize: bigint;
  latestBlockNumber: bigint;
  fromBlockNumber: bigint;
  toBlockNumber: bigint;
};
