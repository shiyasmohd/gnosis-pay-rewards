import { ComponentProps } from 'react';
import styled from 'styled-components';
import { TextButton } from 'ui/components/Button';
import { colors, fontSizes } from 'ui/constants';

export const MotionCTAButton = styled(TextButton)`
  background: ${colors.black};
  color: ${colors.black};
  border-radius: 9999px;
  font-size: ${fontSizes.large};
  text-decoration: none;
  height: 90px;
  z-index: 9;
  border: 0.1875em solid #2f2f2f;
  padding-left: 2.5em;
  padding-right: 2.5em;
  &:hover {
    background: ${colors.white};
    color: ${colors.black};
  }
`;

export function CTAButton({ children, ...buttonProps }: ComponentProps<typeof MotionCTAButton>) {
  return (
    <MotionCTAButton
      whileHover={{
        scale: 1.1,
      }}
      {...(buttonProps as any)}
    >
      {children}
    </MotionCTAButton>
  );
}
