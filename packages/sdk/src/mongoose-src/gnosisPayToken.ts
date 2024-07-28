import { Schema, Mongoose, Model } from 'mongoose';
import { Address, isAddressEqual } from 'viem';
import { TokenDocumentFieldsType } from '../database/gnosisPayToken';
import { mongooseSchemaAddressField } from './sharedSchemaFields';

export const gnosisPayTokenModelName = 'Token' as const;

const gnosisPayTokenSchema = new Schema<TokenDocumentFieldsType>(
  {
    _id: mongooseSchemaAddressField,
    symbol: {
      type: String,
      required: true,
    },
    decimals: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    chainId: {
      type: Number,
      required: true,
    },
    oracle: mongooseSchemaAddressField,
  },
  {
    _id: false, // Disable the _id field
    timestamps: true,
  }
);

export function getTokenModel(mongooseConnection: Mongoose): Model<TokenDocumentFieldsType> {
  // Return cached model if it exists
  if (mongooseConnection.models[gnosisPayTokenModelName]) {
    return mongooseConnection.models[gnosisPayTokenModelName] as Model<TokenDocumentFieldsType>;
  }

  return mongooseConnection.model(gnosisPayTokenModelName, gnosisPayTokenSchema);
}

/**
 * Migrate the tokens to the database
 * @param mongooseClient - The mongoose client
 */
export async function saveGnosisPayTokensToDatabase(
  tokenModel: Model<TokenDocumentFieldsType>,
  tokens: TokenDocumentFieldsType[],
  clean = false
) {
  const mongooseSession = await tokenModel.startSession();
  mongooseSession.startTransaction();

  try {
    if (clean === true) {
      await tokenModel.deleteMany({}, { session: mongooseSession });
    }

    // Skip adding if the entries already exist
    const existingTokens = await tokenModel.find({}, { _id: 1 }, { session: mongooseSession });

    const gpTokensWithId = tokens
      .map(({ address, ...token }) => ({
        ...token,
        // Make sure the address is lowercase
        address: address.toLowerCase(),
        _id: address.toLowerCase(),
      }))
      // Remove tokens that exist in the existingTokens
      .filter(
        (token) =>
          !existingTokens.some((t) => {
            return isAddressEqual(t._id as Address, token._id as Address);
          })
      );

    await tokenModel.insertMany(gpTokensWithId, { session: mongooseSession });
    await mongooseSession.commitTransaction();
  } catch (error) {
    await mongooseSession.abortTransaction();
    throw error;
  } finally {
    await mongooseSession.endSession();
  }
}
