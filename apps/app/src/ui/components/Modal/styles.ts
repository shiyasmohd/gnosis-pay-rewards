import { styled } from 'styled-components';
import { StyledCard } from '../Card';
import {
  containerHorizontalPadding,
  fontSizes,
  modalSectionPadding,
  screenBreakpoints,
} from '../../constants/constants';
import { motion } from 'framer-motion';

/**
 * Default Modal padding
 */
export const modalPadding = '24px';
export const modalMaxWidth = '400px';

export const ModalSection = styled.div`
  display: flex;
  flex-direction: column;
`;

export const ModalHeader = styled(ModalSection)`
  align-items: center;
  justify-content: center;
  padding: ${modalSectionPadding};
  width: 100%;
  position: relative;
  overflow: hidden;
`;

export const ModalTitle = styled.h2`
  font-size: ${fontSizes.large};
  margin: 0;
`;

export const ModalFooter = styled(ModalSection)`
  align-items: center;
  justify-content: center;
  padding: ${modalSectionPadding};
  width: 100%;
  position: relative;
  overflow: hidden;
`;

/**
 * Modal Inner Wrapper: This is the wrapper that contains the content of the modal and defines the size of the modal
 */
export const ModalInnerWrapper = styled(StyledCard)<{
  /**
   * Border radius of the top of the modal
   */
  $borderRadiusTop?: string;
  /**
   * Border radius of the top of the modal on desktop
   */
  $borderRadiusTopDesktop?: string;
  /**
   * Border radius of the bottom of the modal
   */
  $borderRadiusBottom?: string;
  /**
   * Border radius of the top of the modal on desktop
   */
  $borderRadiusBottomDesktop?: string;
}>(
  ({ $borderRadiusBottom, $borderRadiusTop, $borderRadiusBottomDesktop, $borderRadiusTopDesktop }) => `
  align-items: center;
  width: 100%;
  position: relative;
  overflow: hidden;
  border-radius: ${$borderRadiusTop || '0px'} ${$borderRadiusTop || '0px'} ${$borderRadiusBottom || '0px'} ${
    $borderRadiusBottom || '0px'
  };
  @media (max-width: ${screenBreakpoints.medium}) {
    border-bottom: none;
  }
  @media (min-width: ${screenBreakpoints.medium}) {
    border-radius: ${$borderRadiusTopDesktop || '0px'} ${$borderRadiusTopDesktop || '0px'} ${
      $borderRadiusBottomDesktop || '0px'
    } ${$borderRadiusBottomDesktop || '0px'};
  }
`,
);

export const ModalContent = styled(ModalSection)<{
  $minHeight?: string;
  $padding?: string;
  $paddingTop?: string;
}>(
  (props) => `
  padding: ${props.$padding || modalSectionPadding};
  padding-top: ${props.$paddingTop || modalSectionPadding};
  width: 100%;
  position: relative;
  overflow: hidden;
  min-height: ${props.$minHeight || 'auto'};
`,
);

export const ModalContentWithNoPadding = styled(ModalContent)`
  padding: 0;
  align-items: stretch;
  width: 100%;
  border-bottom: 2px solid #000;
`;

export const ModalBackdrop = styled.div<{
  $alignItems?: 'flex-start' | 'center' | 'flex-end';
  $alignItemsDesktop?: 'flex-start' | 'center' | 'flex-end';
}>(
  ({ $alignItems, $alignItemsDesktop }) => `
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: rgba(0, 0, 0, 0);
  backdrop-filter: blur(6px);
  overflow-y: hidden;
  z-index: 1111;
  /** Inner layout */
  display: flex;
  align-items: ${$alignItems || 'center'};
  @media (min-width: ${screenBreakpoints.medium}) {
    align-items: ${$alignItemsDesktop || 'center'};
  }
  justify-content: center;
`,
);

/**
 * Modal Outter Wrapper: This is the wrapper that contains the modal and defines the size of the modal.
 * It supports motion.
 */
export const ModalOutterWrapper = styled(motion.div)<{
  $maxWidth?: string;
}>(
  (props) => `
  position: relative;
  width: 100%;
  max-width: ${props.$maxWidth || '400px'};
  padding: 0 ${containerHorizontalPadding};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
`,
);

export const ModalText = styled.p`
  font-size: ${fontSizes.small};
  font-weight: bold;
  margin-bottom: 12px;
`;
