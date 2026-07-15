import React from 'react';
import './globals.css';
import AppLayout from '../components/AppLayout';

export const metadata = {
  title: 'BaseKit Suite Portal',
  description: 'Thin core business platform with pluggable modules and cost-free operation design.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
