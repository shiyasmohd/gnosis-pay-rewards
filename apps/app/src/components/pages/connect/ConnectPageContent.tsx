'use client';
import { shortenAddress } from '@karpatkey/gnosis-pay-rewards-sdk';
import { ConnectResult } from '@wagmi/core';
import { useRouter } from 'next/navigation';
import { styled } from 'styled-components';
import { ConnectorAlreadyConnectedError, useAccount, useConnect, useWalletClient } from 'wagmi';
import { mainnet } from 'viem/chains';
import { BlackButton, TextButton } from 'ui/components/Button';
import { colors, fontSizes } from 'ui/constants';
import { ButtonInlineLoader } from 'components/Loader';
import { popularProviders } from './popularProviders';
import { useEffect, useState } from 'react';
import { WalletClient } from 'viem';
import { SiweNimiIdAuth, createMessage, verifySignature } from 'wallet/siwe';
import { Tooltip } from 'components/Tooltip/Tooltip';
import { useWalletAuth } from 'wallet/atoms';

type OnWalletConnectFn = (data: ConnectResult) => void | Promise<void>;
type OnHandleSiweFn = (walletClient: WalletClient) => void | Promise<void>;
type OnErrorFn = (error: Error) => void;

export function ConnectPageContent({
  next,
}: {
  /**
   * A path to redirect to after a successful connection. Optional.
   */
  next?: string;
}) {
  const [currentStep, setCurrentStep] = useState<'connect' | 'siwe'>('connect');
  const { push: navigate } = useRouter();
  const { data: walletClient } = useWalletClient();
  const { disconnect, setAuth } = useWalletAuth();
  const [isPrepared, setIsPrepared] = useState(false);

  // Disconnect any previous wallet client
  useEffect(() => {
    // Disconnect the wallet client
    disconnect();

    return () => {
      setIsPrepared(false);
    };
  }, []);

  /**
   * This is the callback that is called when the user successfully connects to a wallet
   * @param data  The data returned from the connectAsync function
   * @returns
   */
  const onWalletConnect = async ({ connector }: ConnectResult) => {
    setCurrentStep('siwe');
  };

  /**
   * Redirect to the next page if specified, otherwise redirect to the overview page
   * @param auth  The auth data returned from the Siwe API
   */
  const onSuccess = async (auth: SiweNimiIdAuth) => {
    console.log({
      auth,
    });

    setAuth(auth);

    // Get the address from the auth data
    const { address } = auth.payload;

    // Redirect
    if (next) {
      navigate(next);
    } else {
      navigate(`/${address.toLowerCase()}/overview`);
    }
  };

  return (
    <ConnectPageContentWrapper>
      <Header>
        <h1>
          Login to <strong>karpatkey</strong>
        </h1>
      </Header>
      {currentStep === 'connect' && (
        <ConnectWalletStep
          onWalletConnect={onWalletConnect}
          onHandleSiwe={() => {
            setCurrentStep('siwe');
          }}
        />
      )}
      {currentStep === 'siwe' && (
        <SignInWithEthereumStep
          onError={() => {}}
          walletClient={walletClient as WalletClient}
          onSuccess={onSuccess}
          onCancel={() => {
            setCurrentStep('connect');
          }}
        />
      )}
    </ConnectPageContentWrapper>
  );
}

