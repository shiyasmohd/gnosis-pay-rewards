import { styled, css } from 'styled-components';

import { fontSizes, buttonHeight, colors, borderRadiuses } from '../../constants/constants';

interface ButtonProps {
  $minWidth?: string;
  $withHoverEffect?: boolean;
  $smoothTransition?: boolean;
}

const textButtonColor = colors.white;

const borderWidth = '1px';

const fontRuleSet = css`
  font-family: inherit;
  font-weight: 800;
`;

export const DefaultButton = styled.button<ButtonProps>(
  ({ $minWidth, $withHoverEffect = true, $smoothTransition = false }) => `
  border-width: ${borderWidth};
  border-style: solid;
  border-color: ${colors.white};
  border-radius: ${borderRadiuses.xxsmall};
  ${fontRuleSet}
  font-size: ${fontSizes.medium};
  background: ${colors.white};
  height: ${buttonHeight};
  color: ${colors.black};
  line-height: 18px;
  ${$smoothTransition === true ? 'transition: all 0.2s ease-in-out;' : ''}
  ${
    $withHoverEffect === true
      ? `
      &:hover {
        background: ${colors.white};
      }
  `
      : ''
  }
  ${$minWidth ? `min-width: ${$minWidth};` : ''}
`,
);

/**
 * What the name suggests
 */
export const WhiteButton = styled(DefaultButton)`
  background: ${colors.white};
`;

export const BlackButton = styled.button<ButtonProps>(
  ({ $withHoverEffect = true }) => `
  background: transparent;
  border-width: ${borderWidth};
  border-style: solid;
  border-color: ${colors.white};
  border-radius: ${borderRadiuses.xxsmall};
  ${fontRuleSet}
  font-size: ${fontSizes.medium};
  height: ${buttonHeight};
  color: ${colors.white};
  line-height: 18px;
  border-style: solid;
  transition: all 0.2s ease-in-out;
  ${
    $withHoverEffect === true
      ? `
      &:hover {
        background: ${colors.white};
        color: ${colors.black};
        border-color: ${colors.white};
      }`
      : ''
  }
`,
);

/**
 * Use this for secondary actions like "No" in a modal
 */
export const FaintButton = styled(DefaultButton)`
  background: #fbf4e6;
  box-shadow: none;
`;

/**
 * Alias for the default button
 */
export const PrimaryButton = styled(DefaultButton)``;
export const Button = PrimaryButton;

/**
 * A text button with underline decoration. You can use this for small text like CTA helper under a field
 */
export const TextButton = styled.button<{ $alignRight?: boolean }>(
  (props) => `
  background: none;
  border: none;
  color: ${textButtonColor};
  cursor: pointer;
  ${fontRuleSet}
  font-size: ${fontSizes.medium};
  padding: 0;
  text-decoration: underline;
  transition: all 0.2s ease-in-out;
  &:hover {
    color: ${textButtonColor};
  }
  ${props.$alignRight === true ? 'margin-left: auto; text-align:right;' : ''}
`,
);
