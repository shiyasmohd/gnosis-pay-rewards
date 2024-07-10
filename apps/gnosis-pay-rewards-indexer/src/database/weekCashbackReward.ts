import { Address, isAddress } from 'viem';
import { Model, Mongoose, Schema } from 'mongoose';
import { weekDataIdFormat } from '@karpatkey/gnosis-pay-rewards-sdk';
import { dayjs } from '../lib/dayjs.js';

export type WeekCashbackRewardDocumentFieldsType = {
  _id: `${typeof weekDataIdFormat}/${Address}`; // e.g. 2024-03-01/0x123456789abcdef123456789abcdef123456789ab
  address: Address;
  week: typeof weekDataIdFormat;
  amount: number;
  /**
   * The raw GNO balance of the user at the end of the week
   */
  gnoBalanceRaw: string;
  /**
   * The lowest GNO balance of the user at the end of the week
   */
  gnoBalance: number;
  /**
   * The net USD volume of the user at the end of the week, refunds will reduce this number
   */
  netUsdVolume: number;
};

const weekCashbackRewardSchema = new Schema<WeekCashbackRewardDocumentFieldsType>({
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
    required: true
  },
  week: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true
  },
  netUsdVolume: {
    type: Number,
    required: true
  },
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


export function getWeekCashbackRewardModel(mongooseConnection: Mongoose) {
  // Return cached model if it exists
  if (mongooseConnection.models[modelName]) {
    return mongooseConnection.models[modelName] as Model<WeekCashbackRewardDocumentFieldsType>;
  }

  return mongooseConnection.model(modelName, weekCashbackRewardSchema);
}

export async function getOrCreateWeekCashbackRewardDocument({ week, address, weekCashbackRewardModel }: {
  address: Address;
  week: typeof weekDataIdFormat;
  weekCashbackRewardModel: Model<WeekCashbackRewardDocumentFieldsType>;
}) {
  address = address.toLowerCase() as Address;
  const documentId = toDocumentId(week, address);

  const weekCashbackRewardDocument = await weekCashbackRewardModel.findById(documentId);
  if (weekCashbackRewardDocument === null) {
    return new weekCashbackRewardModel({
      _id: documentId,
      address,
      week,
      amount: 0,
      netUsdVolume: 0
    });
  }
  return weekCashbackRewardDocument;
}