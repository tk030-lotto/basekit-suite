'use client';

import React, { useState, useEffect } from 'react';

export default function SettingsPage() {
  // AI Settings States
  const [provider, setProvider] = useState<string>('gemini');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [ollamaEndpoint, setOllamaEndpoint] = useState<string>('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState<string>('llama3');
  
  // Database Settings States
  const [dbProvider, setDbProvider] = useState<string>('localstorage');
  const [postgresHost, setPostgresHost] = useState<string>('localhost');
  const [postgresPort, setPostgresPort] = useState<string>('5432');
  const [postgresDatabase, setPostgresDatabase] = useState<string>('postgres');
  const [postgresUser, setPostgresUser] = useState<string>('postgres');
  const [postgresPassword, setPostgresPassword] = useState<string>('');
  const [postgresSsl, setPostgresSsl] = useState<boolean>(false);

  // Auth Settings States
  const [bypassAuth, setBypassAuth] = useState<boolean>(true);
  const [isEnvBypassOverridden, setIsEnvBypassOverridden] = useState<boolean>(false);
  const [envBypassValue, setEnvBypassValue] = useState<boolean>(true);

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error' | 'loading' | null; message: string }>({ type: null, message: '' });
  const [dbTestStatus, setDbTestStatus] = useState<{ type: 'success' | 'error' | 'loading' | null; message: string }>({ type: null, message: '' });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load Auth Settings
      const envVal = process.env.NEXT_PUBLIC_DISABLE_AUTH;
      const isOverridden = envVal !== undefined && envVal !== '';
      setIsEnvBypassOverridden(isOverridden);

      if (isOverridden) {
        setBypassAuth(envVal === 'true');
        setEnvBypassValue(envVal === 'true');
      } else {
        const storedBypass = localStorage.getItem('basekit_bypass_auth');
        setBypassAuth(storedBypass !== 'false'); // default to true
      }

      // Load AI Settings
      setProvider(localStorage.getItem('basekit_ai_provider') || 'gemini');
      setGeminiApiKey(localStorage.getItem('GEMINI_API_KEY') || '');
      setOllamaEndpoint(localStorage.getItem('OLLAMA_ENDPOINT') || 'http://localhost:11434');
      setOllamaModel(localStorage.getItem('OLLAMA_MODEL') || 'llama3');

      // Load DB Settings
      setDbProvider(localStorage.getItem('basekit_db_provider') || 'localstorage');
      setPostgresHost(localStorage.getItem('basekit_db_postgres_host') || 'localhost');
      setPostgresPort(localStorage.getItem('basekit_db_postgres_port') || '5432');
      setPostgresDatabase(localStorage.getItem('basekit_db_postgres_database') || 'postgres');
      setPostgresUser(localStorage.getItem('basekit_db_postgres_user') || 'postgres');
      setPostgresPassword(localStorage.getItem('basekit_db_postgres_password') || '');
      setPostgresSsl(localStorage.getItem('basekit_db_postgres_ssl') === 'true');
    }
  }, []);

  const handleSave = () => {
    // Save Auth Settings
    if (!isEnvBypassOverridden) {
      localStorage.setItem('basekit_bypass_auth', bypassAuth ? 'true' : 'false');
      // Set session cookie bypass flag for Next.js middleware
      document.cookie = `basekit_bypass_auth=${bypassAuth ? 'true' : 'false'}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }

    // Save AI Settings
    localStorage.setItem('basekit_ai_provider', provider);
    localStorage.setItem('GEMINI_API_KEY', geminiApiKey);
    localStorage.setItem('OLLAMA_ENDPOINT', ollamaEndpoint);
    localStorage.setItem('OLLAMA_MODEL', ollamaModel);

    // Save DB Settings
    localStorage.setItem('basekit_db_provider', dbProvider);
    localStorage.setItem('basekit_db_postgres_host', postgresHost);
    localStorage.setItem('basekit_db_postgres_port', postgresPort);
    localStorage.setItem('basekit_db_postgres_database', postgresDatabase);
    localStorage.setItem('basekit_db_postgres_user', postgresUser);
    localStorage.setItem('basekit_db_postgres_password', postgresPassword);
    localStorage.setItem('basekit_db_postgres_ssl', postgresSsl ? 'true' : 'false');

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

  const handleTestDbConnection = async () => {
    setDbTestStatus({ type: 'loading', message: 'データベース接続テスト中...' });

    try {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test',
          config: {
            host: postgresHost,
            port: parseInt(postgresPort, 10),
            database: postgresDatabase,
            user: postgresUser,
            password: postgresPassword,
            ssl: postgresSsl
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setDbTestStatus({ type: 'success', message: `データベース接続成功! (${data.message})` });
      } else {
        throw new Error(data.error || '疎通エラー');
      }
    } catch (err: any) {
      setDbTestStatus({ type: 'error', message: `データベース接続失敗: ${err.message}` });
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease-out' }}>
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}>
          システム設定
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          共通コア機能、AIプロバイダ、および動作データベース環境の設定を行います。
        </p>
      </div>

      {/* AI Provider Section */}
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

      {/* Database Section */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          データベース設定
        </h2>

        {/* Database Provider Switcher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: '500', color: '#e2e8f0' }}>使用するデータベースプロバイダ</label>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
            <label style={{
              flex: '1 1 200px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: dbProvider === 'localstorage' ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${dbProvider === 'localstorage' ? 'var(--primary)' : 'rgba(255,255,255,0.08)'}`,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <input
                type="radio"
                name="db_provider"
                value="localstorage"
                checked={dbProvider === 'localstorage'}
                onChange={() => setDbProvider('localstorage')}
                style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ fontWeight: '600', color: '#fff' }}>LocalStorage</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ブラウザ内部にデータを保存 (0円)</div>
              </div>
            </label>

            <label style={{
              flex: '1 1 200px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: dbProvider === 'mock-postgres' ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${dbProvider === 'mock-postgres' ? '#a855f7' : 'rgba(255,255,255,0.08)'}`,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <input
                type="radio"
                name="db_provider"
                value="mock-postgres"
                checked={dbProvider === 'mock-postgres'}
                onChange={() => setDbProvider('mock-postgres')}
                style={{ accentColor: '#a855f7', width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ fontWeight: '600', color: '#fff' }}>Mock PostgreSQL</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ブラウザ内でのSQL擬似シミュレーション</div>
              </div>
            </label>

            <label style={{
              flex: '1 1 200px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: dbProvider === 'postgres' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${dbProvider === 'postgres' ? 'var(--success)' : 'rgba(255,255,255,0.08)'}`,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <input
                type="radio"
                name="db_provider"
                value="postgres"
                checked={dbProvider === 'postgres'}
                onChange={() => setDbProvider('postgres')}
                style={{ accentColor: 'var(--success)', width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ fontWeight: '600', color: '#fff' }}>PostgreSQL</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>外部の本格的なRDBサーバーに接続</div>
              </div>
            </label>
          </div>
        </div>

        {/* PostgreSQL Configuration Fields */}
        {dbProvider === 'postgres' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="pg-host" style={{ fontSize: '14px', color: '#cbd5e1' }}>ホスト (Host)</label>
                <input
                  id="pg-host"
                  type="text"
                  value={postgresHost}
                  onChange={(e) => setPostgresHost(e.target.value)}
                  placeholder="localhost or db.supabase.co"
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
                <label htmlFor="pg-port" style={{ fontSize: '14px', color: '#cbd5e1' }}>ポート (Port)</label>
                <input
                  id="pg-port"
                  type="text"
                  value={postgresPort}
                  onChange={(e) => setPostgresPort(e.target.value)}
                  placeholder="5432"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="pg-database" style={{ fontSize: '14px', color: '#cbd5e1' }}>データベース名 (Database)</label>
                <input
                  id="pg-database"
                  type="text"
                  value={postgresDatabase}
                  onChange={(e) => setPostgresDatabase(e.target.value)}
                  placeholder="postgres"
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
                <label htmlFor="pg-user" style={{ fontSize: '14px', color: '#cbd5e1' }}>ユーザー名 (Username)</label>
                <input
                  id="pg-user"
                  type="text"
                  value={postgresUser}
                  onChange={(e) => setPostgresUser(e.target.value)}
                  placeholder="postgres"
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="pg-password" style={{ fontSize: '14px', color: '#cbd5e1' }}>パスワード (Password)</label>
              <input
                id="pg-password"
                type="password"
                value={postgresPassword}
                onChange={(e) => setPostgresPassword(e.target.value)}
                placeholder="データベースパスワード"
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
              <input
                id="pg-ssl"
                type="checkbox"
                checked={postgresSsl}
                onChange={(e) => setPostgresSsl(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--success)' }}
              />
              <label htmlFor="pg-ssl" style={{ fontSize: '14px', color: '#cbd5e1', cursor: 'pointer' }}>
                SSL接続を有効化（Supabase / Neon 接続時などは通常有効化）
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons for DB */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <div>
            {dbProvider === 'postgres' && (
              <button
                onClick={handleTestDbConnection}
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
                DB接続テスト
              </button>
            )}
          </div>
        </div>

        {/* DB Test Result Display */}
        {dbTestStatus.type && (
          <div style={{
            padding: '14px',
            borderRadius: '6px',
            backgroundColor: dbTestStatus.type === 'loading' ? 'rgba(255,255,255,0.03)' :
                             dbTestStatus.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${
              dbTestStatus.type === 'loading' ? 'rgba(255,255,255,0.1)' :
              dbTestStatus.type === 'success' ? 'var(--success)' : '#ef4444'
            }`,
            fontSize: '13px',
            color: dbTestStatus.type === 'success' ? '#10b981' : dbTestStatus.type === 'error' ? '#f87171' : '#fff'
          }}>
            {dbTestStatus.message}
          </div>
        )}
      </div>

      {/* Auth Settings Section */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          認証・セキュリティ設定
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.01)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
            <div>
              <div style={{ fontWeight: '600', color: '#fff', marginBottom: '4px' }}>ログインバイパス (Login Bypass)</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                有効にすると、ログイン画面を自動でスキップし、管理者権限（ADMIN）として直接ポータルに入ります。
              </div>
            </div>
            <div style={{ position: 'relative', width: '44px', height: '24px' }}>
              <input
                type="checkbox"
                id="auth-bypass-toggle"
                checked={bypassAuth}
                disabled={isEnvBypassOverridden}
                onChange={(e) => setBypassAuth(e.target.checked)}
                style={{
                  width: '44px',
                  height: '24px',
                  appearance: 'none',
                  backgroundColor: bypassAuth ? 'var(--primary)' : '#475569',
                  borderRadius: '12px',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  outline: 'none',
                  cursor: isEnvBypassOverridden ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  opacity: isEnvBypassOverridden ? 0.6 : 1,
                  margin: 0
                }}
              />
              <span style={{
                position: 'absolute',
                top: '2px',
                left: bypassAuth ? '22px' : '2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                pointerEvents: 'none',
                transition: 'left 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </div>
          </div>

          {isEnvBypassOverridden && (
            <div style={{
              marginTop: '8px',
              padding: '12px 16px',
              borderRadius: '6px',
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.15)',
              color: 'var(--primary)',
              fontSize: '12px'
            }}>
              ℹ️ 環境変数 <code>NEXT_PUBLIC_DISABLE_AUTH={envBypassValue ? 'true' : 'false'}</code> が設定されているため、UIからの変更は無効化されています。
            </div>
          )}
        </div>
      </div>

      {/* Save Settings Bar */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', padding: '16px 24px' }}>
        {saveStatus && (
          <span style={{ color: 'var(--success)', fontSize: '14px', fontWeight: '500' }}>
            {saveStatus}
          </span>
        )}
        <button onClick={handleSave} className="btn-primary" style={{ padding: '10px 24px', fontSize: '14px' }}>
          すべての設定を保存
        </button>
      </div>
    </div>
  );
}
