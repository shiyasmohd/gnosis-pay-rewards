import { isAddress } from 'viem';
import { buildExpressApp } from './server.js';
import { getSpendTransactionModel } from './database/spendTransaction.js';

export function addHttpRoutes({
  expressApp,
  spendTransactionModel,
}: {
  expressApp: ReturnType<typeof buildExpressApp>;
  spendTransactionModel: ReturnType<typeof getSpendTransactionModel>;
}) {
  expressApp.get<'/health'>('/health', (_, res) => {
    return res.send({
      status: 'ok',
      statusCode: 200,
    });
  });

  expressApp.get<'/pending-rewards'>('/pending-rewards', async (_, res) => {
    const spendTransactions = await spendTransactionModel.find({});
    return res.json({
      data: spendTransactions.map((spendTransaction) => spendTransaction.toJSON()),
      status: 'ok',
      statusCode: 200,
    });
  });

  expressApp.get<'/pending-rewards/:id'>('/pending-rewards/:id', async (req, res) => {
    const spendTransaction = await spendTransactionModel.findById(req.params.id);

    if (spendTransaction === null) {
      return res.status(404).json({
        error: 'Pending reward not found',
        status: 'error',
        statusCode: 404,
      });
    }

    return res.json({
      data: spendTransaction.toJSON(),
      status: 'ok',
      statusCode: 200,
    });
  });

  expressApp.get<'/cashbacks/:address'>('/cashbacks/:address', async (req, res) => {
    const userAddress = req.params.address;

    if (!isAddress(userAddress)) {
      return res.status(4000).json({
        error: 'Invalid address',
        status: 'error',
        statusCode: 400,
      });
    }

    return res.json({
      data: {
        address: userAddress,
        cashbacks: [],
      },
      status: 'ok',
      statusCode: 200,
    });
  });

  return expressApp;
}
