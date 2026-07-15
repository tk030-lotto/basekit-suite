'use client';

import React, { useState, useEffect } from 'react';

export default function DisclaimerGate() {
  const [accepted, setAccepted] = useState<boolean>(true); // default to true to prevent flash, then update in useEffect
  const [checked, setChecked] = useState<boolean>(false);

  useEffect(() => {
    const isAccepted = localStorage.getItem('basekit_disclaimer_accepted');
    if (isAccepted === 'true') {
      setAccepted(true);
    } else {
      setAccepted(false);
    }
  }, []);

  const handleAccept = () => {
    if (checked) {
      localStorage.setItem('basekit_disclaimer_accepted', 'true');
      setAccepted(true);
    }
  };

  if (accepted) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#090d16',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div style={{
        maxWidth: '700px',
        width: '100%',
        backgroundColor: '#1e293b',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        animation: 'fadeIn 0.5s ease-out'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            法的免責同意 ＆ MITライセンス同意
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            BaseKit Suiteの利用を開始する前に、以下の規約および免責事項をご確認の上、同意してください。
          </p>
        </div>

        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          padding: '20px',
          height: '280px',
          overflowY: 'scroll',
          fontSize: '13px',
          lineHeight: '1.6',
          color: '#cbd5e1',
          marginBottom: '24px',
          fontFamily: 'monospace'
        }}>
          <h3 style={{ color: '#38bdf8', marginBottom: '12px', fontSize: '15px' }}>MIT License</h3>
          <p style={{ marginBottom: '16px' }}>
            Copyright (c) 2026 BaseKit Project Authors
          </p>
          <p style={{ marginBottom: '16px' }}>
            Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the &quot;Software&quot;), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
          </p>
          <p style={{ marginBottom: '16px' }}>
            The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
          </p>
          <p style={{ marginBottom: '16px', fontWeight: 'bold', color: '#f43f5e' }}>
            THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
          </p>
          
          <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />

          <h3 style={{ color: '#38bdf8', marginBottom: '12px', fontSize: '15px' }}>法的自己防衛および免責事項</h3>
          <p style={{ marginBottom: '12px' }}>
            1. 本ソフトウェアはオープンソースソフトウェアであり、現状有姿のまま提供されます。開発者および著作権者は、本ソフトウェアの使用または不使用から生じるいかなる直接的・間接的な損害（データの損失、業務の中断、財産的損失等）についても一切の責任を負いません。
          </p>
          <p style={{ marginBottom: '12px' }}>
            2. 特に複式簿記プラグインによる決算書類の下書き出力、個人業務効率化による工数計算、SNSプラグインによる情報共有については、最終的な信頼性と法的な正当性を含め、ユーザーの自己責任において検証・管理するものとします。
          </p>
          <p>
            3. 本システムは個人利用の簡便化のために「認証を完全にバイパスする機能（NEXT_PUBLIC_DISABLE_AUTH=true）」を提供しますが、これを有効にして公開ネットワーク上で実行した場合、第三者へのデータ露出リスクが生じます。この設定のセキュリティ責任は運用者に帰属します。
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <input
            type="checkbox"
            id="agree-checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer',
              accentColor: '#38bdf8'
            }}
          />
          <label
            htmlFor="agree-checkbox"
            style={{
              fontSize: '14px',
              color: '#e2e8f0',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            MITライセンス条項および法的免責事項に同意します
          </label>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleAccept}
            disabled={!checked}
            className="btn-primary"
            style={{
              padding: '12px 32px',
              fontSize: '15px',
              fontWeight: '600',
              opacity: checked ? 1 : 0.5,
              cursor: checked ? 'pointer' : 'not-allowed',
              width: '100%',
              borderRadius: '8px'
            }}
          >
            BaseKit Suiteの利用を開始する
          </button>
        </div>
      </div>
    </div>
  );
}
