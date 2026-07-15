import React from 'react';
import './globals.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DisclaimerGate from '../components/DisclaimerGate';

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
        <DisclaimerGate />
        <div className="app-container">
          <Sidebar />
          <div className="main-content">
            <Header />
            <main className="content-body">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
