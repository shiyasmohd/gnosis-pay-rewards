import { styled } from 'styled-components';
import { colors, fontSizes } from '../../constants/constants';

export enum StepStatus {
  DEFAULT = 'default',
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * Step component
 * @todo fix state colors and hover
 */
export const StyledStep = styled.a<{
  $status?: StepStatus;
  $borderBottom?: boolean;
}>(
  ({ $status = StepStatus.DEFAULT, $borderBottom = true }) => `
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  text-align: center;
  padding: 20px 0;
  font-size: ${fontSizes.medium};
  font-weight: bold;
  text-decoration: none;
  color: ${colors.white};
  line-height: 20px;
  ${$borderBottom === true ? '&:not(:last-child) { border-bottom: 2px solid #000; }' : ''}
  ${$status === StepStatus.PENDING ? '/* background: #ffc900; &:hover { background: #ffc900; } */' : ''}
  ${$status === StepStatus.SUCCESS ? '/* background: #1dff72; &:hover { background: #1dff72; } */' : ''}
  ${$status === StepStatus.ERROR ? '/* background: #ff1d1d; &:hover { background: #ff1d1d; } */' : ''}
  `,
);

export const StyledStepInnerLayout = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;
