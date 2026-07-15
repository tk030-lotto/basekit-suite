'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <main style={{ width: '100%', minHeight: '100vh' }}>{children}</main>;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="content-body">
          {children}
        </main>
      </div>
    </div>
  );
}
