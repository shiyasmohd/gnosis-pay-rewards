import { getSpendTransactionModel } from './database/spendTransaction.js';
import { buildSocketIoServer } from './server.js';
import { getCurrentWeekDataDocument, getWeekDataModel, getOrCreateWeekDataDocument } from './database/weekData.js';

export function addSocketComms({
  socketIoServer,
  spendTransactionModel,
  weekDataModel,
}: {
  socketIoServer: ReturnType<typeof buildSocketIoServer>;
  spendTransactionModel: ReturnType<typeof getSpendTransactionModel>;
  weekDataModel: ReturnType<typeof getWeekDataModel>;
}) {
  // Emit the 10 recent pending rewards to the UI when a client connects
  socketIoServer.on('connection', async (socketClient) => {
    socketClient.on('disconnect', () => {
      console.log('Client disconnected');
    });

    socketClient.on('getRecentSpendTransactions', async (limit: number) => {
      const spendTransactions = await spendTransactionModel
        .find()
        .populate({
          path: 'spentToken',
          match: {
            _id: { $exists: true },
          },
        })
        .limit(limit)
        .sort({ blockNumber: -1 });
      socketClient.emit(
        'recentSpendTransactions',
        spendTransactions.map((s) => s.toJSON())
      );
    });

    socketClient.on('getCurrentWeekData', async () => {
      const weekData = await getCurrentWeekDataDocument({ weekDataModel });
      socketClient.emit('currentWeekData', weekData.toJSON());
    });

    socketClient.on('getWeekDataByTimestamp', async (weekTimestamp: number) => {
      const weekData = await getOrCreateWeekDataDocument({
        weekDataModel,
        unixTimestamp: weekTimestamp,
      });
      socketClient.emit('weekDataByTimestamp', weekData.toJSON());
    });

    socketClient.on('getAllWeekData', async () => {
      const allWeekData = await weekDataModel.find().sort({ timestamp: 1 });
      socketClient.emit(
        'allWeekData',
        allWeekData.map((w) => w.toJSON())
      );
    });
  });

  return socketIoServer;
}
