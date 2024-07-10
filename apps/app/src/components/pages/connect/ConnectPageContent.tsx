'use client';
import { useRouter } from 'next/navigation';
import { styled } from 'styled-components';
import { useMemo } from 'react';
import { Connector, ConnectorAlreadyConnectedError, useAccount, useConnect } from 'wagmi';
import { mainnet } from 'viem/chains';
import { fontSizes } from 'ui/constants';
import { ButtonInlineLoader } from 'components/Loader';
import { popularProviders } from './popularProviders';
import { Button } from '@/components/ui/button';

export function ConnectPageContent({
  next,
}: {
  /**
   * A path to redirect to after a successful connection. Optional.
   */
  next?: string;
}) {
  const { push: navigate } = useRouter();

  /**
   * Redirect to the next page if specified, otherwise redirect to the overview page
   * @param auth  The auth data returned from the Siwe API
   */
  const onSuccess = async (auth?: any) => {
    // Redirect
    if (next) {
      navigate(next);
    } else {
      navigate(`/overview`);
    }
  };

  return (
    <ConnectPageContentWrapper>
      <Header>
        <h1>
          Login to <strong>Gnosis Pay Rewards</strong>
        </h1>
      </Header>
      <ConnectWalletStep onWalletConnect={onSuccess} />
    </ConnectPageContentWrapper>
  );
}

function ConnectWalletStep({ onWalletConnect }: { onWalletConnect: () => void }) {
  const account = useAccount();
  const { connectors, connectAsync, isPending } = useConnect({});

  const sortedConnectors = useMemo(() => {
    const rabby = connectors.find((connector) => connector.id === 'io.rabby');
    const injected = connectors.find((connector) => connector.id === 'injected');
    const phantom = connectors.find((connector) => connector.id === 'app.phantom');
    const coinbase = connectors.find((connector) => connector.id === 'coinbaseWalletSDK');
    const walletConnect = connectors.find((connector) => connector.id === 'walletConnect');

    const sortedConnectors = [rabby ? rabby : injected, phantom, coinbase, walletConnect].filter(
      Boolean,
    ) as Connector[];

    return sortedConnectors;
  }, [connectors]);

  return (
    <ConnectorList>
      {sortedConnectors.map((connector) => {
        const providerInfo = popularProviders[connector.id] ?? {};
        return (
          <Button
            data-connector-id={connector.id}
            type="button"
            key={connector.id}
            onClick={async () => {
              await connectAsync({
                connector,
                chainId: mainnet.id,
              }).catch((e) => {
                if (e instanceof ConnectorAlreadyConnectedError && account.address) {
                  return onWalletConnect();
                }
                console.log(e);
              });
            }}
          >
            <ConnectorButtonInnerLayout>
              {providerInfo.logo ? (
                <div data-content="logo">
                  <providerInfo.logo width={20} />
                </div>
              ) : connector.icon ? (
                <div data-content="logo">
                  <img src={connector.icon} alt={connector.name} />
                </div>
              ) : null}
              <div>{providerInfo.name || connector.name}</div>
              <ButtonInlineLoader show={isPending} />
            </ConnectorButtonInnerLayout>
          </Button>
        );
      })}
    </ConnectorList>
  );
}

const Header = styled.header`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100px;

  > h1 {
    font-size: ${fontSizes.xxxlarge};
    font-weight: 400;
  }
`;

const ConnectPageContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const ConnectorList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 320px;
`;

export const ConnectorButtonInnerLayout = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  & > div {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  & > div[data-content='logo'] {
    width: 20px;
    height: 20px;
  }
`;

const StyledError = styled.div`
  color: red;
  font-size: 12px;
  margin-top: 8px;
  text-align: center;
  width: 100%;
`;
