import { gnoToken } from '@karpatkey/gnosis-pay-rewards-sdk';
import { erc20TransferEventAbiItem, GnosisPayGetLogsParams } from './commons';

export async function getGnosisTokenTransferLogs({
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
      address: gnoToken.address,
      event: erc20TransferEventAbiItem,
      strict: true,
    });
    return logs;
  } catch (error) {
    if (verbose) {
      console.error(error);
    }
    if (retries > 0) {
      return getGnosisTokenTransferLogs({ client, fromBlock, toBlock, retries: retries - 1 });
    }

    throw error;
  }
}
