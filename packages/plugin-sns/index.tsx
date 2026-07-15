import React from 'react';

export default function SnsPlugin() {
  return (
    <div style={{ padding: '24px', color: '#f8fafc' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#10b981' }}>
        業務用SNSシステム
      </h2>
      <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
        組織内の非同期コミュニケーションやトピックごとのスレッド共有を行う社内SNSプラグインです。
      </p>
      <div style={{
        background: 'rgba(30, 41, 59, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>最新のスレッド (モック)</h3>
        <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <strong style={{ display: 'block', marginBottom: '4px' }}># 2026年度 下期開発方針について</strong>
          <span style={{ fontSize: '12px', color: '#64748b' }}>投稿者: 管理者 • 1時間前</span>
        </div>
        <div style={{ padding: '12px 0' }}>
          <strong style={{ display: 'block', marginBottom: '4px' }}># 新しい複式簿記プラグインの利用手順</strong>
          <span style={{ fontSize: '12px', color: '#64748b' }}>投稿者: 経理アシスタント • 昨日</span>
        </div>
      </div>
    </div>
  );
}
