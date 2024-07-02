import { colors, fontSizes, screenBreakpoints } from 'ui/constants';
import { Container } from 'ui/components/Container';
import Link from 'next/link';
import { AccountStatus } from './AccountStatus';
import { styled } from 'styled-components';

const navigatorBorder = `1px solid ${colors.matteBlack}`;

export function DesktopHeader() {
  return (
    <StyledDesktopHeader $fluid>
      <StyledDesktopHeaderLayout>
        <Link href="/">KPK</Link>
        <StyledDesktopHeaderNav>
          <AccountStatus />
        </StyledDesktopHeaderNav>
      </StyledDesktopHeaderLayout>
    </StyledDesktopHeader>
  );
}

const StyledDesktopHeaderLayout = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100%;
`;

const StyledDesktopHeader = styled(Container)`
  display: none; // hide on mobile
  border-bottom: ${navigatorBorder};
  @media (min-width: ${screenBreakpoints.medium}) {
    display: block;
  }
`;

const Nav = styled.nav`
  display: flex;
  flex: 1;
  align-items: center;
  flex-direction: row;
  justify-content: start;
  gap: 16px;
  width: 100%;

  /** On dekstop, we want the nav to be on the right */
  @media (min-width: ${screenBreakpoints.medium}) {
    flex-direction: row;
    justify-content: end;
    gap: 32px;
  }

  & > a {
    display: block;
    text-decoration: none;
    color: ${colors.white};
    font-size: ${fontSizes.medium};
    font-weight: bold;
    text-transform: uppercase;
    padding: 8px 12px;
    border-radius: 4px;
    border: 0;
    transition: all 0.2s ease-in-out;
  }

  & > a:hover,
  & > a.active {
    text-decoration: none;
    background-color: ${colors.white};
    color: ${colors.black};
  }
`;

const StyledDesktopHeaderNav = styled.nav`
  /** Hidden on mobile */
  display: none;
  align-items: center;
  flex-direction: column;
  justify-content: end;
  gap: 16px;
  background: transparent;
  z-index: 1000;
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  ${Nav} {
    width: auto;
    flex: none;
  }
`;
