import { gnosisPayOgNftAddress } from '@karpatkey/gnosis-pay-rewards-sdk';
import { Address, PublicClient, Transport, erc721Abi } from 'viem';
import { gnosis } from 'viem/chains';

export async function hasGnosisPayOgNft(
  client: PublicClient<Transport, typeof gnosis>,
  userAddressArray: Address[],
): Promise<boolean[]> {
  const mcResult = await client.multicall({
    allowFailure: false,
    contracts: userAddressArray.map((address) => ({
      abi: erc721Abi,
      address: gnosisPayOgNftAddress,
      functionName: 'balanceOf',
      args: [address],
    })),
  });

  const returnValue = mcResult.map((result) => {
    if (typeof result === 'bigint' && result > 0n) {
      return true;
    }

    return false;
  });

  return returnValue;
}
