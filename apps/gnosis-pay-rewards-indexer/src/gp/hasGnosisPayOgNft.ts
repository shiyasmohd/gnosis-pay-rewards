import { Address, PublicClient, Transport, erc721Abi } from 'viem';
import { gnosis } from 'viem/chains';

const OG_NFT_ADDRESS = '0x88997988a6A5aAF29BA973d298D276FE75fb69ab' as const;

export async function hasGnosisPayOgNft(
  client: PublicClient<Transport, typeof gnosis>,
  userAddressArray: Address[],
): Promise<boolean[]> {
  const mcResult = await client.multicall({
    allowFailure: false,
    contracts: userAddressArray.map((address) => ({
      abi: erc721Abi,
      address: OG_NFT_ADDRESS,
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
