import { ExternalLink as ExternalLinkIcon } from 'react-feather';
import NavLink from 'next/link';

const navLinks: { to: string; title: string; label: string; isExternal?: boolean }[] = [
  { to: '/faqs', title: `FAQ's`, label: 'FAQs' },
];

export function NavbarLinks() {
  return (
    <>
      {navLinks.map((link) => {
        if (link.isExternal) {
          return (
            <a key={link.to} href={link.to} title={link.title} target="_blank" rel="noreferrer">
              {link.label}
              <ExternalLinkIcon size={12} style={{ marginLeft: '4px' }} />
            </a>
          );
        }

        return (
          <NavLink key={link.to} href={link.to} title={link.title}>
            {link.label}
          </NavLink>
        );
      })}
    </>
  );
}
