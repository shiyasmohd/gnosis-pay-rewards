import { Address, PublicClient, Transport, erc20Abi } from 'viem';

export async function getTokenBalanceOf({
  client,
  address,
  token,
  blockNumber,
}: {
  client: PublicClient<Transport>;
  address: Address;
  token: Address;
  blockNumber?: bigint;
}): Promise<bigint> {
  const tokenBalanceRaw = await client.readContract({
    abi: erc20Abi,
    address: token,
    functionName: 'balanceOf',
    args: [address],
    blockNumber,
  });

  return tokenBalanceRaw as bigint;
}
