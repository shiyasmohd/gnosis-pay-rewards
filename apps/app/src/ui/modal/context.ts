'use client';
import { createContext, Dispatch, SetStateAction } from 'react';
import { ApplicationModal } from './constants';

export interface IModalContext<ModalData = unknown> {
  modal: ApplicationModal | null;
  /**
   * If you want to pass data to the modal, you can do so here.
   * @param modal The modal to open
   * @param data The data to pass to the modal
   * @returns
   */
  openModal: (modal: ApplicationModal, data?: ModalData) => void;
  setModalData: Dispatch<SetStateAction<ModalData>>;
  closeModal: () => void;
  data: ModalData | null;
}

export const ModalContext = createContext({
  modal: null,
  openModal: () => {},
  closeModal: () => {},
  setModalData: () => {},
  data: null,
} as IModalContext);
