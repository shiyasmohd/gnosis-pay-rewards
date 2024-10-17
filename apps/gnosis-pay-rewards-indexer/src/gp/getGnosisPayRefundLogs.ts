import { gnosisPaySpendAddress, moneriumEureToken,  moneriumGbpToken, usdcBridgeToken, circleUsdcToken } from '@karpatkey/gnosis-pay-rewards-sdk';

import { erc20TransferEventAbiItem, GnosisPayGetLogsParams } from './commons';

export async function getGnosisPayRefundLogs({
  client,
  fromBlock,
  toBlock,
  retries = 30,
  verbose = false,
}: GnosisPayGetLogsParams) {
  try {
    const logs = await client.getLogs({
      fromBlock,
      toBlock,
      event: erc20TransferEventAbiItem,
      args: {
        from: gnosisPaySpendAddress,
      },
      address: [moneriumEureToken,  moneriumGbpToken, usdcBridgeToken, circleUsdcToken, ].map((token) => token.address),
      strict: true,
    });
    return logs;
  } catch (error) {
    if (verbose) {
      console.error(error);
    }
    if (retries > 0) {
      return getGnosisPayRefundLogs({ client, fromBlock, toBlock, retries: retries - 1 });
    }

    throw error;
  }
}
