import { styled } from 'styled-components';
import { Container } from 'ui/components/Container';
import { NavLinksContent } from './NavLinks';
import { screenBreakpoints } from 'ui/constants';

export function Header() {
  return (
    <StyledHeaderFrame>
      <Container $fluid>
        <StyledInnerHeaderFrame>
          <NavLinksContent />
        </StyledInnerHeaderFrame>
      </Container>
    </StyledHeaderFrame>
  );
}

const StyledHeaderFrame = styled.header`
  z-index: 5;
  width: 100%;
  height: 80px;
`;

const StyledInnerHeaderFrame = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1em;
  height: 100%;
  align-items: center;
  justify-content: end;
  @media (min-width: ${screenBreakpoints.large}) {
    justify-content: space-between;
  }
`;
