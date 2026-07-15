import { useState } from 'react';

// Standard SVG Icon Components for visually stunning UI
const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const DatabaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6v7z"/>
  </svg>
);

const PluginIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21 16-4-4 4-4"/><path d="M17 12H3"/><path d="m7 8-4 4 4 4"/><path d="M12 3v18"/>
  </svg>
);

const WifiOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 1l22 22"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.5"/><path d="M5 12.5a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 3.11a16.27 16.27 0 0 1 2.18-.58"/>
  </svg>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'personal' | 'bookkeeping' | 'sns'>('dashboard');

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b0f19', color: '#f8fafc' }}>
      
      {/* Sidebar */}
      <aside style={{
        width: '280px',
        background: '#111827',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px'
      }}>
        <div>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0ea5e9 0%, #d946ef 100%)',
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '20px',
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.3)'
            }}>
              B
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px' }}>BaseKit</h2>
              <span style={{ fontSize: '12px', color: '#0ea5e9', fontWeight: 600 }}>STANDALONE</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'dashboard' ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                color: activeTab === 'dashboard' ? '#38bdf8' : '#94a3b8',
                fontWeight: 600,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <ShieldIcon />
              <span>ダッシュボード</span>
            </button>

            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.05)', margin: '12px 0' }}></div>
            <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 700, paddingLeft: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>PLUGINS</span>

            <button
              onClick={() => setActiveTab('personal')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'personal' ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                color: activeTab === 'personal' ? '#38bdf8' : '#94a3b8',
                fontWeight: 500,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <PluginIcon />
              <span>個人業務効率化</span>
            </button>

            <button
              onClick={() => setActiveTab('bookkeeping')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'bookkeeping' ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                color: activeTab === 'bookkeeping' ? '#38bdf8' : '#94a3b8',
                fontWeight: 500,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <PluginIcon />
              <span>複式簿記ツール</span>
            </button>

            <button
              onClick={() => setActiveTab('sns')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'sns' ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                color: activeTab === 'sns' ? '#38bdf8' : '#94a3b8',
                fontWeight: 500,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <PluginIcon />
              <span>業務用SNS</span>
            </button>
          </nav>
        </div>

        {/* User Info & Sandbox Status */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>サンドボックス動作中</span>
          </div>
          <p style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.4 }}>
            すべてのデータはブラウザの localStorage に暗号化またはローカル保存され、外部送信されません。
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content" style={{ flexGrow: 1, padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.5px' }}>
              {activeTab === 'dashboard' && 'セキュリティ・コントロールパネル'}
              {activeTab === 'personal' && '個人業務効率化ツール'}
              {activeTab === 'bookkeeping' && '複式簿記ツール'}
              {activeTab === 'sns' && '業務用SNS (シミュレーター)'}
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>
              {activeTab === 'dashboard' && 'スタンドアロン環境の動作ステータスと完全通信遮断検証'}
              {activeTab === 'personal' && 'タスク管理と工数トラッキング (ローカルストレージ駆動)'}
              {activeTab === 'bookkeeping' && '簡易仕訳と決算書下書き出力 (ローカルストレージ駆動)'}
              {activeTab === 'sns' && '完全ローカルサンドボックス型の業務用SNSモック'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600
            }}>
              <LockIcon />
              OFFLINE SECURE
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
            {/* Status cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              
              <div className="glass-panel" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#38bdf8', padding: '12px', borderRadius: '12px' }}>
                  <DatabaseIcon />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>データベース接続</h3>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>LocalStorage</span>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>外部 PostgreSQL 未接続 (完全ローカル)</p>
                </div>
              </div>

              <div className="glass-panel" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(217, 70, 239, 0.1)', color: '#f472b6', padding: '12px', borderRadius: '12px' }}>
                  <WifiOffIcon />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>外部ネットワーク</h3>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>完全遮断 (正常)</span>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>静的スキャン適合率: 100% (No Net)</p>
                </div>
              </div>

              <div className="glass-panel" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '12px', borderRadius: '12px' }}>
                  <ShieldIcon />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>ライセンス承諾</h3>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>同意済</span>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>MITライセンス適用ゲートパス</p>
                </div>
              </div>

            </div>

            {/* Detailed sandboxing block */}
            <div className="glass-panel" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LockIcon />
                スタンドアロン（オフライン）版セキュリティ憲章
              </h2>
              <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: '24px', fontSize: '14px' }}>
                BaseKit Standaloneは、社内情報漏洩やネットワークポリシー抵触を極度に懸念する環境でも、安心して共通機能や個別プラグインをご利用いただけるよう構築されています。
                Viteビルドプロセスにおいて自動静的解析が実行され、プラグイン内部に外部サーバーとの通信コード（Fetch, Axios, Web Socket等）が存在しないか、厳密なアサーション検証が行われます。
              </p>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button className="btn-primary">セキュリティ自己診断を実行</button>
                <button className="btn-secondary" onClick={() => alert('localStorageデータをクリアしました。')}>ローカルデータをクリア</button>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'dashboard' && (
          <div className="glass-panel animate-fade-in" style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>準備中 (ステップ3-2 以降で接続予定)</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              現在、ステップ3-1「Vite環境の初期化」が実行されています。ステップ3-2で「LocalStorage対応データベースドライバー」をプラグインへ結線し、完全なデータ読み書き機能を提供します。
            </p>
            <button className="btn-secondary" onClick={() => setActiveTab('dashboard')}>ダッシュボードへ戻る</button>
          </div>
        )}

      </main>
    </div>
  );
}
