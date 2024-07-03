import { gnosisPayTokens, TokenDocumentFieldsType } from '@karpatkey/gnosis-pay-rewards-sdk';
import { Schema, Mongoose, Model } from 'mongoose';
import { Address, isAddress, isAddressEqual } from 'viem';

const tokenSchema = new Schema<TokenDocumentFieldsType>(
  {
    _id: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => isAddress(value),
        message: '{VALUE} is not a valid address',
      },
    },
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
  },
  {
    _id: false, // Disable the _id field
    timestamps: true,
  }
);

export const modelName = 'Token' as const;

export function getTokenModel(mongooseConnection: Mongoose): Model<TokenDocumentFieldsType> {
  // Return cached model if it exists
  if (mongooseConnection.models[modelName]) {
    return mongooseConnection.models[modelName] as Model<TokenDocumentFieldsType>;
  }

  return mongooseConnection.model(modelName, tokenSchema);
}

/**
 * Migrate the tokens to the database
 * @param mongooseClient - The mongoose client
 */
export async function migrateGnosisPayTokensToDatabase(tokenModel: Model<TokenDocumentFieldsType>) {

  // Skip adding if the entries already exist
  const existingTokens = await tokenModel.find({});

  const gpTokensWithId = gnosisPayTokens
    .map((token) => ({
      ...token,
      // Make sure the address is lowercase
      address: token.address.toLowerCase(),
      _id: token.address.toLowerCase(),
    }))
    // Remove tokens that exist in the existingTokens
    .filter(
      (token) =>
        !existingTokens.some((t) => {
          return isAddressEqual(t._id as Address, token._id as Address);
        })
    );

  const session = await tokenModel.startSession();
  session.startTransaction();
  try {
    await tokenModel.insertMany(gpTokensWithId, { session });
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}
