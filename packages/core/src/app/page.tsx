'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { registeredPlugins } from '../lib/plugins';

export default function DashboardPage() {
  const [dbMode, setDbMode] = useState<string>('Loading...');
  const [aiStatus, setAiStatus] = useState<string>('Not Configured');

  const updateAiStatus = () => {
    if (typeof window !== 'undefined') {
      const provider = localStorage.getItem('basekit_ai_provider') || 'gemini';
      if (provider === 'ollama') {
        const model = localStorage.getItem('OLLAMA_MODEL') || 'llama3';
        setAiStatus(`Ollama (${model})`);
      } else {
        const hasKey = !!localStorage.getItem('GEMINI_API_KEY');
        setAiStatus(hasKey ? 'Gemini 1.5 Flash (Active)' : 'Gemini 1.5 Flash (Key Not Set)');
      }
      
      const connType = localStorage.getItem('basekit_db_type') || 'LocalStorage (Browser)';
      setDbMode(connType);
    }
  };

  useEffect(() => {
    updateAiStatus();
    
    // Listen for custom settings storage events
    window.addEventListener('storage', updateAiStatus);
    return () => {
      window.removeEventListener('storage', updateAiStatus);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}>
          ポータルダッシュボード
        </h1>
        <p style={{ color: '#94a3b8' }}>
          BaseKit Suiteの統合管理および各プラグインの状態表示を行います。
        </p>
      </div>

      {/* Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px'
      }}>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>
            データベース接続ステータス
          </span>
          <span style={{ fontSize: '20px', fontWeight: '600', color: 'var(--primary)' }}>
            {dbMode}
          </span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            環境設定に基づいて自動的に切り替わります。
          </span>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>
            共通AI Provider (LLM)
          </span>
          <span style={{ fontSize: '20px', fontWeight: '600', color: '#10b981' }}>
            {aiStatus}
          </span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            利用者の独自無料キーによる0円運用に対応。
          </span>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>
            マウント済みプラグイン
          </span>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)' }}>
            {registeredPlugins.length} / 3 件
          </span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            manifest.ts に基づき動的にマウントされています。
          </span>
        </div>
      </div>

      {/* Plugins Grid */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '16px', color: '#fff' }}>
          搭載プラグイン一覧
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {registeredPlugins.map((plugin) => (
            <div key={plugin.meta.id} className="glass-panel" style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
                    {plugin.meta.name}
                  </h3>
                  <span style={{
                    fontSize: '11px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    color: '#94a3b8',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    {plugin.meta.category}
                  </span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' }}>
                  {plugin.meta.id === 'plugin-personal-ops' && 'タスク管理と作業進捗工数トラッキングをローカル完結で管理。'}
                  {plugin.meta.id === 'plugin-bookkeeping' && '簡易仕訳の作成から貸借対照表などの会計書類下書きを自動出力。'}
                  {plugin.meta.id === 'plugin-sns' && 'スレッド投稿と非同期イベントによるメンション・PluginBus相互連携。'}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '13px',
                  color: plugin.meta.enabled ? '#10b981' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: plugin.meta.enabled ? '#10b981' : '#64748b'
                  }} />
                  {plugin.meta.enabled ? '有効' : '無効'}
                </span>

                <Link href={plugin.meta.route}>
                  <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                    開く →
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
