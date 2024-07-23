import {
  GnosisPayTransactionFieldsType_Unpopulated,
  isValidWeekDataId,
  GnosisPayTransactionType,
} from '@karpatkey/gnosis-pay-rewards-sdk';
import { Model, Mongoose, Schema } from 'mongoose';
import { Address, isAddress, isHash } from 'viem';
import { modelName as gnosisPaySafeAddressModelName } from './gnosisPaySafeAddress.js';

export const gnosisPayTransactionSchema = new Schema<GnosisPayTransactionFieldsType_Unpopulated>(
  {
    _id: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => isHash(value),
        message: '{VALUE} is not a valid hash',
      },
    },
    type: {
      type: String,
      enum: Object.values(GnosisPayTransactionType),
      required: true,
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
    amountRaw: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    amountUsd: {
      type: Number,
      required: true,
    },
    amountToken: {
      type: String,
      ref: 'Token',
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
    safeAddress: {
      ref: gnosisPaySafeAddressModelName,
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

export const modelName = 'GnosisPayTransaction' as const;

type GetTransactionModel = Model<GnosisPayTransactionFieldsType_Unpopulated>;

export function getGnosisPayTransactionModel(mongooseConnection: Mongoose): GetTransactionModel {
  // Return cached model if it exists
  if (mongooseConnection.models[modelName]) {
    return mongooseConnection.models[modelName] as GetTransactionModel;
  }

  return mongooseConnection.model(modelName, gnosisPayTransactionSchema) as GetTransactionModel;
}
