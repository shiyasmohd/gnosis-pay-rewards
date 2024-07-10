import { Response } from 'express';
import { isAddress } from 'viem';
import { buildExpressApp } from './server.js';
import { getSpendTransactionModel } from './database/spendTransaction.js';
import { getOrCreateWeekCashbackRewardDocument, getWeekCashbackRewardModel } from './database/weekCashbackReward.js';
import { dayjs } from './lib/dayjs.js';
import { toWeekDataId } from '@karpatkey/gnosis-pay-rewards-sdk';

export function addHttpRoutes({
  expressApp,
  spendTransactionModel,
  weekCashbackRewardModel,
}: {
  expressApp: ReturnType<typeof buildExpressApp>;
  spendTransactionModel: ReturnType<typeof getSpendTransactionModel>;
  weekCashbackRewardModel: ReturnType<typeof getWeekCashbackRewardModel>;
}) {
  expressApp.get<'/health'>('/health', (_, res) => {
    return res.send({
      status: 'ok',
      statusCode: 200,
    });
  });

  expressApp.get<'/pending-rewards'>('/pending-rewards', async (_, res) => {
    try {
      const spendTransactions = await spendTransactionModel.find({});
      return res.json({
        data: spendTransactions.map((spendTransaction) => spendTransaction.toJSON()),
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

      const currentWeekCashbacks = await getOrCreateWeekCashbackRewardDocument({
        address: safeAddress,
        week: toWeekDataId(dayjs().unix()),
        weekCashbackRewardModel,
      });

      return res.json({
        data: currentWeekCashbacks.toJSON(),
        status: 'ok',
        statusCode: 200,
      });
    } catch (error) {
      return returnInternalServerError(res, error as Error);
    }
  });

  expressApp.get<'/cashbacks/:safeAddress/:week'>('/cashbacks/:safeAddress/:week', async (req, res) => {
    try {
      const safeAddress = req.params.safeAddress;

      if (!isAddress(safeAddress)) {
        return res.status(4000).json({
          error: 'Invalid address',
          status: 'error',
          statusCode: 400,
        });
      }

      const week = req.params.week;

      const cashbacks = await weekCashbackRewardModel.findOne({
        address: new RegExp(safeAddress, 'i'),
        week,
      });

      if (cashbacks === null) {
        return res.status(404).json({
          error: 'No cashbacks found for this address and week',
          status: 'error',
          statusCode: 404,
        });
      }

      return res.json({
        data: cashbacks.toJSON(),
        status: 'ok',
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

      const transactions = await spendTransactionModel
        .find({
          safeAddress: new RegExp(safeAddress, 'i'),
        })
        .populate('spentToken')
        .sort({ blockTimestamp: -1 });

      return res.json({
        data: transactions.map((transaction) => transaction.toJSON()),
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
