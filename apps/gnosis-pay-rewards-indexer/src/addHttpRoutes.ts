import { GnosisPayTransactionFieldsType_Unpopulated, toWeekDataId } from '@karpatkey/gnosis-pay-rewards-sdk';
import {
  createMongooseLogger,
  getGnosisPayTransactionModel,
  getWeekCashbackRewardModel,
  toDocumentId,
  createWeekCashbackRewardDocument,
} from '@karpatkey/gnosis-pay-rewards-sdk/mongoose';
import { Response } from 'express';
import { isAddress } from 'viem';
import { buildExpressApp } from './server.js';
import dayjs from 'dayjs';
import dayjsUtc from 'dayjs/plugin/utc.js';
import { IndexerStateAtomType } from './state.js';

dayjs.extend(dayjsUtc);

export function addHttpRoutes({
  expressApp,
  gnosisPayTransactionModel,
  weekCashbackRewardModel,
  getIndexerState,
}: {
  expressApp: ReturnType<typeof buildExpressApp>;
  gnosisPayTransactionModel: ReturnType<typeof getGnosisPayTransactionModel>;
  weekCashbackRewardModel: ReturnType<typeof getWeekCashbackRewardModel>;
  logger: ReturnType<typeof createMongooseLogger>;
  getIndexerState: () => IndexerStateAtomType;
}) {
  expressApp.get<'/'>('/', (_, res) => {
    return res.send({
      status: 'ok',
      statusCode: 200,
    });
  });

  expressApp.get<'/status'>('/status', (_, res) => {
    const state = getIndexerState();

    return res.send({
      data: {
        indexerState: Object.fromEntries(
          Object.entries(state).map(([key, value]) => [key, typeof value === 'bigint' ? Number(value) : value])
        ),
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
      const safeAddress = req.params.safeAddress;

      if (!isAddress(safeAddress)) {
        return res.status(4000).json({
          error: 'Invalid address',
          status: 'error',
          statusCode: 400,
        });
      }

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
      return returnInternalServerError(res, error as Error);
    }
  });

  expressApp.get<'/cashbacks/:safeAddress/:week'>('/cashbacks/:safeAddress/:week', async (req, res) => {
    try {
      const safeAddress = req.params.safeAddress;
      const week = req.params.week as ReturnType<typeof toWeekDataId>;

      if (!isAddress(safeAddress)) {
        return res.status(4000).json({
          error: 'Invalid address',
          status: 'error',
          statusCode: 400,
        });
      }

      const documentId = toDocumentId(week, safeAddress);

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
      return returnInternalServerError(res, error as Error);
    }
  });

  expressApp.get<'/transactions/:safeAddress'>('/transactions/:safeAddress', async (req, res) => {
    try {
      const safeAddress = req.params.safeAddress;

      if (!isAddress(safeAddress)) {
        return res.status(4000).json({
          error: 'Invalid address',
          status: 'error',
          statusCode: 400,
        });
      }

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
      return returnInternalServerError(res, error as Error);
    }
  });

  return expressApp;
}

/**
 * @param res Express response object
 * @param error Error object
 * @returns Express response object
 */
function returnInternalServerError(res: Response, error?: Error) {
  return res.status(500).json({
    error: 'Internal server error',
    status: 'error',
    errorStack: error?.stack,
    statusCode: 500,
  });
}
