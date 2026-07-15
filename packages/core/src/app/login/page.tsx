'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'ログインに失敗しました。');
      }

      // Dispatch a custom storage event to update the other layout parts
      window.dispatchEvent(new Event('storage'));
      
      // Redirect to home dashboard
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#090d16',
      backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(56, 189, 248, 0.15) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.15) 0%, transparent 40%)',
      padding: '24px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header Logo */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #ec4899 100%)',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '24px',
            marginBottom: '16px',
            boxShadow: '0 8px 16px rgba(56, 189, 248, 0.25)'
          }}>
            B
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#fff',
            margin: '0 0 8px 0',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #fff 40%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            BaseKit Suite
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
            セキュアな業務プラットフォーム基盤
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              fontSize: '13px',
              lineHeight: '1.4'
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="email" style={{ fontSize: '13px', fontWeight: '500', color: '#cbd5e1' }}>
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@basekit.local"
              required
              disabled={loading}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.border = '1px solid #38bdf8';
                e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid rgba(255, 255, 255, 0.08)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="password" style={{ fontSize: '13px', fontWeight: '500', color: '#cbd5e1' }}>
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.border = '1px solid #38bdf8';
                e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid rgba(255, 255, 255, 0.08)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #ec4899 100%)',
              border: 'none',
              color: '#fff',
              fontWeight: '600',
              fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.2)',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(56, 189, 248, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.2)';
              }
            }}
          >
            {loading ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                  <path d="M12 2C6.47715 2 2 6.47715 2 12C2 13.579 2.368 15.074 3.024 16.417" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                </svg>
                ログイン中...
              </>
            ) : 'ログイン'}
          </button>
        </form>

        {/* Standard Local Credentials Prompt */}
        <div style={{
          padding: '16px',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          fontSize: '12px',
          color: '#64748b',
          lineHeight: '1.5'
        }}>
          <div style={{ fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>🔑 デフォルト認証情報 (ローカル開発用)</div>
          <div>メール: <code style={{ color: '#e2e8f0', background: 'rgba(255,255,255,0.05)', padding: '2px 4px', borderRadius: '4px' }}>admin@basekit.local</code></div>
          <div style={{ marginTop: '2px' }}>パスワード: <code style={{ color: '#e2e8f0', background: 'rgba(255,255,255,0.05)', padding: '2px 4px', borderRadius: '4px' }}>password</code></div>
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#475569' }}>
            ※ システム設定画面から「ログインバイパス」を有効化すると、この画面をスキップできます。
          </div>
        </div>
      </div>
    </div>
  );
}
