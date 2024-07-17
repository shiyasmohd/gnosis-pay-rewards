/* eslint-disable @typescript-eslint/no-explicit-any */
import { Address, isAddress } from 'viem';
import {  HydratedDocument, Model, Mongoose, Schema } from 'mongoose';
import { weekDataIdFormat, GnosisPayTransactionFieldsType_Unpopulated } from '@karpatkey/gnosis-pay-rewards-sdk';
import { modelName as transactionModelName  } from './gnosisPayTransaction.js';
import { dayjs } from '../lib/dayjs.js';

export type WeekCashbackRewardDocumentFieldsTypeBase<TransactionsFieldType> = {
  _id: `${typeof weekDataIdFormat}/${Address}`; // e.g. 2024-03-01/0x123456789abcdef123456789abcdef123456789ab
  address: Address;
  week: typeof weekDataIdFormat;
  /**
   * The estimated reward for the week
   */
  estimatedReward: number;
  /**
   * The highest GNO balance of the user at the end of the week
   */
  maxGnoBalance: number;
  /**
   * The lowest GNO balance of the user at the end of the week
   */
  minGnoBalance: number;
  /**
   * The net USD volume of the user at the end of the week, refunds will reduce this number
   */
  netUsdVolume: number;
  /**
   * The transactions that were used to calculate the cashback reward
   */
  transactions: TransactionsFieldType[];
};

export type WeekCashbackRewardDocumentFieldsType_Unpopulated = WeekCashbackRewardDocumentFieldsTypeBase<string>;
export type WeekCashbackRewardDocumentFieldsType_Populated =
  WeekCashbackRewardDocumentFieldsTypeBase<GnosisPayTransactionFieldsType_Unpopulated>;

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
    transactions: [{
      type: String,
      ref: transactionModelName,
    }],
  },
  { timestamps: true },
);

export const modelName = 'WeekCashbackReward' as const;

/**
 * @param week - e.g. 2024-03-01
 * @param address - e.g. 0x123456789abcdef123456789abcdef123456789ab
 * @returns
 */
export function toDocumentId(week: typeof weekDataIdFormat, address: Address) {
  return `${week}/${address.toLowerCase()}`;
}

/**
 * Get the current week id
 * @returns e.g. 2024-03-01
 */
export function getCurrentWeekId() {
  const now = dayjs.utc();
  const isoWeek = now.format(weekDataIdFormat);
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

export async function getOrCreateWeekCashbackRewardDocument<Populated extends boolean = false>({
  address,
  weekCashbackRewardModel,
  week,
  populateTransactions = false as Populated,
}: {
  populateTransactions?: Populated;
  address: Address;
  week: typeof weekDataIdFormat;
  weekCashbackRewardModel: Model<WeekCashbackRewardDocumentFieldsType_Unpopulated>;
}): Promise<Populated extends true ? HydratedDocument<WeekCashbackRewardDocumentFieldsType_Populated> : HydratedDocument<WeekCashbackRewardDocumentFieldsType_Unpopulated>> {
  address = address.toLowerCase() as Address;
  const documentId = toDocumentId(week, address);

  const query = weekCashbackRewardModel.findById(documentId);

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
    }).save();

    return newDoc as any;
  }

  return weekCashbackRewardDocument as any;
}
