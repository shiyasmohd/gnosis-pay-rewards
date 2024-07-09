import { StepTransactionEntryStruct } from './SteppedModalParts';
import { NoModalDataProvidedError } from 'components/Modal/utils';
import { ApplicationModal, useModal } from 'ui/modal';
import { useCallback } from 'react';

// takes the keys of the steps and transform them into steps: { [key: string]: StepTransactionEntryStruct }
type GenericSteppedModalStructureTransformer<Keys extends string[]> = {
  [key in Keys[number]]: StepTransactionEntryStruct;
};

/**
 * Use this hook to open, close and update a generic stepped modal.
 */
export function useGenericSteppedModal<ModalTitle extends string, StepKeys extends string[]>() {
  const {
    closeModal,
    openModal: baseOpenModal,
    setModalData,
    modal,
  } = useModal<{
    title: ModalTitle;
    steps: StepKeys;
  }>();

  type ModalDataType = {
    title: ModalTitle;
    steps: GenericSteppedModalStructureTransformer<StepKeys>;
  };

  const isOpen = modal === ApplicationModal.GENERIC_STEPPED_MODAL;

  const openModal = useCallback(
    (data: ModalDataType) => {
      baseOpenModal(ApplicationModal.GENERIC_STEPPED_MODAL, data as any);
    },
    [baseOpenModal],
  );

  const updateStep = useCallback(
    (stepKey: keyof ModalDataType['steps'], nextStepData: Partial<StepTransactionEntryStruct>) => {
      setModalData((data) => {
        if (data === null) {
          throw new NoModalDataProvidedError(ApplicationModal.GENERIC_STEPPED_MODAL);
        }

        return {
          ...data,
          steps: {
            ...data.steps,
            [stepKey]: {
              // @ts-ignore
              ...data.steps[stepKey as any],
              ...nextStepData,
            },
          },
        };
      });
    },
    [setModalData],
  );

  return {
    closeModal,
    updateStep,
    openModal,
    isOpen,
  };
}
