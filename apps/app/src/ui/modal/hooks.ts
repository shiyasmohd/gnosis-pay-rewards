import { useContext } from 'react';
import { IModalContext, ModalContext } from './context';
import { ApplicationModal } from './constants';

export function useModal<ModalData = unknown>() {
  const ctx = useContext(ModalContext as React.Context<IModalContext<ModalData>>);

  if (!ctx) {
    throw new Error('useModal must be used within a ModalProvider');
  }

  return ctx;
}

/**
 * Hook to open the connect wallet modal
 * @returns
 */
export function useConnectWalletModal() {
  const { openModal: baseOpenModal, modal, closeModal } = useModal();

  const isOpen = modal === ApplicationModal.CONNECT_WALLET;

  return {
    openModal: () => baseOpenModal(ApplicationModal.CONNECT_WALLET),
    isOpen,
    closeModal,
  };
}
