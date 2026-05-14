import { Mulish } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/ThemeProvider';
import PageAnimate from '@/components/PageAnimate';
import './globals.css';

const mulish = Mulish({ subsets: ['latin'], display: 'swap' });

export const metadata = { 
  title: 'Signl — AI Career Intelligence Platform', 
  description: 'Turn job rejections into data. Signl uses AI to analyze resumes, conduct mock interviews, match jobs, and accelerate your career.' 
};

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
