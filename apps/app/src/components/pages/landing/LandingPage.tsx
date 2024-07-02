'use client';

import styled from 'styled-components';
import { HeroSection } from './sections/HeroSection';
import { useEffect } from 'react';
import { colors, screenBreakpoints } from 'ui/constants';
import { RewardsTiersSection } from './sections/RewardTiersSection';
import { FAQsSection } from './sections/FAQsSection';

export function LandingPage() {
  useEffect(() => {
    document.body.style.minHeight = '100vh';
  }, []);

  return (
    <StyledPageWrapper>
      <HeroSection />
      <RewardsTiersSection />
      <FAQsSection />
    </StyledPageWrapper>
  );
}

const StyledSectionDivider = styled.div<{
  $height?: number;
  $heightMedium?: number;
  $heightDesktop?: number;
}>(
  (props) => `
  height: ${props.$height ? `${props.$height}px` : '100px'};
  background-color: #2f2f2f;
  @media (min-width: ${screenBreakpoints.medium}) {
    height: ${props.$heightMedium ? `${props.$heightMedium}px` : '100px'};
  }
  @media (min-width: ${screenBreakpoints.large}) {
    height: ${props.$heightDesktop ? `${props.$heightDesktop}px` : '100px'};
  }
`,
);

const StyledPageWrapper = styled.div`
  width: 100%;
  overflow: hidden;
  background-color: ${colors.black};
`;
