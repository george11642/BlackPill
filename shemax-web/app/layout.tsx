import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/context';

export const metadata: Metadata = {
  title: 'SheMax - Glow Up Your Best Self',
  description: 'AI-powered beauty analysis with personalized glow-up tips for women',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="pt-14 min-h-screen flex flex-col">
        <AuthProvider>
          <main className="flex-1">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}

