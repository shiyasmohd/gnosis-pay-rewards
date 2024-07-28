import { ClientSession, Model, Mongoose, Schema } from 'mongoose';
import { gnosisPayTransactionModelName } from './gnosisPayTransaction.js';
import { dayjsUtc } from './dayjsUtc.js';
import { WeekIdFormatType, WeekSnapshotDocumentFieldsType, toWeekDataId } from '../database/weekData.js';
import { mongooseSchemaAddressField } from './sharedSchemaFields.js';

export const weekDataSchema = new Schema<WeekSnapshotDocumentFieldsType>(
  {
    date: { type: String, required: true },
    netUsdVolume: { type: Number, required: true, default: 0 },
    transactions: [
      {
        ...mongooseSchemaAddressField,
        ref: gnosisPayTransactionModelName,
      },
    ],
  },
  { timestamps: true }
  // @ts-ignore
).index({ date: 1 }, { unique: true });

export const weekMetricsSnapshotModelName = 'WeekMetricsSnapshot' as const;

export function getWeekMetricsSnapshotModel(mongooseConnection: Mongoose) {
  // Return cached model if it exists
  if (mongooseConnection.models[weekMetricsSnapshotModelName]) {
    return mongooseConnection.models[weekMetricsSnapshotModelName] as Model<WeekSnapshotDocumentFieldsType>;
  }

  return mongooseConnection.model(weekMetricsSnapshotModelName, weekDataSchema);
}

type GetOrCreateWeekMetricsSnapshotDocumentParams =
  | { unixTimestamp: number; weekId?: never; weekMetricsSnapshotModel: Model<WeekSnapshotDocumentFieldsType> }
  | {
      unixTimestamp?: never;
      weekId: WeekIdFormatType;
      weekMetricsSnapshotModel: Model<WeekSnapshotDocumentFieldsType>;
    };

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
    unixTimestamp: dayjsUtc.utc().unix(),
  });
}
