import { gnosis } from 'viem/chains';
import { useChainId } from 'wagmi';

export function useIsNetworkSupported() {
  const chainId = useChainId();
  const isNetworkSupported = chainId && chainId === gnosis.id ? true : false;
  return {
    isNetworkSupported,
  };
}
