import {
  ModalBackdrop,
  ModalHeader,
  ModalInnerWrapper,
  ModalOutterWrapper,
  ModalContent,
  ModalTitle,
} from 'ui/components/Modal/styles';
import { AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { ModalCloseButton } from 'ui/components/Modal/ModalCloseButton';
import { borderRadiuses, colors } from 'ui/constants';

interface SlideUpModalProps {
  /**
   * If true, the modal will be open.
   */
  isOpen: boolean;
  /**
   * Callback to close the modal.
   * @returns
   */
  closeModal: () => void;
  /**
   * If true, the modal will close when the backdrop is clicked.
   */
  closeModalOnBackdropClick?: boolean;
  title: string;
  content: ReactNode;
  /**
   * If true, the modal will show a close button.
   */
  showCloseButton?: boolean;
  /**
   * Max width of the modal. Defaults to 440px.
   */
  maxWidth?: string;
  /**
   * Padding of the modal content. Defaults to 24px.
   */
  contentPadding?: string;
}

export function SlideUpModal({
  isOpen,
  closeModal,
  title,
  content,
  closeModalOnBackdropClick = false,
  showCloseButton = true,
  maxWidth = '440px',
  contentPadding,
}: SlideUpModalProps) {
  return (
    <AnimatePresence mode="wait">
      {isOpen === true ? (
        <ModalBackdrop
          onClick={closeModalOnBackdropClick ? closeModal : undefined}
          $alignItems="flex-end"
          $alignItemsDesktop="center"
        >
          <ModalOutterWrapper
            $maxWidth={maxWidth}
            onClick={(e) => e.stopPropagation()}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              y: 100,
              opacity: 0,
            }}
            initial={{
              y: 100,
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
            }}
          >
            <ModalInnerWrapper
              $borderRadiusBottom={'0px'}
              $borderRadiusTop={borderRadiuses.xsmall}
              $borderRadiusBottomDesktop={borderRadiuses.xsmall}
              $borderRadiusTopDesktop={borderRadiuses.xsmall}
            >
              {showCloseButton === true ? <ModalCloseButton color={colors.white} onClick={closeModal} /> : null}
              <ModalHeader>
                <ModalTitle>{title}</ModalTitle>
              </ModalHeader>
              <ModalContent $padding={contentPadding}>{content}</ModalContent>
            </ModalInnerWrapper>
          </ModalOutterWrapper>
        </ModalBackdrop>
      ) : null}
    </AnimatePresence>
  );
}
