import { ClientSession, HydratedDocument, Model, Mongoose, Schema } from 'mongoose';
import { Address } from 'viem';
import { GnosisPayTransactionFieldsType_Unpopulated } from '../database/spendTransaction';
import { mongooseSchemaAddressField } from './sharedSchemaFields';
import { gnosisPayTransactionModelName } from './gnosisPayTransaction';

export const gnosisPaySafeAddressModelName = 'GnosisPaySafeAddress' as const;

type GnosisPaySafeAddressDocumentFieldsType = {
  _id: Address;
  address: Address;
  netUsdVolume: number;
  gnoBalance: number;
  owners: Address[];
  /**
   * If the safe is an original Gnosis Pay Safe
   */
  isOg: boolean;
  transactions: string[];
};

export type GnosisPaySafeAddressDocumentFieldsType_Unpopulated = GnosisPaySafeAddressDocumentFieldsType;

export type GnosisPaySafeAddressDocumentFieldsType_WithTransactionsPopulated = GnosisPaySafeAddressDocumentFieldsType & {
  transactions: GnosisPayTransactionFieldsType_Unpopulated[];
};

const gnosisPaySafeAddressSchema = new Schema<GnosisPaySafeAddressDocumentFieldsType>({
  _id: mongooseSchemaAddressField,
  netUsdVolume: {
    type: Number,
    required: true,
  },
  gnoBalance: {
    type: Number,
    required: true,
  },
  address: mongooseSchemaAddressField,
  owners: [mongooseSchemaAddressField],
  isOg: {
    type: Boolean,
    required: true,
  },
  transactions: [
    {
      type: mongooseSchemaAddressField,
      ref: gnosisPayTransactionModelName,
    },
  ],
});

type GnosisPaySafeAddressModel = Model<GnosisPaySafeAddressDocumentFieldsType>;

export function getGnosisPaySafeAddressModel(mongooseConnection: Mongoose): GnosisPaySafeAddressModel {
  // Return cached model if it exists
  if (mongooseConnection.models[gnosisPaySafeAddressModelName]) {
    return mongooseConnection.models[gnosisPaySafeAddressModelName];
  }

  return mongooseConnection.model<GnosisPaySafeAddressDocumentFieldsType>(
    gnosisPaySafeAddressModelName,
    gnosisPaySafeAddressSchema
  );
}

export async function createGnosisPaySafeAddressDocument(
  gnosisPaySafeAddressModel: Model<GnosisPaySafeAddressDocumentFieldsType>,
  safeAddress: Address,
  mongooseSession?: ClientSession
): Promise<HydratedDocument<GnosisPaySafeAddressDocumentFieldsType>> {
  safeAddress = safeAddress.toLowerCase() as Address;

  const gnosisPaySafeAddressDocument = await gnosisPaySafeAddressModel.findById(
    safeAddress,
    {},
    { session: mongooseSession }
  );

  if (gnosisPaySafeAddressDocument !== null) {
    return gnosisPaySafeAddressDocument;
  }

  return new gnosisPaySafeAddressModel<GnosisPaySafeAddressDocumentFieldsType>({
    _id: safeAddress,
    address: safeAddress,
    netUsdVolume: 0,
    gnoBalance: 0,
    owners: [],
    isOg: false,
    transactions: [],
  }).save({ session: mongooseSession });
}