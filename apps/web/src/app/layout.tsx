import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans', // keep the CSS variable name consistent
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Scholentra',
    template: '%s | Scholentra',
  },
  description:
    'Scholentra — Professional school management platform for modern educational institutions.',
  keywords: ['school management', 'SaaS', 'education', 'attendance', 'finance'],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
