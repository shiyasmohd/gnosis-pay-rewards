import { styled } from 'styled-components';
import { motion } from 'framer-motion';

import { colors } from '../../constants';
import { useState } from 'react';

export type ToggleComponentProps = {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
};

// Default values for the toggle
const toggleWidth = '36px';
const toggleHeight = '20px';

const wrappedBorderRadius = '100px';
const inputBorderRadius = `calc(${wrappedBorderRadius} - 2px)`; // 2px is the padding of the shadow wrapper

export function Toggle({ id, checked, onChange }: ToggleComponentProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <ToggleShadowWrapper
      id={id}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => {
        onChange(!checked);
      }}
    >
      <StyledGradient
        variants={{
          normal: {
            opacity: 0,
          },
          hovered: {
            opacity: 1,
          },
          checked: {
            opacity: 1,
          },
        }}
        initial="normal"
        animate={isHovered ? 'hovered' : checked ? 'checked' : 'normal'}
      />
      <StyledSwitch>
        <StyledGradient
          key={'check-gradient'}
          variants={{
            normal: {
              opacity: 0,
            },
            checked: {
              opacity: 1,
            },
          }}
          initial="normal"
          animate={checked ? 'checked' : 'normal'}
        />
        <StyledHandle
          layout
          variants={{
            normal: {
              x: '0px',
            },
            checked: {
              x: '16px',
            },
          }}
          initial="normal"
          animate={checked ? 'checked' : 'normal'}
          $isChecked={checked}
        />
      </StyledSwitch>
    </ToggleShadowWrapper>
  );
}

/**
 * Adds a shadow to the input
 */
const ToggleShadowWrapper = styled(motion.div)<{
  $height?: string;
  $width?: string;
}>(
  (props) => `
  position: relative;
  overflow: hidden;
  width: ${props.$width || toggleWidth};
  height: ${props.$height || toggleHeight};
  border-radius: ${wrappedBorderRadius};
  background-color: ${colors.lightGrey};
  cursor: pointer;
  padding: 2px; // creates enough space that StyledGradient can be seen as border
  `,
);

const StyledGradient = styled(motion.div)`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
  background: ${colors.white};
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  border-radius: ${inputBorderRadius};
  z-index: 1;
  pointer-events: none;
`;

const StyledSwitch = styled.div<{
  $checked?: boolean;
}>(
  (props) => `
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: ${inputBorderRadius};
  background-color: ${props.$checked ? colors.white : colors.black};
  cursor: pointer;
  display: block;
  z-index: 2;
`,
);

const StyledHandle = styled(motion.div)<{
  $isChecked?: boolean;
}>(
  (props) => `
  display: block;
  position: relative;
  height: 100%;
  width: 16px;
  z-index: 2;
  border-radius: 9999px;
  background: transparent;
  ${props.$isChecked ? `background: ${colors.white};` : ''}
`,
);
