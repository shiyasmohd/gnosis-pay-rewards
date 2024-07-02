import { useIsNetworkSupported } from 'hooks/useIsNetworkSupported';
import { ReactNode } from 'react';
import { mainnet } from 'wagmi/chains';
import { useAccount, useSwitchChain } from 'wagmi';
import { useConnectWalletModal } from 'ui/modal';
import { PrimaryButton } from 'ui/components/Button';

/**
 * A HOC to render children if the user is connected to the wallet and the network is supported.
 * Otherwise, it renders a button to connect the wallet or switch the network.
 * @param
 * @returns
 */
export function RequireWalletButton({ children }: { children: ReactNode }) {
  const account = useAccount();
  const { openModal } = useConnectWalletModal();
  const { switchChainAsync } = useSwitchChain();
  const { isNetworkSupported } = useIsNetworkSupported();

  if (account.isConnected && !isNetworkSupported) {
    return (
      <PrimaryButton type="button" onClick={() => switchChainAsync?.({ chainId: mainnet.id })}>
        Switch Network
      </PrimaryButton>
    );
  }

  if (!account.isConnected) {
    return (
      <PrimaryButton type="button" onClick={() => openModal()} title="Connect Wallet">
        Connect Wallet
      </PrimaryButton>
    );
  }

  return <>{children}</>;
}
