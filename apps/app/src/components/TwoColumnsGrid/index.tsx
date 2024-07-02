import styled from 'styled-components';
import { fontSizes } from 'ui/constants';

export const TwoColumnsGrid = styled.div<{
  $marginBottom?: string;
  $fontSize?: (typeof fontSizes)[keyof typeof fontSizes];
  $flexFill?: boolean;
}>(
  (props) => `
  font-size: ${props.$fontSize || fontSizes.small};
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: ${props.$marginBottom || '0px'};
  > .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    // padding: 10px 0;
    gap: 10px;
  }
  > .row > strong {
    text-align: right;
  }
  ${props.$flexFill ? 'flex: 1;' : ''}
`,
);
