import { getExplorerLink } from '@karpatkey/gnosis-pay-rewards-sdk';
import { ApplicationModal, useModal } from 'ui/modal';
import {
  StepTransactionEntryStruct,
  StepTransactionEntryComponentProps,
  SteppedModalStandalone,
  SteppedModalStep,
} from './SteppedModalParts';
import { NoModalDataProvidedError } from 'components/Modal/utils';
import { SlideUpModal } from 'components/Modal/SlideUpModal';
import { StepStatus } from 'ui/components/Modal';

type GenericSteppedModalProps = Pick<StepTransactionEntryComponentProps, 'getExplorerLink'> & {
  onClose: () => void;
  title?: string;
  steps: {
    [stepId: string]: StepTransactionEntryStruct;
  };
};

type IGenericSteppedModal = Omit<GenericSteppedModalProps, 'onClose' | 'getExplorerLink'>;

export function GenericSteppedModal() {
  const { modal, data, closeModal } = useModal<IGenericSteppedModal>();
  const isOpen = modal === ApplicationModal.GENERIC_STEPPED_MODAL;

  if (isOpen && !data) {
    throw new NoModalDataProvidedError(ApplicationModal.GENERIC_STEPPED_MODAL);
  }

  const dataSteps = Object.values(data?.steps ?? {});
  const canClose = dataSteps.some((step) => step.status === StepStatus.ERROR);

  return (
    <SlideUpModal
      isOpen={isOpen}
      title={data?.title ?? 'Generic Stepped Modal'}
      closeModal={closeModal}
      contentPadding="0 24px 24px 24px!important"
      showCloseButton={canClose}
      closeModalOnBackdropClick={canClose}
      content={
        <>
          {Object.values(data?.steps ?? {})
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((step, index) => (
              <SteppedModalStep key={index} {...step} getExplorerLink={getExplorerLink} />
            ))}
        </>
      }
    />
  );
}

/**
 * A generic stepped modal that can be used to render any steps
 */
export function RenderGenericSteppedModal({ onClose, getExplorerLink, title, steps }: GenericSteppedModalProps) {
  return (
    <SteppedModalStandalone onClose={onClose} title={title ?? 'Generic Stepped Modal'}>
      {Object.values(steps)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((step, index) => (
          <SteppedModalStep key={index} {...step} getExplorerLink={getExplorerLink} />
        ))}
    </SteppedModalStandalone>
  );
}
