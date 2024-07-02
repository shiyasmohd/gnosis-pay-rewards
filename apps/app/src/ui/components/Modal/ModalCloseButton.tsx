import { styled } from 'styled-components';
import { modalPadding } from './styles';
import { ComponentPropsWithoutRef } from 'react';
import { SVGMotionProps, motion } from 'framer-motion';

export const StyledModalCloseButton = styled.button`
  display: block;
  position: absolute;
  top: ${modalPadding};
  right: ${modalPadding};
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  outline: none;
  z-index: 1;
  height: 24px;
  width: 24px;
  overflow: hidden;
  user-select: none;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Path = (props: SVGMotionProps<SVGPathElement>) => (
  <motion.path fill="transparent" strokeWidth="3" stroke="#fff" strokeLinecap="round" {...props} />
);

const svgSize = 24;

interface ModalCloseButtonProps extends ComponentPropsWithoutRef<'button'> {
  color?: string;
}

export function ModalCloseButton({ color = '#fff', ...props }: ModalCloseButtonProps) {
  return (
    <StyledModalCloseButton {...props} data-button-id="modal-close-button">
      <svg height={svgSize} width={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <Path stroke={color} transform="translate(2px, 2px)" d="M 3 16.5 L 17 2.5" />
        <Path stroke={color} transform="translate(2px, 2px)" d="M 3 2.5 L 17 16.346" />
      </svg>
    </StyledModalCloseButton>
  );
}
