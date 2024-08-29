/* eslint-disable @typescript-eslint/no-explicit-any */
import { Address, isAddress } from 'viem';
import { ClientSession, HydratedDocument, Model, Mongoose, Schema } from 'mongoose';
import {
  WeekCashbackRewardDocumentFieldsType_Populated,
  WeekCashbackRewardDocumentFieldsType_Unpopulated,
} from '../database/weekReward';
import { WeekIdFormatType, weekIdFormat } from '../database/weekData';
import { GnosisPayTransactionFieldsType_Unpopulated } from '../database/spendTransaction';
import { dayjsUtc } from './dayjsUtc';
import { gnosisTokenBalanceSnapshotModelName } from './gnosisTokenBalanceSnapshot';

const weekCashbackRewardSchema = new Schema<WeekCashbackRewardDocumentFieldsType_Unpopulated>(
  {
    _id: {
      type: String,
      required: true,
      validate(value: string) {
        const [isoWeek, address] = value.split('/');

        return isoWeek.match(/^\d{4}-\d{2}-\d{2}$/) !== null && isAddress(address);
      },
    },
    address: {
      type: String,
      required: true,
    },
    week: {
      type: String,
      required: true,
    },
    netUsdVolume: {
      type: Number,
      required: true,
    },
    maxGnoBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    minGnoBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    estimatedReward: {
      type: Number,
      required: true,
      default: 0,
    },
    transactions: [
      {
        type: String,
        ref: 'GnosisPayTransaction',
      },
    ],
    gnoBalanceSnapshots: [
      {
        type: String,
        ref: gnosisTokenBalanceSnapshotModelName,
      },
    ],
  },
  { timestamps: true }
);

const modelName = 'WeekCashbackReward' as const;

/**
 * Create a document id for the week cashback reward in the format of week/address
 * @param week - e.g. 2024-03-01
 * @param address - e.g. 0x123456789abcdef123456789abcdef123456789ab
 * @returns `2024-03-01/0x123456789abcdef123456789abcdef123456789ab`
 *
 * @example
 * const docId = createWeekCashbackRewardDocumentId('2024-03-01', '0x123456789abcdef123456789abcdef123456789ab')
 * // '2024-03-01/0x123456789abcdef123456789abcdef123456789ab'
 */
export function createWeekCashbackRewardDocumentId(week: typeof weekIdFormat, address: Address): `${WeekIdFormatType}/${Address}` {
  return `${week}/${address.toLowerCase() as Address}`;
}

/**
 * Get the current week id
 * @returns e.g. 2024-03-01
 */
export function getCurrentWeekId() {
  const now = dayjsUtc.utc();
  const isoWeek = now.format(weekIdFormat);
  return isoWeek;
}

export type WeekCashbackRewardModelType = Model<WeekCashbackRewardDocumentFieldsType_Unpopulated>;

export function getWeekCashbackRewardModel(mongooseConnection: Mongoose): WeekCashbackRewardModelType {
  // Return cached model if it exists
  if (mongooseConnection.models[modelName]) {
    return mongooseConnection.models[modelName] as WeekCashbackRewardModelType;
  }

  return mongooseConnection.model(modelName, weekCashbackRewardSchema) as WeekCashbackRewardModelType;
}

export async function createWeekCashbackRewardDocument<Populated extends boolean = false>(
  {
    address,
    weekCashbackRewardModel,
    week,
    populateTransactions = false as Populated,
  }: {
    populateTransactions?: Populated;
    address: Address;
    week: WeekIdFormatType;
    weekCashbackRewardModel: Model<WeekCashbackRewardDocumentFieldsType_Unpopulated>;
  },
  session?: ClientSession
): Promise<
  Populated extends true
    ? HydratedDocument<WeekCashbackRewardDocumentFieldsType_Populated>
    : HydratedDocument<WeekCashbackRewardDocumentFieldsType_Unpopulated>
> {
  address = address.toLowerCase() as Address;
  const documentId = createWeekCashbackRewardDocumentId(week, address);

  const query = weekCashbackRewardModel.findById(documentId, {}, { session });

  if (populateTransactions) {
    query.populate<{ transactions: GnosisPayTransactionFieldsType_Unpopulated[] }>('transactions');
  }

  const weekCashbackRewardDocument = await query.exec();

  if (weekCashbackRewardDocument === null) {
    const newDoc = await new weekCashbackRewardModel({
      _id: documentId,
      address,
      week,
      amount: 0,
      netUsdVolume: 0,
      transactions: [],
      gnoBalanceSnapshots: [],
    }).save({ session });

    return newDoc as any;
  }

  return weekCashbackRewardDocument as any;
}
