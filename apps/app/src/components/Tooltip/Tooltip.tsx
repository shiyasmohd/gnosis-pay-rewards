import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
} from '@floating-ui/react';
import { PropsWithChildren, ReactNode, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';
import { TooltipIcon, HelpCircle } from './TooltipIcon';
import { borderRadiuses, colors } from 'ui/constants';

type Placement = 'top' | 'right' | 'bottom' | 'left';

type IconType = 'question' | 'info' | 'warning' | 'error';

export type TooltipProps = PropsWithChildren<{
  content: ReactNode;
  showDelay?: number;
  hideDelay?: number;
  placement?: Placement;
  contentAlignment?: 'center' | 'left' | 'right';
  icon?: IconType;
}>;

export function Tooltip({ content, children, icon = 'question', contentAlignment = 'center' }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top',
    // Make sure the tooltip stays on the screen
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(5),
      flip({
        fallbackAxisSideDirection: 'start',
      }),
      shift(),
    ],
  });

  // Event listeners to change the open state
  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  // Role props for screen readers
  const role = useRole(context, { role: 'tooltip' });

  // Merge all the interactions into prop getters
  const { getReferenceProps } = useInteractions([hover, focus, dismiss, role]);

  return (
    <motion.span
      style={{
        position: 'relative',
      }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      ref={refs.setReference}
      {...getReferenceProps()}
    >
      {icon && !children ? (
        <StyledFlex>
          <DefaultTooltipChildren icon={icon} />
        </StyledFlex>
      ) : (
        <StyledSpan>{children}</StyledSpan>
      )}
      <AnimatePresence>
        {isOpen ? (
          <MotionTooltipContent
            $contentAlignment={contentAlignment}
            ref={refs.setFloating}
            style={floatingStyles}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
          >
            {content}
          </MotionTooltipContent>
        ) : null}
      </AnimatePresence>
    </motion.span>
  );
}

const DefaultTooltipChildren = ({ icon }: { icon: IconType }) => {
  switch (icon) {
    case 'question':
      return <TooltipIcon />;
    case 'info':
      return <HelpCircle />;
    default:
      return null;
  }
};

const MotionTooltipContent = styled(motion.div)<{
  $contentAlignment: 'center' | 'left' | 'right';
}>(
  (props) => `
  background: ${colors.black};
  color: ${colors.white};
  position: absolute;
  z-index: 2;
  border-radius: ${borderRadiuses.xsmall};
  box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 8px 12px;
  min-width: 250px;
  max-width: 500px;
  text-align: ${props.$contentAlignment};
  word-break: break-word;
  font-weight: 500;
`,
);

const StyledFlex = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledSpan = styled.span`
  text-decoration: dotted underline;
  cursor: help;
`;
