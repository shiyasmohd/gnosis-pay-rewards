import { gnosisPaySpendAddress, gnosisPaySpenderModuleAddress } from '@karpatkey/gnosis-pay-rewards-sdk';
import { GnosisPayGetLogsParams } from './commons.js';

export async function getGnosisPaySpendLogs({
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
      event: gnosisPaySpendEventAbiItem,
      args: {
        receiver: gnosisPaySpendAddress,
      },
      address: gnosisPaySpenderModuleAddress,
      strict: true,
    });
    return logs;
  } catch (error) {
    if (verbose) {
      console.error(error);
    }
    if (retries > 0) {
      return getGnosisPaySpendLogs({ client, fromBlock, toBlock, retries: retries - 1 });
    }

    throw error;
  }
}

export const gnosisPaySpendEventAbiItem = {
  name: 'Spend',
  type: 'event',
  inputs: [
    { indexed: false, internalType: 'address', name: 'asset', type: 'address' },
    { indexed: false, internalType: 'address', name: 'account', type: 'address' },
    { indexed: false, internalType: 'address', name: 'receiver', type: 'address' },
    { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
  ],
} as const;
