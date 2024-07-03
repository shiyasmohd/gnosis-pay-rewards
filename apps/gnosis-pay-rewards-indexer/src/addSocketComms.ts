import { getPendingRewardModel } from './database/pendingReward.js';
import { buildSocketIoServer } from './server.js';

export function addSocketComms({
  socketIoServer,
  pendingRewardModel,
}: {
  socketIoServer: ReturnType<typeof buildSocketIoServer>;
  pendingRewardModel: ReturnType<typeof getPendingRewardModel>;
}) {
  // Emit the 10 recent pending rewards to the UI when a client connects
  socketIoServer.on('connection', async (socketClient) => {
    socketClient.on('disconnect', () => {
      console.log('Client disconnected');
    });

    socketClient.on('getRecentPendingRewards', async (limit: number) => {
      const pendingRewards = await pendingRewardModel
        .find()
        .populate({
          path: 'spentToken',
          populate: {
            path: 'token',
          },
          match: {
            _id: { $exists: true },
          },
        })
        .limit(limit)
        .sort({ blockNumber: -1 });
      socketClient.emit(
        'recentPendingRewards',
        pendingRewards.map((r) => r.toJSON())
      );
    });
  });

  return socketIoServer;
}
