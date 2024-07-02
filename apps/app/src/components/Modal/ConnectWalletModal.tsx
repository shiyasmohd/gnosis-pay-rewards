import { styled } from 'styled-components';
import { useConnect } from 'wagmi';
import { useConnectWalletModal } from 'ui/modal';
import { PrimaryButton } from '../../ui/components/Button/Button';
import { Loader } from 'components/Loader';
import { SlideUpModal } from './SlideUpModal';
import { mainnet } from 'viem/chains';

export function ConnectWalletModal() {
  const { closeModal, isOpen } = useConnectWalletModal();
  const { connectors, isLoading, pendingConnector, connectAsync } = useConnect();

  return (
    <SlideUpModal
      isOpen={isOpen}
      closeModal={closeModal}
      title="Connect"
      closeModalOnBackdropClick={true}
      contentPadding="0 24px 24px 24px!important"
      content={
        <WalletButtonWrapper>
          {connectors.map((connector) => (
            <PrimaryButton
              type="button"
              disabled={!connector.ready}
              key={connector.id}
              onClick={async () => {
                await connectAsync({
                  connector,
                  chainId: mainnet.id,
                });
                closeModal();
              }}
            >
              <WalletButtonInnerLayout>
                {connector.name}
                {!connector.ready && ' (unsupported)'}
                {isLoading && connector.id === pendingConnector?.id && <Loader size="20px" />}
              </WalletButtonInnerLayout>
            </PrimaryButton>
          ))}
        </WalletButtonWrapper>
      }
    />
  );
}

const WalletButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const WalletButtonInnerLayout = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;
