'use client';
import { PropsWithChildren, useCallback, useState } from 'react';

import { ConnectWalletModal } from 'components/Modal/ConnectWalletModal';
import { GenericSteppedModal } from 'components/SteppedModal/SteppedModal';

import { ApplicationModal } from './constants';
import { ModalContext } from './context';

export function ModalProvider({ children }: PropsWithChildren) {
  const [modal, setModal] = useState<ApplicationModal | null>(null);
  const [data, setData] = useState<unknown>(null);

  const openModal = useCallback((modal: ApplicationModal, data?: unknown) => {
    setModal(modal);
    setData(data);
    document.body.style.overflow = 'hidden';
  }, []);

  const setModalData = useCallback((data: unknown) => {
    setData(data);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
    setData(null);
    document.body.style.overflow = 'auto';
  }, []);

  return (
    <ModalContext.Provider
      value={{
        modal,
        data,
        openModal,
        closeModal,
        setModalData,
      }}
    >
      <ConnectWalletModal />
      <GenericSteppedModal />
      {children}
    </ModalContext.Provider>
  );
}
