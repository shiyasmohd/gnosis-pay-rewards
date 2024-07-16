import { SpendTransactionFieldsTypeUnpopulated, isValidWeekDataId } from '@karpatkey/gnosis-pay-rewards-sdk';
import { Model, Mongoose, Schema } from 'mongoose';
import { Address, isAddress, isHash } from 'viem';

export const spendTransactionSchema = new Schema<SpendTransactionFieldsTypeUnpopulated>(
  {
    _id: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => isHash(value),
        message: '{VALUE} is not a valid hash',
      },
    },
    blockNumber: {
      type: Number,
      required: true,
    },
    weekId: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => isValidWeekDataId(value),
        message: '{VALUE} is not a valid week ID, must be in YYYY-MM-DD format',
      },
    },
    blockTimestamp: {
      type: Number,
      required: true,
    },
    transactionHash: {
      type: String,
      required: true,
    },
    spentAmountRaw: {
      type: String,
      required: true,
    },
    spentAmount: {
      type: Number,
      required: true,
    },
    spentAmountUsd: {
      type: Number,
      required: true,
    },
    gnoBalanceRaw: {
      type: String,
      required: true,
    },
    gnoBalance: {
      type: Number,
      required: true,
    },
    spentToken: {
      type: String,
      ref: 'Token',
      required: true,
    },
    safeAddress: {
      type: String,
      required: true,
      validate: {
        validator: (value: Address) => isAddress(value),
        message: 'Invalid address',
      },
    },
  },
  {
    _id: false,
  }
);

export const modelName = 'SpendTransaction' as const;

export function getSpendTransactionModel(mongooseConnection: Mongoose) {
  // Return cached model if it exists
  if (mongooseConnection.models[modelName]) {
    return mongooseConnection.models[modelName] as Model<SpendTransactionFieldsTypeUnpopulated>;
  }

  return mongooseConnection.model(modelName, spendTransactionSchema);
}
