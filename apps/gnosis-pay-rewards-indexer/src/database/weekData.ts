import { WeekSnapshotDocumentFieldsType } from '@karpatkey/gnosis-pay-rewards-sdk';

import { Model, Mongoose, Schema } from 'mongoose';
import { dayjs } from '../lib/dayjs.js';
import { modelName as pendingRewardModelName } from './pendingReward.js';

export const weekDataSchema = new Schema<WeekSnapshotDocumentFieldsType>(
  {
    date: { type: String, required: true },
    totalUsdVolume: { type: Number, required: true },
    transactions: {
      type: [Schema.Types.String],
      ref: pendingRewardModelName,
      default: [],
    },
  },
  { timestamps: true }
).index({ date: 1 }, { unique: true });

const modelName = 'WeekData' as const;

export function getWeekDataModel(mongooseConnection: Mongoose) {
  // Return cached model if it exists
  if (mongooseConnection.models[modelName]) {
    return mongooseConnection.models[modelName] as Model<WeekSnapshotDocumentFieldsType>;
  }

  return mongooseConnection.model(modelName, weekDataSchema);
}

export async function getOrCreateWeekDataDocument({
  weekDataModel,
  unixTimestamp,
}: {
  unixTimestamp: number;
  weekDataModel: Model<WeekSnapshotDocumentFieldsType>;
}) {
  const weekStart = dayjs.unix(unixTimestamp).utc().startOf('week');
  const yyyyMMDD = weekStart.format('YYYY-MM-DD');

  const weekDataDocument = await weekDataModel.findOne({ date: yyyyMMDD });
  if (weekDataDocument !== null) {
    return weekDataDocument;
  }

  return weekDataModel.create({
    date: yyyyMMDD,
    totalUsdVolume: '0',
  });
}
