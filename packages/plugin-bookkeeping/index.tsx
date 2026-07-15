import React, { useState, useEffect } from 'react';
import { IDatabaseConnection } from '../core/src/types';

interface BookkeepingPluginProps {
  dbConnection?: IDatabaseConnection;
  onDraftsChange?: () => void;
}

export interface BookkeepingEntry {
  id: string;
  entry_date: string;
  description: string;
  debit_account: string;
  debit_amount: number;
  credit_account: string;
  credit_amount: number;
  created_at: string;
  deleted_at?: string | null;
}

export interface BookkeepingDraft {
  id: string;
  entry_date: string;
  description: string;
  debit_account: string;
  debit_amount: number;
  credit_account: string;
  credit_amount: number;
  created_at: string;
  deleted_at?: string | null;
}

const ACCOUNT_CATEGORIES: Record<string, 'asset' | 'liability' | 'net_asset' | 'revenue' | 'expense'> = {
  '現金': 'asset',
  '普通預金': 'asset',
  '売掛金': 'asset',
  '買掛金': 'liability',
  '未払金': 'liability',
  '未払費用': 'liability',
  '元入金': 'net_asset',
  '売上': 'revenue',
  '労務費': 'expense',
  '旅費交通費': 'expense',
  '通信費': 'expense',
  '消耗品費': 'expense',
  '地代家賃': 'expense'
};

const STANDARD_ACCOUNTS = Object.keys(ACCOUNT_CATEGORIES);

