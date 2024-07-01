import { gnosisPayTokens, TokenDocumentFieldsType } from '@karpatkey/gnosis-pay-rewards-sdk';
import { Schema, Mongoose } from 'mongoose';
import { isAddress } from 'viem';

const TokenSchema = new Schema<TokenDocumentFieldsType>(
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
  },
);

/**
 * Migrate the tokens to the database
 * @param mongooseClient - The mongoose client
 */
export async function migrateGnosisPayTokensToDatabase(mongooseClient: Mongoose) {
  // Make sure the model is not already defined
  if (mongooseClient.models.gnosisPayTokens) {
    console.log('Gnosis Pay tokens already migrated');
    return;
  }

  const mongooseTokenModel = mongooseClient.model<TokenDocumentFieldsType>('Token', TokenSchema);

  // Skip adding if the entries already exist
  const existingTokens = await mongooseTokenModel.find({});

  const gpTokensWithId = gnosisPayTokens
    .map((token) => ({
      ...token,
      _id: token.address,
    }))
    // Remove tokens that exist in the existingTokens
    .filter((token) => !existingTokens.some((t) => t._id === token._id));

  const session = await mongooseClient.startSession();
  session.startTransaction();
  try {
    await mongooseTokenModel.insertMany(gpTokensWithId, { session });
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}
