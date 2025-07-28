import React from 'react';
import './globals.css';
import { NotificationCenter } from '@/components/NotificationCenter';

export const metadata = {
  description: 'MCS',
  title: 'MCS Operations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex items-center gap-4">
          <NotificationCenter />
        </div>
        <main className="w-full">{children}</main>
      </body>
    </html>
  );
}
