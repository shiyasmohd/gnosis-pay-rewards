import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import type { ContractReceipt, ContractTransaction } from 'ethers';
import { PropsWithChildren, useEffect } from 'react';
import { styled } from 'styled-components';
import {
  ModalBackdrop,
  ModalContent as ModalContentBase,
  ModalHeader,
  ModalInnerWrapper,
  ModalOutterWrapper,
  ModalTitle,
  StepStatus,
  StyledStep,
  StyledStepInnerLayout,
} from 'ui/components/Modal';
import { mainnet } from 'viem/chains';

/**
 * A Step entry for the Stepped Modal
 */
export interface IStepTransactionEntry {
  /**
   * The order of the step. This is used to sort the steps
   */
  order: number;
  text: Record<StepStatus, JSX.Element>;
  /**
   * Current status of the step
   */
  status: StepStatus;
  transaction?: ContractTransaction;
  receipt?: ContractReceipt;
  /**
   * Skip this step. If true, this step will be hidden from the modal
   */
  hide?: boolean;
  /**
   * The chainId of the transaction
   */
  chainId?: number;
}

export type StepTransactionEntryComponentProps = IStepTransactionEntry & {
  /**
   * Get the explorer link for a transaction
   * @param chainId
   * @param hash
   * @param type
   * @returns
   */
  getExplorerLink: (chainId: number, hash: string, type: 'transaction' | 'token' | 'address') => string;
};

type SteppedModalStandaloneProps = PropsWithChildren<{
  onClose: () => void;
  title: string;
}>;

/**
 *
 */
export function SteppedModalStandalone({ onClose, title, children }: SteppedModalStandaloneProps) {
  return (
    <ModalBackdrop onClick={onClose}>
      <ModalOutterWrapper $maxWidth="500px" onClick={(e) => e.stopPropagation()}>
        <ModalInnerWrapper>
          <ModalHeader>
            <ModalTitle>{title}</ModalTitle>
          </ModalHeader>
          <ModalContent>{children}</ModalContent>
        </ModalInnerWrapper>
      </ModalOutterWrapper>
    </ModalBackdrop>
  );
}

const ModalContent = styled(ModalContentBase)`
  padding-top: 0;
`;

/**
 * A step in the Stepped Modal component
 * This abstracts the logic for the different states of a step
 * @param status The status of the step
 * @param text The text to display for each status
 * @param receipt The receipt of the transaction
 * @param transaction The transaction
 * @param hide Whether to hide the step
 * @param chainId The chainId of the transaction
 * @param getExplorerLink The function to get the explorer link for a transaction
 */
export function SteppedModalStep({
  status,
  text,
  receipt,
  transaction,
  hide,
  chainId = mainnet.id,
  getExplorerLink,
}: StepTransactionEntryComponentProps) {
  if (hide) return null;

  const transactionLink = transaction
    ? getExplorerLink(
        chainId !== undefined && chainId > 0 ? chainId : transaction.chainId,
        transaction.hash,
        'transaction',
      )
    : undefined;

  return (
    <>
      <StyledStep href={transactionLink} $status={status} target="_blank" rel="noopener noreferrer">
        <StyledStepInnerLayout>
          <div>{text[status]}</div>
          <MotionStatusIndicator status={status} />
        </StyledStepInnerLayout>
      </StyledStep>
    </>
  );
}

function getMotionValue(status: StepStatus) {
  switch (status) {
    case StepStatus.PENDING || StepStatus.DEFAULT:
      return 0;
    case StepStatus.SUCCESS:
      return 100;
    case StepStatus.ERROR:
      return -100;
    default:
      return 0;
  }
}

export function MotionStatusIndicator({
  status,
  opacity = 1,
  width = 50,
  height = 50,
}: {
  status: StepStatus;
  opacity?: number;
  width?: number;
  height?: number;
}) {
  const x = useMotionValue(getMotionValue(status));
  const xInput = [-100, 0, 100];
  const color = useTransform(x, xInput, ['rgb(211, 9, 225)', 'rgb(68, 0, 255)', 'rgb(3, 209, 0)']);
  const tickPath = useTransform(x, [10, 100], [0, 1]);
  const crossPathA = useTransform(x, [-10, -55], [0, 1]);
  const crossPathB = useTransform(x, [-50, -100], [0, 1]);

  useEffect(() => {
    const nextX = getMotionValue(status);
    animate(x, nextX, { duration: 0.2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <motion.div
      className="motion-status-indicator"
      style={{
        width,
        height,
        opacity,
      }}
    >
      <svg className="progress-icon" viewBox="0 0 50 50">
        <motion.path // the ring around the check
          fill="none"
          strokeWidth="2"
          stroke={color}
          d="M 0, 20 a 20, 20 0 1,0 40,0 a 20, 20 0 1,0 -40,0"
          style={{ translateX: 5, translateY: 5 }}
        />
        <motion.path
          fill="none"
          strokeWidth="2"
          stroke={color}
          d="M14,26 L 22,33 L 35,16"
          strokeDasharray="0 1"
          style={{ pathLength: tickPath }}
        />
        <motion.path
          fill="none"
          strokeWidth="2"
          stroke={color}
          d="M17,17 L33,33"
          strokeDasharray="0 1"
          style={{ pathLength: crossPathA }}
        />
        <motion.path
          fill="none"
          strokeWidth="2"
          stroke={color}
          d="M33,17 L17,33"
          strokeDasharray="0 1"
          style={{ pathLength: crossPathB }}
        />
      </svg>
    </motion.div>
  );
}
