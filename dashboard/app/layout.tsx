import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Vortex Control Plane',
  description: 'Optional SaaS dashboard scaffold for the Vortex Bot Template.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#030712', color: '#e2e8f0' }}>
        {children}
      </body>
    </html>
  );
}
