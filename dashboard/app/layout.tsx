import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Vortex Control Plane',
  description: 'Optional SaaS dashboard scaffold for the Vortex Bot Template.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn('dark min-h-screen font-sans antialiased', geist.variable)}>
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}
