import { Address, PublicClient, Transport } from 'viem';
import { gnosis } from 'viem/chains';

export async function getGnosisPaySafeAddressFromModule({
  rolesModuleAddress,
  client,
  blockNumber,
}: {
  rolesModuleAddress: Address;
  client: PublicClient<Transport, typeof gnosis>;
  blockNumber: bigint;
}) {
  const gnosisPaySafeAddress = (await client.readContract({
    abi: [
      {
        name: 'avatar',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'avatar',
    address: rolesModuleAddress,
    blockNumber,
  })) as Address;

  return gnosisPaySafeAddress;
}
