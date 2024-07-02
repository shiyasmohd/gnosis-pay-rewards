'use client';
import NavLink from 'next/link';
import styled, { css } from 'styled-components';
import { borderRadiuses, colors } from 'ui/constants';

interface SharedLinkProps {
  label: string;
  title: string;
}

type ExternalLinkProps = SharedLinkProps & {
  href: string;
  target?: string;
  rel?: string;
};

type InternalLinkProps = SharedLinkProps & {
  to: string;
};

export const links: (ExternalLinkProps | InternalLinkProps)[] = [
  {
    label: 'Connect',
    title: 'Connect',
    to: '/connect',
  },
];

export function NavLinksContent() {
  return (
    <StyledNav>
      {links.map((link) => {
        if ('href' in link) {
          return (
            <ExternalLink key={link.label} {...link}>
              {link.label}
            </ExternalLink>
          );
        }

        if ('to' in link) {
          const { to: href, ...linkProps } = link;

          return (
            <InternalLink key={link.label} href={href} {...linkProps}>
              {link.label}
            </InternalLink>
          );
        }

        return null;
      })}
    </StyledNav>
  );
}

const StyledNav = styled.nav`
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
`;

const sharedLinkStyles = css`
  padding: 8px 12px;
  background: transparent;
  border-radius: ${borderRadiuses.xxsmall};
  border-width: 1px;
  border-style: solid;
  border-color: ${colors.white};
  color: ${colors.white};
  transition: all 0.2s ease-in-out;
  &:hover {
    background: ${colors.white};
    color: ${colors.black};
    border-color: ${colors.white};
  }
`;

const ExternalLink = styled.a`
  ${sharedLinkStyles}
`;

const InternalLink = styled(NavLink)`
  ${sharedLinkStyles}
`;
