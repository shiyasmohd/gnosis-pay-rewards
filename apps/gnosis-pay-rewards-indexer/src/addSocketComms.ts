import { getGnosisPayTransactionModel } from './database/gnosisPayTransaction.js';
import { buildSocketIoServer } from './server.js';
import { getCurrentWeekDataDocument, getWeekDataModel, getOrCreateWeekDataDocument } from './database/weekData.js';
import { GnosisPayTransactionFieldsType_Populated } from '@karpatkey/gnosis-pay-rewards-sdk';

export function addSocketComms({
  socketIoServer,
  gnosisPayTransactionModel,
  weekDataModel,
}: {
  socketIoServer: ReturnType<typeof buildSocketIoServer>;
  gnosisPayTransactionModel: ReturnType<typeof getGnosisPayTransactionModel>;
  weekDataModel: ReturnType<typeof getWeekDataModel>;
}) {
  // Emit the 10 recent pending rewards to the UI when a client connects
  socketIoServer.on('connection', async (socketClient) => {
    socketClient.on('disconnect', () => {
      console.log('Client disconnected');
    });

    socketClient.on('getRecentTransactions', async (limit: number) => {
      const spendTransactions = ((await gnosisPayTransactionModel
        .find()
        .populate({
          path: 'amountToken',
        })
        .limit(limit)
        .sort({ blockNumber: -1 })
        .lean()) as unknown) as GnosisPayTransactionFieldsType_Populated[];
      socketClient.emit('recentTransactions', spendTransactions);
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
