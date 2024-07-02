import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi';
import { useIsNetworkSupported } from './useIsNetworkSupported';

/**
 * An alias for wagmi hooks, similar to Uniswap useWeb3React
 */
export function useWeb3() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { address: account, isConnected } = useAccount();
  const { isNetworkSupported } = useIsNetworkSupported();

  return {
    isConnected,
    isNetworkSupported,
    chainId,
    account,
    address: account,
    publicClient,
    walletClient,
  };
}
