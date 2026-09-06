import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: 'Trợ Lý AI Bài Giảng KHTN GDPT 2018',
  description: 'Ứng dụng hỗ trợ giáo viên biên soạn bài giảng Khoa học tự nhiên',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 antialiased min-h-screen transition-colors duration-200`}
      >
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </NextThemesProvider>
      </body>
    </html>
  );
}