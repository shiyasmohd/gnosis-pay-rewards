import { toWeekDataId, weekDataIdFormat } from '@karpatkey/gnosis-pay-rewards-sdk';
import { Model, Mongoose, Schema } from 'mongoose';

export type BlockDocumentFieldsType = {
  _id: number;
  number: number;
  hash: string;
  timestamp: number;
  weekId: typeof weekDataIdFormat;
};

const blockSchema = new Schema<BlockDocumentFieldsType>(
  {
    _id: {
      type: Number,
      required: true,
    },
    number: {
      type: Number,
      required: true,
    },
    hash: {
      type: String,
      required: true,
    },
    weekId: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  }
);

blockSchema.index({ number: 1 }, { unique: true });
blockSchema.pre('save', function (this: BlockDocumentFieldsType, next) {
  this._id = this.number;
  this.weekId = toWeekDataId(this.timestamp);
  next();
});

type BlockModel = Model<BlockDocumentFieldsType>;

export const modelName = 'Block' as const;

export function getBlockModel(mongooseConnection: Mongoose) {
  // Return cached model if it exists
  if (mongooseConnection.models[modelName]) {
    return mongooseConnection.models[modelName] as BlockModel;
  }

  return mongooseConnection.model(modelName, blockSchema) as BlockModel;
}

export function saveBlock(block: Omit<BlockDocumentFieldsType, 'weekId' | '_id'>, blockModel: BlockModel) {
  const weekId = toWeekDataId(block.timestamp);
  return blockModel.create({
    ...block,
    _id: block.number,
    weekId,
  });
}
