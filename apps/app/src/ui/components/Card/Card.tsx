import { PropsWithChildren } from 'react';
import { styled } from 'styled-components';

import { fontSizes, cardPadding, colors, borderRadiuses, screenBreakpoints } from '../../constants/constants';
import { motion } from 'framer-motion';

const boxShadowOffset = 0;

const cardBorderRadius = borderRadiuses.xsmall;
const cardBackgroundColor = colors.matteBlack;
const cardBorder = `1px solid transparent`;
const cardBorderColor = colors.matteBlack;

interface CardProps {
  $width?: string;
  $height?: string;
  $minHeight?: string;
  $hideBorderOnMobile?: boolean;
  $borderColor?: string;
}

export const StyledCardGutter = styled.div<CardProps>(
  (props) => `
  padding-right: ${boxShadowOffset}px;
  ${props.$width ? `width: ${props.$width};` : ''}
  ${props.$height ? `height: ${props.$height};` : ''}
  ${props.$minHeight ? `min-height: ${props.$minHeight};` : ''}
`,
);

/**
 * Access low level styles of the Card
 */
export const StyledCard = styled(motion.div)<CardProps>(
  (props) => `
  position: relative;
  border-radius: ${cardBorderRadius};
  background: ${cardBackgroundColor};
  border: ${cardBorder};
  border-color: ${props.$borderColor || cardBorderColor};
  ${props.$width ? `width: ${props.$width};` : ''}
  ${props.$height ? `height: ${props.$height};` : ''}
  ${props.$hideBorderOnMobile === true ? `@media (max-width: ${screenBreakpoints.medium}) { border: none; }` : ''}
`,
);

export function Card(props: PropsWithChildren<CardProps>) {
  return (
    <StyledCardGutter $height={props.$height} $width={props.$width} $minHeight={props.$minHeight}>
      <StyledCard {...props}>{props.children}</StyledCard>
    </StyledCardGutter>
  );
}

interface CardInnerWrapperProps {
  $minHeight?: string;
}

export const CardInnerWrapper = styled.div<CardInnerWrapperProps>(
  (props) => `
  position: relative;
  width: 100%;
  height: 100%;
  padding: ${cardPadding};
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  ${props.$minHeight ? `min-height: ${props.$minHeight};` : ''}
`,
);

export const LinkedCardInnerWrapper = styled(CardInnerWrapper).attrs({
  $minHeight: '185px',
})`
  // add border to all but last
  &:not(:last-child) {
    border-bottom: 2px solid;
  }
`;

/**
 * Card Title, used in Card component
 */
export const CardTitle = styled.h2<{
  $marginBottom?: string;
}>`
  font-size: ${fontSizes.large};
  font-weight: 400;
  margin: 0;
  margin-bottom: ${(props) => props.$marginBottom || '0.5rem'};
`;
