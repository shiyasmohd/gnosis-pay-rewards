import { GnosisPayTransactionFieldsType_Unpopulated, toWeekDataId } from '@karpatkey/gnosis-pay-rewards-sdk';
import {
  createMongooseLogger,
  getGnosisPayTransactionModel,
  getWeekCashbackRewardModel,
  createWeekCashbackRewardDocumentId,
  createWeekCashbackRewardDocument,
  createGnosisPayRewardDistributionModel,
  GnosisPayRewardDistributionDocumentFieldsType,
} from '@karpatkey/gnosis-pay-rewards-sdk/mongoose';
import { Response } from 'express';
import dayjs from 'dayjs';
import dayjsUtc from 'dayjs/plugin/utc.js';
import { isAddress } from 'viem';
import { z, ZodError } from 'zod';

import { buildExpressApp } from './server.js';
import { IndexerStateAtomType } from './state.js';

dayjs.extend(dayjsUtc);

export function addHttpRoutes({
  expressApp,
  mongooseModels,
  getIndexerState,
}: {
  expressApp: ReturnType<typeof buildExpressApp>;
  mongooseModels: {
    gnosisPayTransactionModel: ReturnType<typeof getGnosisPayTransactionModel>;
    weekCashbackRewardModel: ReturnType<typeof getWeekCashbackRewardModel>;
    gnosisPayRewardDistributionModel: ReturnType<typeof createGnosisPayRewardDistributionModel>;
  };
  logger: ReturnType<typeof createMongooseLogger>;
  getIndexerState: () => IndexerStateAtomType;
}) {
  const { gnosisPayTransactionModel, weekCashbackRewardModel, gnosisPayRewardDistributionModel } = mongooseModels;

  expressApp.get<'/'>('/', (_, res) => {
    return res.send({
      status: 'ok',
      statusCode: 200,
    });
  });

  expressApp.get<'/status'>('/status', (_, res) => {
    const state = getIndexerState();
    const indexerState = Object.fromEntries(
      Object.entries(state).map(([key, value]) => [key, typeof value === 'bigint' ? Number(value) : value])
    );

    return res.send({
      data: {
        indexerState,
      },
      status: 'ok',
      statusCode: 200,
    });
  });

  expressApp.get<'/health'>('/health', (_, res) => {
    return res.send({
      status: 'ok',
      statusCode: 200,
    });
  });

  expressApp.get<'/cashbacks/:safeAddress'>('/cashbacks/:safeAddress', async (req, res) => {
    try {
      const safeAddress = addressSchema.parse(req.params.safeAddress);

      const week = toWeekDataId(dayjs.utc().unix());
      const weekCashbackRewardDocument = await createWeekCashbackRewardDocument({
        address: safeAddress,
        populateTransactions: true,
        weekCashbackRewardModel,
        week,
      });

      const weekCashbackRewardJson = weekCashbackRewardDocument.toJSON();

      return res.json({
        data: weekCashbackRewardJson,
        status: 'ok',
        statusCode: 200,
        _query: {
          address: safeAddress,
        },
      });
    } catch (error) {
      return returnServerError(res, error as Error);
    }
  });

  expressApp.get<'/cashbacks/:safeAddress/:week'>('/cashbacks/:safeAddress/:week', async (req, res) => {
    try {
      const safeAddress = addressSchema.parse(req.params.safeAddress);
      const week = req.params.week as ReturnType<typeof toWeekDataId>;
      const documentId = createWeekCashbackRewardDocumentId(week, safeAddress);

      const weekCashbackRewardSnapshot = await weekCashbackRewardModel
        .findById(documentId)
        .populate<{ transactions: GnosisPayTransactionFieldsType_Unpopulated[] }>('transactions')
        .lean();

      if (weekCashbackRewardSnapshot === null) {
        return res.status(404).json({
          error: 'No cashbacks found for this address  and week',
          _query: {
            id: documentId,
            address: safeAddress,
            week,
          },
          status: 'error',
          statusCode: 404,
        });
      }

      return res.json({
        data: weekCashbackRewardSnapshot,
        status: 'ok',
        _query: {
          id: documentId,
          address: safeAddress,
          week,
        },
        statusCode: 200,
      });
    } catch (error) {
      return returnServerError(res, error as Error);
    }
  });

  expressApp.get<'/distributions/:safeAddress'>('/distributions/:safeAddress', async (req, res) => {
    try {
      const safe = addressSchema.parse(req.params.safeAddress).toLowerCase();

      const transactions = await gnosisPayRewardDistributionModel
        .find<GnosisPayRewardDistributionDocumentFieldsType>({
          safe,
        })
        .sort({ blockNumber: -1 })
        .lean();

      const totalRewards = transactions.reduce((acc, dist) => dist.amount + acc, 0);

      return res.json({
        data: {
          safe,
          totalRewards,
          transactions,
        },
        status: 'ok',
        statusCode: 200,
        _query: {
          safe,
        },
      });
    } catch (error) {
      return returnServerError(res, error as Error);
    }
  });

  expressApp.get<'/transactions/:safeAddress'>('/transactions/:safeAddress', async (req, res) => {
    try {
      const safeAddress = addressSchema.parse(req.params.safeAddress);

      const transactions = await gnosisPayTransactionModel
        .find({
          safeAddress: new RegExp(safeAddress, 'i'),
        })
        .populate('amountToken')
        .sort({ blockTimestamp: -1 })
        .lean();

      return res.json({
        data: transactions,
        status: 'ok',
        statusCode: 200,
      });
    } catch (error) {
      return returnServerError(res, error as Error);
    }
  });

  return expressApp;
}

/**
 * @param res Express response object
 * @param error Error object
 * @returns Express response object
 */
function returnServerError(res: Response, error?: Error) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: error.message,
      status: 'error',
      statusCode: 400,
    });
  }

  return res.status(500).json({
    error: 'Internal server error',
    status: 'error',
    errorStack: error?.stack,
    statusCode: 500,
  });
}

const addressSchema = z.string().refine(isAddress, {
  message: 'Invalid EVM address',
});
