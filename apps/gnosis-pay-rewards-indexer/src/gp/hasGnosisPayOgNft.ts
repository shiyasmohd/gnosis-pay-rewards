import { Address, PublicClient, Transport, erc721Abi } from 'viem';
import { gnosis } from 'viem/chains';

import { getGnosisPaySafeOwners } from './getGnosisPaySafeOwners.js';

const OG_NFT_ADDRESS = '0x88997988a6A5aAF29BA973d298D276FE75fb69ab' as const;

export async function hasGnosisPayOgNft({
  client,
  gnosisPaySafeAddress,
}: {
  gnosisPaySafeAddress: Address;
  client: PublicClient<Transport, typeof gnosis>;
}) {
  const { data: owners, error } = await getGnosisPaySafeOwners({
    client,
    gnosisPaySafeAddress,
  });

  if (error) {
    throw error;
  }

  const mcResult = await client.multicall({
    allowFailure: false,
    contracts: owners.map((owner) => ({
      abi: erc721Abi,
      address: OG_NFT_ADDRESS,
      functionName: 'balanceOf',
      args: [owner],
    })),
  });

  return mcResult.some((result) => {
    if (typeof result === 'bigint' && result > 0n) {
      return true;
    }

    return false;
  });
}
