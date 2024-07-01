import { buildExpressApp } from './server.js';
import { getPendingRewardModel } from './database/pendingReward.js';

export function addHttpRoutes({
  expressApp,
  pendingRewardModel,
}: {
  expressApp: ReturnType<typeof buildExpressApp>;
  pendingRewardModel: ReturnType<typeof getPendingRewardModel>;
}) {
  expressApp.get<'/health'>('/health', (_, res) => {
    return res.send({
      status: 'ok',
      statusCode: 200,
    });
  });

  expressApp.get<'/pending-rewards'>('/pending-rewards', async (_, res) => {
    const pendingRewards = await pendingRewardModel.find({});
    return res.json({
      data: pendingRewards.map((pendingReward) => pendingReward.toJSON()),
      status: 'ok',
      statusCode: 200,
    });
  });

  expressApp.get<'/pending-rewards/:id'>('/pending-rewards/:id', async (req, res) => {
    const pendingReward = await pendingRewardModel.findById(req.params.id);

    if (pendingReward === null) {
      return res.status(404).json({
        error: 'Pending reward not found',
        status: 'error',
        statusCode: 404,
      });
    }

    return res.json({
      data: pendingReward.toJSON(),
      status: 'ok',
      statusCode: 200,
    });
  });

  return expressApp;
}
