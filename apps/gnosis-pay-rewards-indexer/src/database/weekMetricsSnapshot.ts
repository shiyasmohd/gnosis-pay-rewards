import { WeekIdType, WeekSnapshotDocumentFieldsType, toWeekDataId } from '@karpatkey/gnosis-pay-rewards-sdk';

import { ClientSession, Model, Mongoose, Schema } from 'mongoose';
import { dayjs } from '../lib/dayjs.js';
import { modelName as gnosisPayTransactionModelName } from './gnosisPayTransaction.js';

export const weekDataSchema = new Schema<WeekSnapshotDocumentFieldsType>(
  {
    date: { type: String, required: true },
    netUsdVolume: { type: Number, required: true, default: 0 },
    transactions: {
      type: [Schema.Types.String],
      ref: gnosisPayTransactionModelName,
      default: [],
    },
  },
  { timestamps: true }
).index({ date: 1 }, { unique: true });

export const modelName = 'WeekMetricsSnapshot' as const;

export function getWeekMetricsSnapshotModel(mongooseConnection: Mongoose) {
  // Return cached model if it exists
  if (mongooseConnection.models[modelName]) {
    return mongooseConnection.models[modelName] as Model<WeekSnapshotDocumentFieldsType>;
  }

  return mongooseConnection.model(modelName, weekDataSchema);
}

type GetOrCreateWeekMetricsSnapshotDocumentParams =
  | { unixTimestamp: number; weekId?: never; weekMetricsSnapshotModel: Model<WeekSnapshotDocumentFieldsType> }
  | { unixTimestamp?: never; weekId: WeekIdType; weekMetricsSnapshotModel: Model<WeekSnapshotDocumentFieldsType> };

export async function createWeekMetricsSnapshotDocument(
  { weekMetricsSnapshotModel, unixTimestamp, weekId }: GetOrCreateWeekMetricsSnapshotDocumentParams,
  mongooseSession?: ClientSession
) {
  if ((unixTimestamp && weekId) || (!unixTimestamp && !weekId)) {
    throw new Error('Either unixTimestamp or weekId must be provided, but not both.');
  }

  const yyyyMMDD = weekId ?? toWeekDataId(unixTimestamp!);

  const weekMetricsSnapshotDocument = await weekMetricsSnapshotModel.findOne(
    { date: yyyyMMDD },
    {},
    { session: mongooseSession }
  );

  if (weekMetricsSnapshotDocument !== null) {
    return weekMetricsSnapshotDocument;
  }

  return new weekMetricsSnapshotModel<WeekSnapshotDocumentFieldsType>({
    date: yyyyMMDD,
    netUsdVolume: 0,
    transactions: [],
  }).save({ session: mongooseSession });
}

export async function getCurrentWeekMetricsSnapshotDocument(
  weekMetricsSnapshotModel: Model<WeekSnapshotDocumentFieldsType>
) {
  return createWeekMetricsSnapshotDocument({
    weekMetricsSnapshotModel,
    unixTimestamp: dayjs.utc().unix(),
  });
}
