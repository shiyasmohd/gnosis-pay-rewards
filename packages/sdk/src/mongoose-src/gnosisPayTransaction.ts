import { Model, Mongoose, Schema } from 'mongoose';
import { isHash } from 'viem';
import { mongooseSchemaAddressField, mongooseSchemaWeekIdField } from './sharedSchemaFields';
import { GnosisPayTransactionFieldsType_Unpopulated, GnosisPayTransactionType } from '../database/spendTransaction';
import { isValidWeekDataId } from '../database/weekData';

export const gnosisPayTransactionModelName = 'GnosisPayTransaction' as const;

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
    weekId: mongooseSchemaWeekIdField,
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
      ...mongooseSchemaAddressField,
      ref: 'GnosisPaySafeAddress',
      required: true,
    },
  },
  {
    _id: false,
  }
);

type GetTransactionModel = Model<GnosisPayTransactionFieldsType_Unpopulated>;

export function getGnosisPayTransactionModel(mongooseConnection: Mongoose): GetTransactionModel {
  // Return cached model if it exists
  if (mongooseConnection.models[gnosisPayTransactionModelName]) {
    return mongooseConnection.models[gnosisPayTransactionModelName] as GetTransactionModel;
  }

  return mongooseConnection.model(gnosisPayTransactionModelName, gnosisPayTransactionSchema) as GetTransactionModel;
}
