'use client';

import React, { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [provider, setProvider] = useState<string>('gemini');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [ollamaEndpoint, setOllamaEndpoint] = useState<string>('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState<string>('llama3');
  
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error' | 'loading' | null; message: string }>({ type: null, message: '' });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProvider(localStorage.getItem('basekit_ai_provider') || 'gemini');
      setGeminiApiKey(localStorage.getItem('GEMINI_API_KEY') || '');
      setOllamaEndpoint(localStorage.getItem('OLLAMA_ENDPOINT') || 'http://localhost:11434');
      setOllamaModel(localStorage.getItem('OLLAMA_MODEL') || 'llama3');
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('basekit_ai_provider', provider);
    localStorage.setItem('GEMINI_API_KEY', geminiApiKey);
    localStorage.setItem('OLLAMA_ENDPOINT', ollamaEndpoint);
    localStorage.setItem('OLLAMA_MODEL', ollamaModel);

    setSaveStatus('設定を保存しました。');
    // Dispatch storage event to notify other components (e.g. Dashboard) of settings change
    window.dispatchEvent(new Event('storage'));
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleTestConnection = async () => {
    setTestStatus({ type: 'loading', message: '接続テスト中...' });

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: provider,
          prompt: 'Hello! Respond with exactly "OK" if you can hear me.',
          config: {
            geminiApiKey: geminiApiKey,
            ollamaEndpoint: ollamaEndpoint,
            ollamaModel: ollamaModel,
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setTestStatus({ type: 'success', message: `接続成功! 応答: "${data.text.trim()}"` });
      } else {
        throw new Error(data.error || '不明なエラー');
      }
    } catch (err: any) {
      setTestStatus({ type: 'error', message: `接続失敗: ${err.message}` });
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease-out' }}>
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}>
          システム設定
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          共通コア機能、AIプロバイダ、および動作環境の設定を行います。
        </p>
      </div>

      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          AI Provider (LLM) 設定
        </h2>

        {/* Provider Switcher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: '500', color: '#e2e8f0' }}>使用するAIプロバイダ</label>
          <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
            <label style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: provider === 'gemini' ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${provider === 'gemini' ? 'var(--primary)' : 'rgba(255,255,255,0.08)'}`,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <input
                type="radio"
                name="ai_provider"
                value="gemini"
                checked={provider === 'gemini'}
                onChange={() => setProvider('gemini')}
                style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ fontWeight: '600', color: '#fff' }}>Google Gemini</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>個人APIキー（無料枠）で動作</div>
              </div>
            </label>

            <label style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: provider === 'ollama' ? 'rgba(236, 72, 153, 0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${provider === 'ollama' ? 'var(--accent)' : 'rgba(255,255,255,0.08)'}`,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <input
                type="radio"
                name="ai_provider"
                value="ollama"
                checked={provider === 'ollama'}
                onChange={() => setProvider('ollama')}
                style={{ accentColor: 'var(--accent)', width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ fontWeight: '600', color: '#fff' }}>Ollama</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ローカルPCで動く無料のLLMサーバー</div>
              </div>
            </label>
          </div>
        </div>

        {/* Gemini Options */}
        {provider === 'gemini' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="gemini-key" style={{ fontSize: '14px', color: '#cbd5e1' }}>Gemini API キー</label>
              <input
                id="gemini-key"
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AI Studioから取得したAPIキーを入力"
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                キーはブラウザのlocalStorageにローカル保存され、外部サーバーに漏洩しません。
              </p>
            </div>
          </div>
        )}

        {/* Ollama Options */}
        {provider === 'ollama' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="ollama-endpoint" style={{ fontSize: '14px', color: '#cbd5e1' }}>エンドポイントURL</label>
                <input
                  id="ollama-endpoint"
                  type="text"
                  value={ollamaEndpoint}
                  onChange={(e) => setOllamaEndpoint(e.target.value)}
                  placeholder="http://localhost:11434"
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="ollama-model" style={{ fontSize: '14px', color: '#cbd5e1' }}>使用モデル名</label>
                <input
                  id="ollama-model"
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  placeholder="llama3, phi3, mistralなど"
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              ローカルで <code>ollama run &lt;モデル名&gt;</code> が実行されている必要があります。また、CORSエラーを防ぐために <code>OLLAMA_ORIGINS=&quot;*&quot;</code> の環境変数を設定してOllamaを起動してください。
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <button
            onClick={handleTestConnection}
            style={{
              padding: '10px 18px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            接続テスト
          </button>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {saveStatus && (
              <span style={{ color: 'var(--success)', fontSize: '14px', fontWeight: '500' }}>
                {saveStatus}
              </span>
            )}
            <button onClick={handleSave} className="btn-primary" style={{ padding: '10px 24px', fontSize: '14px' }}>
              設定を保存
            </button>
          </div>
        </div>

        {/* Test Result Display */}
        {testStatus.type && (
          <div style={{
            padding: '14px',
            borderRadius: '6px',
            backgroundColor: testStatus.type === 'loading' ? 'rgba(255,255,255,0.03)' :
                             testStatus.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${
              testStatus.type === 'loading' ? 'rgba(255,255,255,0.1)' :
              testStatus.type === 'success' ? 'var(--success)' : '#ef4444'
            }`,
            fontSize: '13px',
            color: testStatus.type === 'success' ? '#10b981' : testStatus.type === 'error' ? '#f87171' : '#fff'
          }}>
            {testStatus.message}
          </div>
        )}
      </div>
    </div>
  );
}
