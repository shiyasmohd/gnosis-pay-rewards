import type { Address } from 'viem';
import { TokenDocumentFieldsType } from './gnosisPayToken';

// https://niftyfair.io/gnosis/collection/0x88997988a6a5aaf29ba973d298d276fe75fb69ab/
// this is where you can mint the OG NFT

export type SpendTransactionFieldsType<SpentTokenFieldType> = {
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
  gnoBalanceRaw: string;
  /**
   * The balance of the GNO in this snapshot
   */
  gnoBalance: number;
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
  spentAmountRaw: string;
  /**
   * Use this as the value to display to the user
   */
  spentAmount: number;
  /**
   * The amount of the token that the Safe avatar spent in USD, this is converted at the exchange rate of the token
   */
  spentAmountUsd: number;
  /**
   * The token that the Safe avatar spent
   */
  spentToken: SpentTokenFieldType;
};

export type SpendTransactionFieldsTypeUnpopulated = SpendTransactionFieldsType<Address>;
export type SpendTransactionFieldsTypePopulated = SpendTransactionFieldsType<TokenDocumentFieldsType>;
