import { styled } from 'styled-components';

export function BurgerIcon({ color = 'black' }: { color?: string }) {
  return (
    <StyledSVG $color={color} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6H21" stroke="white" strokeWidth="2" />
      <path d="M3 12H21" stroke="white" strokeWidth="2" />
      <path d="M3 18H21" stroke="white" strokeWidth="2" />
    </StyledSVG>
  );
}

const StyledSVG = styled.svg<{
  $color?: string;
}>(
  (props) => `
    & > path {
        stroke: ${props.$color};
    }
`,
);
