import {
  GnosisPayTransactionFieldsType_Unpopulated,
  GnosisPayTransactionFieldsType_Populated,
  toWeekDataId,
} from '@karpatkey/gnosis-pay-rewards-sdk';
import {
  createMongooseLogger,
  getGnosisPayTransactionModel,
  getWeekCashbackRewardModel,
  toDocumentId,
} from '@karpatkey/gnosis-pay-rewards-sdk/mongoose';
import { Response } from 'express';
import { isAddress } from 'viem';
import { buildExpressApp } from './server.js';

export function addHttpRoutes({
  expressApp,
  gnosisPayTransactionModel,
  weekCashbackRewardModel,
}: {
  expressApp: ReturnType<typeof buildExpressApp>;
  gnosisPayTransactionModel: ReturnType<typeof getGnosisPayTransactionModel>;
  weekCashbackRewardModel: ReturnType<typeof getWeekCashbackRewardModel>;
  logger: ReturnType<typeof createMongooseLogger>;
}) {
  expressApp.get<'/status'>('/status', (_, res) => {
    return res.send({
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

  expressApp.get<'/pending-rewards'>('/pending-rewards', async (_, res) => {
    try {
      const spendTransactions = await gnosisPayTransactionModel.find({}).lean();
      return res.json({
        data: spendTransactions,
        status: 'ok',
        statusCode: 200,
      });
    } catch (error) {
      return returnInternalServerError(res, error as Error);
    }
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

      const allCashbacks = await weekCashbackRewardModel
        .find({
          address: new RegExp(safeAddress, 'i'),
        })
        .populate<{
          transactions: GnosisPayTransactionFieldsType_Populated;
        }>({
          path: 'transactions',
          select: {
            _id: 0,
            blockNumber: 1,
            blockTimestamp: 1,
            transactionHash: 1,
            spentAmount: 1,
            spentAmountUsd: 1,
            gnoBalance: 1,
          },
          populate: {
            path: 'amountToken',
            select: {
              symbol: 1,
              decimals: 1,
              name: 1,
            },
            transform: (doc, id) => ({
              ...doc,
              address: id,
            }),
          },
        })
        .lean();

      return res.json({
        data: allCashbacks,
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
