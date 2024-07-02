import { Inter as FontSans } from 'next/font/google';
import { PropsWithChildren } from 'react';
import { Providers } from './providers';
import { StyledComponentsRegistry } from '../lib/registry';
import { getPageTitle } from 'utils/getPageTitle';
import { cn } from '@/lib/utils';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'ui/ThemeProvider';

export const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata = {
  title: getPageTitle('Home'),
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="image" content="assets/images/favicon.png" />
        <link rel="icon" href="assets/images/favicon.png" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        <StyledComponentsRegistry>
          <ThemeProvider>
            <Providers>{children}</Providers>
          </ThemeProvider>
          <Toaster />
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
