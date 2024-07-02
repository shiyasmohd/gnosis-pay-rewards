import { InputHTMLAttributes, useState } from 'react';
import { styled } from 'styled-components';
import { borderRadiuses, colors } from '../../constants/constants';
import { motion } from 'framer-motion';

export type InputComponentProps = InputHTMLAttributes<HTMLInputElement> & {
  marginBottom?: string;
};

const inputBackgroundColor = {
  default: colors.lightBlack,
  disabled: colors.lightGrey,
  focused: colors.matteBlack,
  hovered: colors.matteBlack,
};

const inputBorderColor = {
  default: colors.lightGrey,
  disabled: colors.matteBlack,
  focused: colors.white,
  hovered: colors.white,
};

const inputTextColor = {
  default: colors.white,
  disabled: colors.lightGrey,
  focused: colors.white,
  hovered: colors.white,
};

const wrappedBorderRadius = borderRadiuses.xxsmall;
const inputBorderRadius = `calc(${wrappedBorderRadius} - 1px)`; // 2px is the padding of the shadow wrapper

/**
 * A simple JSX input component
 * @param props
 * @returns
 */
export function Input({ marginBottom, disabled, ...props }: InputComponentProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <InputBorderProviderWrapper
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      $isFocused={isFocused}
      $isHovered={isHovered}
      $height="44px"
      $isDisabled={disabled}
    >
      <StyledInput
        $isFocused={isFocused}
        disabled={disabled}
        {...props}
        onFocus={(event) => {
          setIsFocused(true);
          props.onFocus && props.onFocus(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          props.onBlur && props.onBlur(event);
        }}
        onMouseEnter={(event) => {
          setIsHovered(true);
          props.onMouseEnter && props.onMouseEnter(event);
        }}
        onMouseLeave={(event) => {
          setIsHovered(false);
          props.onMouseLeave && props.onMouseLeave(event);
        }}
      />
    </InputBorderProviderWrapper>
  );
}

export const StyledInput = styled.input<{
  $isFocused?: boolean;
}>(
  (props) => `
  width: 100%;
  height: 100%;
  background-color: ${inputBackgroundColor.default};
  border-radius: ${inputBorderRadius};
  padding: 0 16px;
  font-weight: 400;
  &,
  &:focus,
  &:active {
    outline: none;
    border: none; /** Handled by StyledInputShadowWrapper */
  }
  ${props.$isFocused === true ? `color: ${inputTextColor.focused};` : `color: ${inputTextColor.default};`}
`,
);

/**
 * Adds a shadow to the input
 */
const InputBorderProviderWrapper = styled(motion.div)<{
  $height?: string;
  $isHovered?: boolean;
  $isFocused?: boolean;
  $isDisabled?: boolean;
}>(
  ({ $height, $isHovered, $isDisabled, $isFocused }) => `
  width: 100%;
  position: relative;
  overflow: hidden;
  height: ${$height || 'auto'};
  border-radius: ${wrappedBorderRadius};
  color: #B1B5C3;
  transition: background-color 0.2s ease-in-out;
  padding: 1px; // the equivalent of border
  background-color: ${inputBorderColor.default};
  ${$isDisabled !== true && $isHovered === true ? `background-color: ${inputBorderColor.hovered};` : ''}
  ${$isDisabled !== true && $isFocused === true ? `background-color: ${inputBorderColor.focused};` : ''}
  `,
);
