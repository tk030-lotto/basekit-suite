'use client';

import React from 'react';

export default function Header() {
  const isAuthBypassed = process.env.NEXT_PUBLIC_DISABLE_AUTH !== 'false';

  const resetConsent = () => {
    localStorage.removeItem('basekit_disclaimer_accepted');
    window.location.reload();
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 'var(--sidebar-width)',
      right: 0,
      height: 'var(--header-height)',
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid var(--card-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 100
    }}>
      <div>
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>BaseKit Suite Portal</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isAuthBypassed && (
          <span style={{
            fontSize: '12px',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            color: 'var(--primary)',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid rgba(56, 189, 248, 0.2)'
          }}>
            🔑 AUTH BYPASS (ADMIN)
          </span>
        )}

        <button
          onClick={resetConsent}
          style={{
            fontSize: '12px',
            backgroundColor: 'transparent',
            color: '#64748b',
            border: '1px solid #334155',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#f43f5e';
            e.currentTarget.style.borderColor = '#f43f5e';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.borderColor = '#334155';
          }}
        >
          免責再表示
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#fff'
          }}>
            A
          </div>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Administrator</span>
        </div>
      </div>
    </header>
  );
}
