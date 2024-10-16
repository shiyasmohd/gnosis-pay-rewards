import { gnosisPaySpendAddress } from '@karpatkey/gnosis-pay-rewards-sdk';
import { Address } from 'viem';

import { erc20TransferEventAbiItem, GnosisPayGetLogsParams } from './commons';

export async function getGnosisPayRefundLogs({
  client,
  fromBlock,
  toBlock,
  tokenAddresses,
  retries = 30,
  verbose = false,
}: GnosisPayGetLogsParams & {
  tokenAddresses: Address[];
}) {
  try {
    const logs = await client.getLogs({
      fromBlock,
      toBlock,
      event: erc20TransferEventAbiItem,
      args: {
        from: gnosisPaySpendAddress,
      },
      address: tokenAddresses,
      strict: true,
    });
    return logs;
  } catch (error) {
    if (verbose) {
      console.error(error);
    }
    if (retries > 0) {
      return getGnosisPayRefundLogs({ client, fromBlock, toBlock, tokenAddresses, retries: retries - 1 });
    }

    throw error;
  }
}
