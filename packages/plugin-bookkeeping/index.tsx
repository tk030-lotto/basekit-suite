import React from 'react';

export default function BookkeepingPlugin() {
  return (
    <div style={{ padding: '24px', color: '#f8fafc' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#ec4899' }}>
        複式簿記システム
      </h2>
      <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
        仕訳帳の記入、貸借対照表や損益計算書の自動下書き出力を行う複式簿記プラグインです。
      </p>
      <div style={{
        background: 'rgba(30, 41, 59, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>最近の仕訳履歴 (モック)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ textAlign: 'left', padding: '8px 0' }}>日付</th>
              <th style={{ textAlign: 'left', padding: '8px 0' }}>借方科目</th>
              <th style={{ textAlign: 'right', padding: '8px 0' }}>借方金額</th>
              <th style={{ textAlign: 'left', padding: '8px 0', paddingLeft: '16px' }}>貸方科目</th>
              <th style={{ textAlign: 'right', padding: '8px 0' }}>貸方金額</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '8px 0' }}>2026/07/15</td>
              <td>普通預金</td>
              <td style={{ textAlign: 'right' }}>150,000</td>
              <td style={{ paddingLeft: '16px' }}>売掛金</td>
              <td style={{ textAlign: 'right' }}>150,000</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0' }}>2026/07/15</td>
              <td>旅費交通費</td>
              <td style={{ textAlign: 'right' }}>1,200</td>
              <td style={{ paddingLeft: '16px' }}>現金</td>
              <td style={{ textAlign: 'right' }}>1,200</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