export default function BookkeepingPlugin({ dbConnection, onDraftsChange }: BookkeepingPluginProps) {
  const [entries, setEntries] = useState<BookkeepingEntry[]>([]);
  const [drafts, setDrafts] = useState<BookkeepingDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [description, setDescription] = useState('');
  const [debitAccount, setDebitAccount] = useState('普通預金');
  const [debitAmount, setDebitAmount] = useState<string>('');
  const [creditAccount, setCreditAccount] = useState('売上');
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // UI state
  const [activeReportTab, setActiveReportTab] = useState<'bs' | 'pl'>('bs');

  const loadData = async () => {
    if (!dbConnection) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      await ensureInitialData();

      const entriesData = await dbConnection.query<BookkeepingEntry[]>(
        'SELECT * FROM bookkeeping_entries WHERE deleted_at IS NULL ORDER BY entry_date DESC, created_at DESC'
      );
      setEntries(entriesData || []);

      const draftsData = await dbConnection.query<BookkeepingDraft[]>(
        'SELECT * FROM bookkeeping_drafts WHERE deleted_at IS NULL ORDER BY created_at DESC'
      );
      setDrafts(draftsData || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load bookkeeping data:', err);
      setError('データベースの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const ensureInitialData = async () => {
    if (!dbConnection) return;
    try {
      const existing = await dbConnection.query<BookkeepingEntry[]>(
        'SELECT * FROM bookkeeping_entries WHERE deleted_at IS NULL'
      );
      if (!existing || existing.length === 0) {
        const nowStr = new Date().toISOString();
        const nowDay = nowStr.substring(0, 10);
        const initialData = [
          {
            id: 'init-1',
            entry_date: nowDay,
            description: '元入金（個人資本金）の預入',
            debit_account: '普通預金',
            debit_amount: 3000000,
            credit_account: '元入金',
            credit_amount: 3000000,
            created_at: nowStr,
            deleted_at: null
          },
          {
            id: 'init-2',
            entry_date: nowDay,
            description: '売掛金回収（売上代金）',
            debit_account: '普通預金',
            debit_amount: 150000,
            credit_account: '売掛金',
            credit_amount: 150000,
            created_at: nowStr,
            deleted_at: null
          },
          {
            id: 'init-3',
            entry_date: nowDay,
            description: '旅費交通費の現金払い',
            debit_account: '旅費交通費',
            debit_amount: 1200,
            credit_account: '現金',
            credit_amount: 1200,
            created_at: nowStr,
            deleted_at: null
          },
          {
            id: 'init-4',
            entry_date: nowDay,
            description: '受託案件開発の売上計上',
            debit_account: '売掛金',
            debit_amount: 500000,
            credit_account: '売上',
            credit_amount: 500000,
            created_at: nowStr,
            deleted_at: null
          }
        ];

        for (const item of initialData) {
          await dbConnection.execute(
            'INSERT INTO bookkeeping_entries (id, entry_date, description, debit_account, debit_amount, credit_account, credit_amount, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [item.id, item.entry_date, item.description, item.debit_account, item.debit_amount, item.credit_account, item.credit_amount, item.created_at, item.deleted_at]
          );
        }
      }
    } catch (e) {
      console.error('Failed to insert seeds:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [dbConnection]);

  // Handle register new manual entry
  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbConnection) return;

    const parsedDebitAmt = parseInt(debitAmount, 10);
    const parsedCreditAmt = parseInt(creditAmount, 10);

    if (!entryDate || !description.trim()) {
      setFormError('日付と摘要は必須項目です。');
      return;
    }

    if (isNaN(parsedDebitAmt) || parsedDebitAmt <= 0 || isNaN(parsedCreditAmt) || parsedCreditAmt <= 0) {
      setFormError('金額は1以上の正の整数を入力してください。');
      return;
    }

    if (parsedDebitAmt !== parsedCreditAmt) {
      setFormError(`貸借金額が不一致です。(借方: ${parsedDebitAmt.toLocaleString()}円 / 貸方: ${parsedCreditAmt.toLocaleString()}円)`);
      return;
    }

    try {
      const newId = crypto.randomUUID();
      const nowStr = new Date().toISOString();

      await dbConnection.execute(
        'INSERT INTO bookkeeping_entries (id, entry_date, description, debit_account, debit_amount, credit_account, credit_amount, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [newId, entryDate, description.trim(), debitAccount, parsedDebitAmt, creditAccount, parsedCreditAmt, nowStr, null]
      );

      setDescription('');
      setDebitAmount('');
      setCreditAmount('');
      setFormError(null);
      await loadData();
    } catch (err) {
      console.error('Failed to save manual bookkeeping entry:', err);
      setFormError('仕訳の保存に失敗しました。');
    }
  };

  // Synchronize debit/credit inputs if requested
  const handleAmountChange = (val: string, target: 'debit' | 'credit') => {
    if (target === 'debit') {
      setDebitAmount(val);
      setCreditAmount(val); // By default autofill credit side for simple 1:1 transaction
    } else {
      setCreditAmount(val);
      setDebitAmount(val);
    }
  };

  // logical deletion
  const handleDeleteEntry = async (id: string) => {
    if (!dbConnection || !window.confirm('この仕訳を削除しますか？')) return;
    try {
      const nowStr = new Date().toISOString();
      await dbConnection.execute(
        'UPDATE bookkeeping_entries SET deleted_at = $1 WHERE id = $2',
        [nowStr, id]
      );
      await loadData();
    } catch (err) {
      console.error('Failed to logically delete entry:', err);
      alert('仕訳の削除に失敗しました。');
    }
  };

  // Approve a pending draft from personal-ops
  const handleApproveDraft = async (draft: BookkeepingDraft) => {
    if (!dbConnection) return;
    try {
      const nowStr = new Date().toISOString();
      // Insert into bookkeeping_entries
      await dbConnection.execute(
        'INSERT INTO bookkeeping_entries (id, entry_date, description, debit_account, debit_amount, credit_account, credit_amount, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          crypto.randomUUID(),
          draft.entry_date,
          draft.description,
          draft.debit_account,
          draft.debit_amount,
          draft.credit_account,
          draft.credit_amount,
          nowStr,
          null
        ]
      );

      // Delete from drafts
      await dbConnection.execute(
        'DELETE FROM bookkeeping_drafts WHERE id = $1',
        [draft.id]
      );

      if (onDraftsChange) onDraftsChange();
      await loadData();
    } catch (err) {
      console.error('Failed to approve draft:', err);
      alert('下書きの承認に失敗しました。');
    }
  };

  // Reject a pending draft
  const handleRejectDraft = async (draftId: string) => {
    if (!dbConnection) return;
    try {
      await dbConnection.execute(
        'DELETE FROM bookkeeping_drafts WHERE id = $1',
        [draftId]
      );

      if (onDraftsChange) onDraftsChange();
      await loadData();
    } catch (err) {
      console.error('Failed to reject draft:', err);
      alert('下書きの却下に失敗しました。');
    }
  };

  // Calculate Financial Statements dynamically
  const calculateBalances = () => {
    const balances: Record<string, number> = {};
    STANDARD_ACCOUNTS.forEach(acc => {
      balances[acc] = 0;
    });

    entries.forEach(entry => {
      const debitAcc = entry.debit_account;
      const creditAcc = entry.credit_account;
      const debitAmt = entry.debit_amount;
      const creditAmt = entry.credit_amount;

      // Adjust debit account balance
      if (balances[debitAcc] === undefined) balances[debitAcc] = 0;
      const debitCat = ACCOUNT_CATEGORIES[debitAcc];
      if (debitCat === 'asset' || debitCat === 'expense') {
        balances[debitAcc] += debitAmt;
      } else {
        balances[debitAcc] -= debitAmt;
      }

      // Adjust credit account balance
      if (balances[creditAcc] === undefined) balances[creditAcc] = 0;
      const creditCat = ACCOUNT_CATEGORIES[creditAcc];
      if (creditCat === 'asset' || creditCat === 'expense') {
        balances[creditAcc] -= creditAmt;
      } else {
        balances[creditAcc] += creditAmt;
      }
    });

    // Compute P/L
    let totalRevenue = 0;
    let totalExpense = 0;
    const plItems: Record<string, number> = {};
    const bsItems: Record<string, number> = {};

    Object.entries(balances).forEach(([acc, val]) => {
      const cat = ACCOUNT_CATEGORIES[acc];
      if (cat === 'revenue') {
        totalRevenue += val;
        plItems[acc] = val;
      } else if (cat === 'expense') {
        totalExpense += val;
        plItems[acc] = val;
      } else {
        bsItems[acc] = val;
      }
    });

    const netIncome = totalRevenue - totalExpense;

    // Compute B/S components
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalNetAssets = 0;

    Object.entries(bsItems).forEach(([acc, val]) => {
      const cat = ACCOUNT_CATEGORIES[acc];
      if (cat === 'asset') totalAssets += val;
      if (cat === 'liability') totalLiabilities += val;
      if (cat === 'net_asset') totalNetAssets += val;
    });

    // Add current net income to net assets (Retained Earnings concept)
    const finalNetAssets = totalNetAssets + netIncome;

    return {
      balances,
      plItems,
      bsItems,
      totalRevenue,
      totalExpense,
      netIncome,
      totalAssets,
      totalLiabilities,
      totalNetAssets,
      finalNetAssets,
      isBalanced: totalAssets === (totalLiabilities + finalNetAssets)
    };
  };

  const financials = calculateBalances();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
        <div className="pulsing-loader" style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '3px solid rgba(236, 72, 153, 0.1)',
          borderTopColor: '#ec4899',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#94a3b8' }}>データを読み込み中...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '14px', borderRadius: '12px', fontSize: '14px' }}>
          ⚠️ {error}
        </div>
      )}
      
      {/* 1. 工数連携仕訳下書きフィード */}
      {drafts.length > 0 && (
        <div className="glass-panel" style={{
          border: '1px solid rgba(236, 72, 153, 0.2)',
          background: 'rgba(236, 72, 153, 0.04)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f472b6', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⏳ 工数連携に基づく未承認の仕訳下書き ({drafts.length}件)</span>
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
            個人業務効率化ツールで登録された作業ログが、自動的に労務費仕訳として生成されています。内容を確認し、決算書へ反映するには「承認」を押してください。
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {drafts.map(draft => (
              <div key={draft.id} style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#f8fafc', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                      {draft.entry_date}
                    </span>
                    <span style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600 }}>{draft.description}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#94a3b8' }}>
                    <span>借方: <strong style={{ color: '#38bdf8' }}>{draft.debit_account}</strong> {draft.debit_amount.toLocaleString()}円</span>
                    <span>/</span>
                    <span>貸方: <strong style={{ color: '#f472b6' }}>{draft.credit_account}</strong> {draft.credit_amount.toLocaleString()}円</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleApproveDraft(draft)}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                    }}
                  >
                    承認
                  </button>
                  <button
                    onClick={() => handleRejectDraft(draft.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    却下
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Form and Financial Report */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
        
        {/* 2. 仕訳登録フォーム */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
            新規仕訳登録
          </h2>
          
          <form onSubmit={handleSubmitEntry} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {formError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
                ⚠️ {formError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>日付</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#fff',
                    outline: 'none'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>摘要 (取引内容)</label>
                <input
                  type="text"
                  placeholder="例: 文房具の購入"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#fff',
                    outline: 'none'
                  }}
                  required
                />
              </div>
            </div>

            {/* Debit block */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.03)',
              border: '1px solid rgba(56, 189, 248, 0.1)',
              borderRadius: '10px',
              padding: '14px'
            }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8', marginBottom: '10px' }}>借方 (左側)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>勘定科目</label>
                  <select
                    value={debitAccount}
                    onChange={(e) => setDebitAccount(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: '#fff',
                      outline: 'none'
                    }}
                  >
                    {STANDARD_ACCOUNTS.map(acc => (
                      <option key={acc} value={acc}>{acc} ({ACCOUNT_CATEGORIES[acc] === 'asset' ? '資産' : ACCOUNT_CATEGORIES[acc] === 'expense' ? '費用' : 'その他'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>金額 (円)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="金額"
                    value={debitAmount}
                    onChange={(e) => handleAmountChange(e.target.value, 'debit')}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: '#fff',
                      outline: 'none'
                    }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Credit block */}
            <div style={{
              background: 'rgba(244, 114, 182, 0.03)',
              border: '1px solid rgba(244, 114, 182, 0.1)',
              borderRadius: '10px',
              padding: '14px'
            }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#f472b6', marginBottom: '10px' }}>貸方 (右側)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>勘定科目</label>
                  <select
                    value={creditAccount}
                    onChange={(e) => setCreditAccount(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: '#fff',
                      outline: 'none'
                    }}
                  >
                    {STANDARD_ACCOUNTS.map(acc => (
                      <option key={acc} value={acc}>{acc} ({ACCOUNT_CATEGORIES[acc] === 'liability' ? '負債' : ACCOUNT_CATEGORIES[acc] === 'revenue' ? '収益' : ACCOUNT_CATEGORIES[acc] === 'net_asset' ? '純資産' : 'その他'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>金額 (円)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="金額"
                    value={creditAmount}
                    onChange={(e) => handleAmountChange(e.target.value, 'credit')}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: '#fff',
                      outline: 'none'
                    }}
                    required
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>
              仕訳を登録
            </button>
          </form>
        </div>

        {/* 3. 決算書下書き出力 */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ec4899' }}>
              主要決算書 (下書き)
            </h2>
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <button
                onClick={() => setActiveReportTab('bs')}
                style={{
                  background: activeReportTab === 'bs' ? 'rgba(236, 72, 153, 0.2)' : 'transparent',
                  border: 'none',
                  color: activeReportTab === 'bs' ? '#f472b6' : '#94a3b8',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                貸借対照表 (B/S)
              </button>
              <button
                onClick={() => setActiveReportTab('pl')}
                style={{
                  background: activeReportTab === 'pl' ? 'rgba(236, 72, 153, 0.2)' : 'transparent',
                  border: 'none',
                  color: activeReportTab === 'pl' ? '#f472b6' : '#94a3b8',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                損益計算書 (P/L)
              </button>
            </div>
          </div>

          {/* B/S View */}
          {activeReportTab === 'bs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', fontSize: '11px', fontWeight: 600 }}>
                <span>科目</span>
                <span>残高 (円)</span>
              </div>

              {/* Assets Section */}
              <div>
                <h3 style={{ fontSize: '13px', color: '#38bdf8', paddingBottom: '4px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', marginBottom: '8px' }}>
                  資産の部
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
                  {Object.entries(financials.bsItems)
                    .filter(([acc]) => ACCOUNT_CATEGORIES[acc] === 'asset')
                    .map(([acc, val]) => (
                      <div key={acc} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>{acc}</span>
                        <span>{val.toLocaleString()}</span>
                      </div>
                    ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                    <span>資産合計</span>
                    <span>{financials.totalAssets.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Liabilities Section */}
              <div>
                <h3 style={{ fontSize: '13px', color: '#f472b6', paddingBottom: '4px', borderBottom: '1px solid rgba(244, 114, 182, 0.2)', marginBottom: '8px' }}>
                  負債の部
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
                  {Object.entries(financials.bsItems)
                    .filter(([acc]) => ACCOUNT_CATEGORIES[acc] === 'liability')
                    .map(([acc, val]) => (
                      <div key={acc} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>{acc}</span>
                        <span>{val.toLocaleString()}</span>
                      </div>
                    ))}
                  {Object.entries(financials.bsItems).filter(([acc]) => ACCOUNT_CATEGORIES[acc] === 'liability').length === 0 && (
                    <div style={{ color: '#6b7280', fontSize: '12px', fontStyle: 'italic' }}>負債なし</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#f472b6', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                    <span>負債合計</span>
                    <span>{financials.totalLiabilities.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Assets Section */}
              <div>
                <h3 style={{ fontSize: '13px', color: '#a855f7', paddingBottom: '4px', borderBottom: '1px solid rgba(168, 85, 247, 0.2)', marginBottom: '8px' }}>
                  純資産の部
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
                  {Object.entries(financials.bsItems)
                    .filter(([acc]) => ACCOUNT_CATEGORIES[acc] === 'net_asset')
                    .map(([acc, val]) => (
                      <div key={acc} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>{acc}</span>
                        <span>{val.toLocaleString()}</span>
                      </div>
                    ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8' }}>
                    <span>繰越利益 (当期純利益より)</span>
                    <span style={{ color: financials.netIncome >= 0 ? '#10b981' : '#f87171' }}>
                      {financials.netIncome.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#a855f7', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                    <span>純資産合計</span>
                    <span>{financials.finalNetAssets.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Balance Check */}
              <div style={{
                background: financials.isBalanced ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: financials.isBalanced ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                marginTop: '8px'
              }}>
                <span style={{ fontWeight: 600, color: financials.isBalanced ? '#10b981' : '#f87171' }}>
                  {financials.isBalanced ? '✓ 貸借完全一致 (整合性クリア)' : '⚠ 貸借不一致が発生しています'}
                </span>
                <span style={{ color: '#94a3b8' }}>
                  差額: {Math.abs(financials.totalAssets - (financials.totalLiabilities + financials.finalNetAssets)).toLocaleString()}円
                </span>
              </div>
            </div>
          )}

          {/* P/L View */}
          {activeReportTab === 'pl' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', fontSize: '11px', fontWeight: 600 }}>
                <span>勘定科目</span>
                <span>金額 (円)</span>
              </div>

              {/* Revenues */}
              <div>
                <h3 style={{ fontSize: '13px', color: '#10b981', paddingBottom: '4px', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '8px' }}>
                  収益の部
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
                  {Object.entries(financials.plItems)
                    .filter(([acc]) => ACCOUNT_CATEGORIES[acc] === 'revenue')
                    .map(([acc, val]) => (
                      <div key={acc} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>{acc}</span>
                        <span>{val.toLocaleString()}</span>
                      </div>
                    ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#10b981', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                    <span>収益合計 (売上高)</span>
                    <span>{financials.totalRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Expenses */}
              <div>
                <h3 style={{ fontSize: '13px', color: '#f59e0b', paddingBottom: '4px', borderBottom: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: '8px' }}>
                  費用の部
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
                  {Object.entries(financials.plItems)
                    .filter(([acc]) => ACCOUNT_CATEGORIES[acc] === 'expense')
                    .map(([acc, val]) => (
                      <div key={acc} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>{acc}</span>
                        <span>{val.toLocaleString()}</span>
                      </div>
                    ))}
                  {Object.entries(financials.plItems).filter(([acc]) => ACCOUNT_CATEGORIES[acc] === 'expense').length === 0 && (
                    <div style={{ color: '#6b7280', fontSize: '12px', fontStyle: 'italic' }}>経費支出なし</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#f59e0b', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                    <span>費用合計 (一般管理費・労務費)</span>
                    <span>{financials.totalExpense.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Income */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginTop: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: financials.netIncome >= 0 ? '#10b981' : '#f87171' }}>
                    当期純利益
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: financials.netIncome >= 0 ? '#10b981' : '#f87171' }}>
                    {financials.netIncome.toLocaleString()}円
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  ※ 収益合計からすべての発生経費（および自動連動労務費）を差し引いた純額です。
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 4. 仕訳履歴テーブル */}
      <div className="glass-panel">
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
          仕訳履歴 (仕訳帳)
        </h2>
        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>仕訳履歴がありません。</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600 }}>日付</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600 }}>摘要 (取引内容)</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: '#38bdf8' }}>借方勘定科目</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600, color: '#38bdf8' }}>借方金額 (円)</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: '#f472b6', paddingLeft: '24px' }}>貸方勘定科目</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600, color: '#f472b6' }}>貸方金額 (円)</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px', fontWeight: 600, width: '80px' }}>アクション</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '12px 8px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{entry.entry_date}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 500 }}>{entry.description}</td>
                    <td style={{ padding: '12px 8px', color: '#38bdf8' }}>{entry.debit_account}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>{entry.debit_amount.toLocaleString()}</td>
                    <td style={{ padding: '12px 8px', color: '#f472b6', paddingLeft: '24px' }}>{entry.credit_account}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>{entry.credit_amount.toLocaleString()}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#f87171',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
