import { styled } from 'styled-components';
import { FOOTER_HEIGHT } from './constants';

const FooterLink = styled.a`
  :active,
  :focus,
  :visited {
    color: #000;
    text-decoration: none;
  }
  :hover {
    text-decoration: underline;
  }
  font-size: 12px;
  font-weight: bold;
`;

const FooterTitle = styled.span`
  font-size: 12px;
  font-weight: bold;
`;

const FooterWrapper = styled.footer`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  color: #000;
  height: ${FOOTER_HEIGHT};
`;

export { FooterLink, FooterTitle, FooterWrapper };