function ConnectWalletStep({
  onWalletConnect,
  onHandleSiwe,
}: {
  onWalletConnect: OnWalletConnectFn;
  onHandleSiwe?: OnHandleSiweFn;
}) {
  const { data: prevWalletClient } = useWalletClient();
  const account = useAccount();
  const { connectors, isLoading, pendingConnector, connectAsync } = useConnect({
    onSuccess: onWalletConnect as any,
  });

  return (
    <ConnectorList>
      {connectors.map((connector) => {
        const providerInfo = popularProviders[connector.id] ?? {};

        return (
          <ConnectorButtonBlack
            data-connector-id={connector.id}
            type="button"
            disabled={!connector.ready}
            key={connector.id}
            onClick={async () => {
              await connectAsync({
                connector,
                chainId: mainnet.id,
              }).catch((e) => {
                if (e instanceof ConnectorAlreadyConnectedError && account.address) {
                  return onHandleSiwe?.(prevWalletClient!);
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
              ) : null}
              <div>{providerInfo.name || connector.name}</div>
              <ButtonInlineLoader show={isLoading && connector.id === pendingConnector?.id} />
            </ConnectorButtonInnerLayout>
          </ConnectorButtonBlack>
        );
      })}
    </ConnectorList>
  );
}

function SignInWithEthereumStep({
  onSuccess,
  walletClient,
  onError,
  onCancel,
  invoke = false,
}: {
  invoke?: boolean;
  onSuccess: (data: SiweNimiIdAuth) => void | Promise<void>;
  walletClient: WalletClient;
  onError: OnErrorFn;
  onCancel?: () => void;
}) {
  const [error, setError] = useState<Error | null>(null);

  const [isLoading, setLoading] = useState(false);

  const requestSiwe = async (walletClient: WalletClient) => {
    setError(null);

    try {
      const address = walletClient.account?.address;

      if (!address) {
        throw new Error('No address');
      }

      setLoading(true);

      // Request the message from the API
      const message = await createMessage({
        address,
        statement: '',
      });

      // Ask the wallet to sign the message
      const signature = await walletClient?.signMessage({
        account: address,
        message,
      });

      // Verify the signature with the API and notify the parent component
      const { data: auth } = await verifySignature({
        message,
        signature,
      });

      setLoading(false);

      // Notify the parent component
      onSuccess(auth);
    } catch (e) {
      if (e instanceof Error && e.message.includes('User rejected the request')) {
        setLoading(false);
        return;
      }

      console.log(e);
      setError(e as Error);
      onError(e as Error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!walletClient || !invoke) {
      return;
    }

    requestSiwe(walletClient);

    return () => {
      setLoading(false);
    };
  }, [walletClient]);

  return (
    <ConnectorList>
      <ConnectorButtonBlack onClick={() => requestSiwe(walletClient)}>
        <ConnectorButtonInnerLayout>
          <div>Sign in with Ethereum</div>
          <div>
            <Tooltip
              content={
                <>
                  This creates a session with your Ethereum address. Using a session, you can manage your ENS names
                  safely and securely without using your wallet.
                </>
              }
            />
          </div>
          <ButtonInlineLoader show={isLoading} />
        </ConnectorButtonInnerLayout>
      </ConnectorButtonBlack>
      <div
        style={{
          textAlign: 'center',
        }}
      >
        <small>
          Connected as{' '}
          <Tooltip content={<>{walletClient?.account?.address}</>}>
            <strong>{shortenAddress(walletClient?.account?.address)}</strong>
          </Tooltip>
        </small>
      </div>
      <div>
        {error && (
          <ConnectorButtonInnerLayout>
            <StyledError>{error.message}</StyledError>
          </ConnectorButtonInnerLayout>
        )}
      </div>
      <CancelButton onClick={onCancel} title="Cancel and change the wallet provider">
        <ConnectorButtonInnerLayout>
          <div>Cancel</div>
        </ConnectorButtonInnerLayout>
      </CancelButton>
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

export const CancelButton = styled(TextButton)`
  // min-width: 300px;
  height: 48px;
  text-transform: unset;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const ConnectorButtonBlack = styled(BlackButton)(
  (props) => `
    text-transform: unset;
    text-decoration: none;
    position: relative;
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
    min-width: 300px;
    height: 48px;
    &:hover {
      .wheel-loader-svg {
        path {
          stroke: ${colors.black};
        }
      }
      .tooltip-icon-svg {
        circle {
          fill: ${colors.white};
        }
      }
    }
  `,
);

const StyledError = styled.div`
  color: red;
  font-size: 12px;
  margin-top: 8px;
  text-align: center;
  width: 100%;
`;
