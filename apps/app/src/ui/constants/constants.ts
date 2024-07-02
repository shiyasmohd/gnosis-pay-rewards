import { css } from 'styled-components';

export const MAX_WIDTH_MEDIA_BREAKPOINT = '1200px';
export const XLARGE_MEDIA_BREAKPOINT = '960px';
export const LARGE_MEDIA_BREAKPOINT = '840px';
export const MEDIUM_MEDIA_BREAKPOINT = '720px';
export const SMALL_MEDIA_BREAKPOINT = '540px';
export const MOBILE_MEDIA_BREAKPOINT = '420px';
// export const SMALL_MOBILE_MEDIA_BREAKPOINT = '390px'

export const screenBreakpoints = {
  max: MAX_WIDTH_MEDIA_BREAKPOINT,
  xlarge: XLARGE_MEDIA_BREAKPOINT,
  large: LARGE_MEDIA_BREAKPOINT,
  medium: MEDIUM_MEDIA_BREAKPOINT,
  small: SMALL_MEDIA_BREAKPOINT,
  mobile: MOBILE_MEDIA_BREAKPOINT,
  // smallMobile: SMALL_MOBILE_MEDIA_BREAKPOINT,
} as const;

export const fontSizes = {
  xxsmall: '8px',
  xsmall: '10px',
  small: '12px',
  medium: '16px',
  large: '20px',
  xlarge: '24px',
  xxlarge: '28px',
  xxxlarge: '32px',
} as const;

/**
 * Simple atomic constants for use in styled components.
 */
export const borderRuleSet = css`
  border: 2px solid #000;
  border-radius: 4px;
`;

/**
 *
 */
export const boxShadowRuleSet = css`
  box-shadow: 2px 2px 0px 0px #000;
`;

export const borderWidthRuleValue = '2px solid #000' as const;
export const boxShadowRuleValue = '2px 2px 0px 0px #000' as const;

/**
 * Margin bottom style: 8px;
 */
export const marginBottom8 = css`
  margin-bottom: 8px;
`;

/**
 * Container horizontal padding: 10px;
 */
export const containerHorizontalPadding = '10px' as const;

export const inputHeight = '44px' as const;
export const buttonHeight = '40px' as const;

/**
 * Card padding
 */
export const cardPadding = '24px' as const;

/**
 * Modal section padding
 */
export const modalSectionPadding = '24px' as const;

/**
 * Border radiuses for use in styled components. Ranges from 4px to 28px, in increments of 4px.
 */
export const borderRadiuses = {
  xxsmall: '4px',
  xsmall: '8px',
  small: '12px',
  medium: '16px',
  large: '20px',
  xlarge: '24px',
  xxlarge: '28px',
} as const;

export const colors = {
  white: '#fff',
  black: '#000',
  black000: '#000000',
  acidGreen: '#4feb5f',
  cardBackground: '#fbf4e6',
  appBackground: '#4feb5f',
  matteBlack: '#121312',
  lightBlack: '#0a0a0a',
  lightGrey: '#636669',
} as const;
