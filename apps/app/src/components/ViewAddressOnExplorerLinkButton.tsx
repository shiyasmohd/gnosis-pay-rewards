'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ExternalLink as ExternalLinkIcon } from 'react-feather';
import { styled } from 'styled-components';
import * as z from 'zod';

import { colors } from 'ui/constants';
import { gnosis } from 'viem/chains';

export type ViewAddressOnExplorerLinkButtonPropsType = {
  href: string;
  title?: string;
  show?: boolean;
  label: string;
  /**
   * The label to show for the address
   */
  addressLabel?: string;
  /**
   * If true, the label will be shown as a suggestion
   */
  allowSuggestLabel?: boolean;
  /**
   * The token logo URI
   */
  tokenLogoURI?: string;
};

export function ViewAddressOnExplorerLinkButton({
  href,
  title,
  label,
  tokenLogoURI,
}: ViewAddressOnExplorerLinkButtonPropsType) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <>
      <StyledHref
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        // Anchor props
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={title}
      >
        <div className="flex items-center content-center gap-2">
          {tokenLogoURI ? <img src={tokenLogoURI} alt={label} className="w-6 h-6 rounded-full" /> : null}
          <span>{label}</span>
          <StyledMotionIconContainer
            // Motion props
            variants={{
              hover: {
                opacity: 1,
                y: 0,
              },
              initial: {
                opacity: 0,
                y: 4,
              },
            }}
            initial="initial"
            animate={isHovered === true ? 'hover' : 'initial'}
          >
            <ExternalLinkIcon size={16} stroke={colors.white} />
          </StyledMotionIconContainer>
        </div>
      </StyledHref>
    </>
  );
}

const UpdateAddressLabelFormSchema = z.object({
  label: z
    .string()
    .min(2, {
      message: 'Label must be at least 3 characters long',
    })
    .max(64, {
      message: 'Label must be at most 64 characters long',
    }),
  address: z.string().min(42, { message: 'Address must be at least 42 characters long' }),
  chainId: z.number().min(1),
});

const StyledHref = styled.a`
  &,
  &:hover,
  &:focus,
  &:active,
  &:visited {
    text-decoration: none;
    color: ${colors.white};
  }
`;

const StyledMotionIconContainer = styled(motion.div)`
  display: flex;
  flex-direction: row;
`;

export const ConnectorButtonInnerLayout = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  & > div {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  & > div[data-content='logo'] {
    width: 20px;
    height: 20px;
  }
`;
