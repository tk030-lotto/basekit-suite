import React from 'react';

export default function PersonalOpsPlugin() {
  return (
    <div style={{ padding: '24px', color: '#f8fafc' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#38bdf8' }}>
        個人業務効率化ツール
      </h2>
      <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
        日々のタスク管理、工数トラッキングを自動化する個人向け業務効率化スペースです。
      </p>
      <div style={{
        background: 'rgba(30, 41, 59, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>タスク進捗状況 (モック)</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            ✅ 提案資料の作成 (完了)
          </li>
          <li style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            ⏳ 週報の提出 (進行中)
          </li>
          <li style={{ padding: '8px 0' }}>
            📅 クライアントミーティング (予定)
          </li>
        </ul>
      </div>
    </div>
  );
}
