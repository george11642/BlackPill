import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Black Pill - Be Honest About Yourself',
  description: 'AI-powered attractiveness analysis with actionable self-improvement tips',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

