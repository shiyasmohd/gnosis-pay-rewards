import styled from 'styled-components';
import { colors, screenBreakpoints } from 'ui/constants';

export const SectionWrapper = styled.section<{
  $zIndex?: number;
}>(
  (props) => `
  ${props.$zIndex ? `z-index: ${props.$zIndex}` : ''};
  background-color: ${colors.black000};
  flex-direction: column;
  align-items: center;
  display: flex;
  position: relative;
`,
);

export const SectionTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 60px;
  @media (min-width: ${screenBreakpoints.medium}) {
    font-size: 5vw;
  }
`;
