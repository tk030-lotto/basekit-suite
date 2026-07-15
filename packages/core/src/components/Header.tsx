'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isBypassed, setIsBypassed] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUserEmail(data.user.email);
          setIsBypassed(!!data.bypassed);
        } else {
          setUserEmail(null);
          setIsBypassed(false);
        }
      }
    } catch (e) {
      console.error('[Header] Failed to fetch session:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    // Listen for custom settings storage events (e.g. when settings are saved)
    window.addEventListener('storage', fetchSession);
    return () => {
      window.removeEventListener('storage', fetchSession);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/login';
      }
    } catch (e) {
      console.error('[Header] Logout failed:', e);
    }
  };

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
        {isBypassed && (
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

        <Link
          href="/settings"
          style={{
            fontSize: '12px',
            backgroundColor: 'transparent',
            color: '#cbd5e1',
            border: '1px solid #334155',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--primary)';
            e.currentTarget.style.borderColor = 'var(--primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#cbd5e1';
            e.currentTarget.style.borderColor = '#334155';
          }}
        >
          ⚙️ 設定
        </Link>

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

        {!isBypassed && userEmail && (
          <button
            onClick={handleLogout}
            style={{
              fontSize: '12px',
              backgroundColor: 'transparent',
              color: '#cbd5e1',
              border: '1px solid #334155',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.borderColor = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#cbd5e1';
              e.currentTarget.style.borderColor = '#334155';
            }}
          >
            🚪 ログアウト
          </button>
        )}

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
            {isBypassed ? 'A' : (userEmail ? userEmail.charAt(0).toUpperCase() : 'U')}
          </div>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>
            {isBypassed ? 'Administrator' : (userEmail || 'User')}
          </span>
        </div>
      </div>
    </header>
  );
}
