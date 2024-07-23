import { GnosisPayTransactionFieldsType_Unpopulated } from '@karpatkey/gnosis-pay-rewards-sdk';
import { ClientSession, HydratedDocument, Model, Mongoose, Schema } from 'mongoose';
import { Address, isAddress } from 'viem';

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

const addressField = {
  type: String,
  required: true,
  validate: {
    validator: (value: string) => isAddress(value),
    message: '{VALUE} is not a valid address',
  },
};

const gnosisPaySafeAddressSchema = new Schema<GnosisPaySafeAddressDocumentFieldsType>({
  _id: addressField,
  netUsdVolume: {
    type: Number,
    required: true,
  },
  gnoBalance: {
    type: Number,
    required: true,
  },
  address: addressField,
  owners: {
    type: [String],
    required: true,
    validate: {
      validator: (value: Address[]) => value.every((address) => isAddress(address)),
      message: '{VALUE} is not a valid address',
    },
  },
  isOg: {
    type: Boolean,
    required: true,
  },
  transactions: {
    type: [String],
    ref: 'GnosisPayTransaction' as const,
    default: [],
  },
});

type GnosisPaySafeAddressModel = Model<GnosisPaySafeAddressDocumentFieldsType>;

export const modelName = 'GnosisPaySafeAddress';

export function getGnosisPaySafeAddressModel(mongooseConnection: Mongoose): GnosisPaySafeAddressModel {
  // Return cached model if it exists
  if (mongooseConnection.models[modelName]) {
    return mongooseConnection.models[modelName];
  }

  return mongooseConnection.model<GnosisPaySafeAddressDocumentFieldsType>(modelName, gnosisPaySafeAddressSchema);
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
