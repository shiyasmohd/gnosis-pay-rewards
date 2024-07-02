'use client';

import { motion } from 'framer-motion';
import { styled } from 'styled-components';
import { colors, screenBreakpoints } from 'ui/constants';
import { Container } from 'ui/components/Container';
import { AccountStatus } from './AccountStatus';

const ASIDE_BACKGROUND_COLOR = colors.matteBlack;
const SIDE_COMPONENTS_MAX_WIDTH = '300px';

const navigatorBorder = `1px solid ${colors.matteBlack}`;

export function MobileHeader() {
  return (
    <MobileNavigator>
      <WalletConnectButtonContainer>
        <AccountStatus />
      </WalletConnectButtonContainer>
    </MobileNavigator>
  );
}

const WalletConnectButtonContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  /** Bottom spacing for mobile nav */
  max-width: ${SIDE_COMPONENTS_MAX_WIDTH};
  @media (min-width: ${screenBreakpoints.medium}) {
    margin-bottom: 0;
    width: ${SIDE_COMPONENTS_MAX_WIDTH};
    max-width: ${SIDE_COMPONENTS_MAX_WIDTH};
  }
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledMobileHeaderContainer = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: center;
  @media (min-width: ${screenBreakpoints.medium}) {
    display: none;
  }
`;

const MobileNavigator = styled(motion.aside)`
  display: flex;
  align-items: stretch;
  flex-direction: row;
  justify-content: end;
  gap: 16px;
  background: ${ASIDE_BACKGROUND_COLOR};
  border-top: ${navigatorBorder};
  width: 100%;
  height: 80px;
  position: fixed;
  z-index: 1048;
  bottom: 0;
  left: 0;
  padding: 0 16px;
  @media (min-width: ${screenBreakpoints.medium}) {
    display: none;
  }
`;
