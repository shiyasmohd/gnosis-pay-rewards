import { gnoToken, gnosisPayRewardDistributionSafeAddress } from '@karpatkey/gnosis-pay-rewards-sdk';
import { erc20Abi } from 'viem';
import { GnosisPayGetLogsParams } from './commons.js';

export async function getGnosisPayRewardDistributionLogs({
  client,
  fromBlock,
  toBlock,
  retries = 30,
  verbose = false,
}: GnosisPayGetLogsParams) {
  try {
    const logs = await client.getLogs({
      address: gnoToken.address,
      args: {
        from: gnosisPayRewardDistributionSafeAddress,
      },
      event: erc20Abi[1],
      fromBlock,
      toBlock,
      strict: true,
    });
    return logs;
  } catch (error) {
    if (verbose) {
      console.error(error);
    }
    if (retries > 0) {
      return getGnosisPayRewardDistributionLogs({ client, fromBlock, toBlock, retries: retries - 1 });
    }

    throw error;
  }
}
