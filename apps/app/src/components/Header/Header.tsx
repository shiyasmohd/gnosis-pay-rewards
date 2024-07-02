import { styled } from 'styled-components';

import { screenBreakpoints } from 'ui/constants';
import { DesktopHeader } from './DesktopHeader';
import { MobileHeader } from './MobileHeader';

export const HEADER_HEIGHT = '88px'; // 4px * 22
export const TOGGLE_BUTTON_SIZE = '50px';

export function Header() {
  return (
    <StyledHeaderFrame>
      <MobileHeader />
      <DesktopHeader />
    </StyledHeaderFrame>
  );
}

const StyledHeaderFrame = styled.header`
  height: ${HEADER_HEIGHT};
  @media (min-width: ${screenBreakpoints.medium}) {
    width: 100%;
  }
`;
