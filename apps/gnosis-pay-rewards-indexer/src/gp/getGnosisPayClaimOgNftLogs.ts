import { gnosisPayOgNftAddress } from '@karpatkey/gnosis-pay-rewards-sdk';
import { zeroAddress } from 'viem';

import { erc721TransferEventAbiItem, GnosisPayGetLogsParams } from './commons';

export async function getGnosisPayClaimOgNftLogs({
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
      event: erc721TransferEventAbiItem,
      args: {
        from: zeroAddress,
      },
      address: gnosisPayOgNftAddress,
      strict: true,
    });
    return logs;
  } catch (error) {
    if (verbose) {
      console.error(error);
    }
    if (retries > 0) {
      return getGnosisPayClaimOgNftLogs({ client, fromBlock, toBlock, retries: retries - 1 });
    }
    throw error;
  }
}
