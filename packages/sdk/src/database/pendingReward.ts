import type { Address } from 'viem';
import { TokenDocumentFieldsType } from './gnosisPayToken';

export type PendingRewardFieldsType<SpentTokenFieldType> = {
  _id: string;
  /**
   * The number of the block
   */
  blockNumber: number;
  /**
   * The timestamp of the block
   */
  blockTimestamp: number;
  /**
   * The hash of the transaction
   */
  transactionHash: `0x${string}`;
  /**
   * The balance of the GNO in this snapshot
   */
  gnoBalance: string;
  /**
   * The amount of the GNO token that the Safe avatar received
   */
  gnoRewardAmount?: string;
  /**
   * The original Safe avatar that spend the money
   */
  safeAddress: Address;
  /**
   * The amount of the token that the Safe avatar spent
   */
  spentAmount: string;
  /**
   * The token that the Safe avatar spent
   */
  spentToken: SpentTokenFieldType;
};

export type PendingRewardFieldsTypeUnpopulated = PendingRewardFieldsType<Address>;
export type PendingRewardFieldsTypePopulated = PendingRewardFieldsType<TokenDocumentFieldsType>;
