import { Mulish } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/ThemeProvider';
import PageAnimate from '@/components/PageAnimate';
import './globals.css';

const mulish = Mulish({ subsets: ['latin'], display: 'swap' });

export const metadata = { title: 'Signl', description: 'Job Rejection Pattern Analyser' };

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={mulish.className}>
          <ThemeProvider>
            <PageAnimate>
              {children}
            </PageAnimate>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
