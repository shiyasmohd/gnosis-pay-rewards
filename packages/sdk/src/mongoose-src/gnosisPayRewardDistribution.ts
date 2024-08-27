import { Model, Mongoose, Schema } from 'mongoose';

import { mongooseSchemaAddressField, mongooseSchemaHashField, mongooseSchemaWeekIdField } from './sharedSchemaFields';
import { Address } from 'viem';

export const gnosisPayRewardDistributionModelName = 'GnosisPayRewardDistribution' as const;

export type GnosisPayRewardDistributionDocumentFieldsType = {
  _id: `0x${string}`;
  transactionHash: `0x${string}`;
  blockNumber: number;
  amount: number;
  safe: Address;
};

export const gnosisPayRewardDistributionSchema = new Schema<GnosisPayRewardDistributionDocumentFieldsType>({
  _id: mongooseSchemaHashField,
  transactionHash: mongooseSchemaHashField,
  blockNumber: { type: Number, required: true },
  amount: { type: Number, required: true },
  safe: mongooseSchemaAddressField,
});

type GnosisPayRewardDistributionModelType = Model<GnosisPayRewardDistributionDocumentFieldsType>;

/**
 * Create a model for the GnosisPayRewardDistribution collection.
 * @param mongooseConnection - The mongoose connection.
 * @returns The model for the GnosisPayRewardDistribution collection.
 */
export function createGnosisPayRewardDistributionModel(mongooseConnection: Mongoose): GnosisPayRewardDistributionModelType {
    // Return cached model if it exists
  if (mongooseConnection.models[gnosisPayRewardDistributionModelName]) {
    return mongooseConnection.models[gnosisPayRewardDistributionModelName];
  }

  return mongooseConnection.model<GnosisPayRewardDistributionDocumentFieldsType>(
    gnosisPayRewardDistributionModelName,
    gnosisPayRewardDistributionSchema
  );
}