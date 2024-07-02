'use client';
import { shortenAddress } from '@karpatkey/gnosis-pay-rewards-sdk';
import { Tooltip } from 'components/Tooltip/Tooltip';
import { AnimatePresence } from 'framer-motion';
import { useDisconnect, useEnsName } from 'wagmi';
import { ConnectedAccountImage } from './ConnectedAccountImage';
import { BlackButton } from 'ui/components/Button';
import { styled } from 'styled-components';
import { useRouter } from 'next/navigation';
import { useWeb3 } from 'hooks/useWeb3';

export function AccountStatus() {
  const { replace } = useRouter();
  const { disconnect } = useDisconnect();
  const { account: accountAddress, isConnected } = useWeb3();
  const { data: primaryEnsName } = useEnsName({
    address: accountAddress,
  });

  const onLogoutClick = async () => {
    await disconnect?.();
    replace('/');
  };

  return (
    <AnimatePresence mode="wait">
      {isConnected ? (
        <StyledLayout>
          <div className="content">
            {primaryEnsName ? (
              <>
                <span>{primaryEnsName}</span>
                <ConnectedAccountImage />
              </>
            ) : (
              <>
                <Tooltip content={<>{accountAddress}</>}>
                  <strong>{shortenAddress(accountAddress)}</strong>
                </Tooltip>
              </>
            )}
          </div>
          <BlackButton title="Disconnect and log out" onClick={onLogoutClick}>
            Log out
          </BlackButton>
        </StyledLayout>
      ) : null}
    </AnimatePresence>
  );
}

const StyledLayout = styled.div`
  display: flex;
  gap: 8px;

  & .content {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;
