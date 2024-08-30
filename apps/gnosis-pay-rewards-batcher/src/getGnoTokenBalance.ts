import { gnoTokenAddress } from '@karpatkey/gnosis-pay-rewards-sdk';
import { Address, PublicClient, Transport, erc20Abi } from 'viem';
import { gnosis } from 'viem/chains';

export function getGnoTokenBalance({
  client,
  address,
  blockNumber,
}: {
  client: PublicClient<Transport, typeof gnosis>;
  address: Address;
  blockNumber: bigint;
}) {
  return client.readContract({
    abi: erc20Abi,
    address: gnoTokenAddress,
    functionName: 'balanceOf',
    args: [address],
    blockNumber,
  });
}
