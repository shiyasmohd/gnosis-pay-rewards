import { ConditionalReturnType } from '@karpatkey/gnosis-pay-rewards-sdk';
import { PublicClient, Transport } from 'viem';
import { gnosis } from 'viem/chains';

import { Address } from 'viem';

const sentientAddress = '0x0000000000000000000000000000000000000001' as const;

/**
 * Get the owners of the Gnosis Pay Safe
 */
export async function getGnosisPaySafeOwners({
  client,
  safeAddress,
  blockNumber,
}: {
  safeAddress: Address;
  /**
   * The public client to use
   */
  client: PublicClient<Transport, typeof gnosis>;
  blockNumber?: bigint;
}): Promise<ConditionalReturnType<true, Address[], Error> | ConditionalReturnType<false, Address[], Error>> {
  try {
    // The first module is the Delay module
    const modules = await getGnosisPaySafeModules({
      client,
      safeAddress,
      blockNumber,
    });

    const [delayModuleAddress] = modules;

    // The list of owners are stored in the Delay module
    const [owners] = await client.readContract({
      address: delayModuleAddress,
      abi,
      functionName: 'getModulesPaginated',
      args: [sentientAddress, 100n],
    });

    return {
      data: owners as Address[],
      error: null,
    };
  } catch (e) {
    return {
      data: null,
      error: e as Error,
    };
  }
}

export async function getGnosisPaySafeModules({
  client,
  safeAddress,
  blockNumber,
}: {
  safeAddress: Address;
  client: PublicClient<Transport, typeof gnosis>;
  blockNumber?: bigint;
}) {
  // Find the Delay
  const [modules] = await client.readContract({
    address: safeAddress,
    abi,
    functionName: 'getModulesPaginated',
    args: [sentientAddress, 100n],
    blockNumber,
  });

  return modules as Address[];
}

const abi = [
  {
    inputs: [
      { internalType: 'address', name: 'start', type: 'address' },
      { internalType: 'uint256', name: 'pageSize', type: 'uint256' },
    ],
    name: 'getModulesPaginated',
    outputs: [
      { internalType: 'address[]', name: 'array', type: 'address[]' },
      { internalType: 'address', name: 'next', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
