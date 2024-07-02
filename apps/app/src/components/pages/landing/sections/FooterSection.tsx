import styled from 'styled-components';

// Internal custom components
import { SectionWrapper } from '../components/SectionWrapper';

export function FooterSection() {
  return <StyledFooterSectionWrapper $zIndex={2}>&nbsp;</StyledFooterSectionWrapper>;
}

const StyledFooterSectionWrapper = styled(SectionWrapper)`
  height: 500px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;
