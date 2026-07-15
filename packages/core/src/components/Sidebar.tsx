'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { registeredPlugins } from '../lib/plugins';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      width: 'var(--sidebar-width)',
      backgroundColor: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--card-border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 101
    }}>
      <div style={{
        height: 'var(--header-height)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        borderBottom: '1px solid var(--card-border)'
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '18px'
          }}>
            B
          </div>
          <span style={{
            fontSize: '18px',
            fontWeight: 'bold',
            background: 'var(--primary-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            BaseKit Suite
          </span>
        </Link>
      </div>

      <nav style={{ flexGrow: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          fontSize: '14px',
          fontWeight: '500',
          color: pathname === '/' ? 'var(--primary)' : '#94a3b8',
          backgroundColor: pathname === '/' ? 'var(--sidebar-active)' : 'transparent',
          transition: 'var(--transition-smooth)'
        }}>
          🏠 ポータルホーム
        </Link>

        <div style={{ margin: '16px 0 8px 16px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          業務プラグイン
        </div>

        {registeredPlugins.map((plugin) => {
          const isActive = pathname === plugin.meta.route;
          return (
            <Link key={plugin.meta.id} href={plugin.meta.route} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              fontWeight: '500',
              color: isActive ? 'var(--primary)' : '#94a3b8',
              backgroundColor: isActive ? 'var(--sidebar-active)' : 'transparent',
              transition: 'var(--transition-smooth)'
            }}>
              <span>
                {plugin.meta.icon === 'cog' && '⚙️ '}
                {plugin.meta.icon === 'book' && '📖 '}
                {plugin.meta.icon === 'chat' && '💬 '}
                {plugin.meta.name}
              </span>
              {plugin.meta.enabled && (
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--success)'
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '24px', borderTop: '1px solid var(--card-border)' }}>
        <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
          © 2026 BaseKit Project
        </div>
      </div>
    </aside>
  );
}
