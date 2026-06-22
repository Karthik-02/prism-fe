import './globals.css';
import type { Metadata } from 'next';
import { QueryProvider } from '@/components/QueryProvider';

export const metadata: Metadata = {
  title: 'PRism Workspace',
  description: 'A focused release and PR operations workspace backed by the PRism API.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
