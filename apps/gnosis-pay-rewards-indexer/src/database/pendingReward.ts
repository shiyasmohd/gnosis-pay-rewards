import { PendingRewardFieldsTypeUnpopulated } from '@karpatkey/gnosis-pay-rewards-sdk';
import { Model, Mongoose, Schema } from 'mongoose';

import { Address, isAddress, isHash } from 'viem';

const pendingRewardSchema = new Schema<PendingRewardFieldsTypeUnpopulated>(
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
    blockTimestamp: {
      type: Number,
      required: true,
    },
    transactionHash: {
      type: String,
      required: true,
    },
    spentAmount: {
      type: String,
      required: true,
    },
    gnoBalance: {
      type: String,
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

const modelName = 'PendingReward' as const;

export function getPendingRewardModel(mongooseConnection: Mongoose) {
  // Return cached model if it exists
  if (mongooseConnection.models[modelName]) {
    return mongooseConnection.models[modelName] as Model<PendingRewardFieldsTypeUnpopulated>;
  }

  return mongooseConnection.model(modelName, pendingRewardSchema);
}
