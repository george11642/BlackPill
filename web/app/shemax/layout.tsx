import type { Metadata } from 'next';
import './shemax.css';

export const metadata: Metadata = {
  title: 'SheMax - Glow Up Your Best Self',
  description: 'AI-powered beauty analysis with personalized glow-up tips for women',
};

export default function ShemaxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="shemax-app">{children}</div>;
}
