import React, { useState, useEffect } from 'react';
import { IDatabaseConnection } from '../core/src/types';

interface BookkeepingPluginProps {
  dbConnection?: IDatabaseConnection;
  onDraftsChange?: () => void;
}

export interface BookkeepingAccount {
  id: string;
  name: string;
  type: '資産' | '負債' | '純資産' | '収益' | '費用';
  business_ratio: number; // 0 to 100
  created_at: string;
  deleted_at?: string | null;
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

export default function BookkeepingPlugin({ dbConnection, onDraftsChange }: BookkeepingPluginProps) {
  const [accounts, setAccounts] = useState<BookkeepingAccount[]>([]);
  const [entries, setEntries] = useState<BookkeepingEntry[]>([]);
  const [drafts, setDrafts] = useState<BookkeepingDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active sub-tab under Bookkeeping tab
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'reports' | 'settings'>('ledger');
  const [activeReportTab, setActiveReportTab] = useState<'bs' | 'pl'>('bs');

  // Transaction form states
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [description, setDescription] = useState('');
  const [debitAccount, setDebitAccount] = useState('普通預金');
  const [debitAmount, setDebitAmount] = useState<string>('');
  const [creditAccount, setCreditAccount] = useState('売上');
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Account creation form states
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'資産' | '負債' | '純資産' | '収益' | '費用'>('費用');
  const [newAccountRatio, setNewAccountRatio] = useState(100);
  const [accountFormError, setAccountFormError] = useState<string | null>(null);

  // Load accounts and entries from database
  const loadData = async () => {
    if (!dbConnection) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      await ensureSeedData();

      const accountsData = await dbConnection.query<BookkeepingAccount[]>(
        'SELECT * FROM bookkeeping_accounts WHERE deleted_at IS NULL ORDER BY type ASC, name ASC'
      );
      setAccounts(accountsData || []);

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

  const ensureSeedData = async () => {
    if (!dbConnection) return;
    try {
      // 1. Seed Accounts
      const existingAccounts = await dbConnection.query<BookkeepingAccount[]>(
        'SELECT * FROM bookkeeping_accounts WHERE deleted_at IS NULL'
      );
      
      if (!existingAccounts || existingAccounts.length === 0) {
        const nowStr = new Date().toISOString();
        const defaultAccounts: Omit<BookkeepingAccount, 'id' | 'created_at'>[] = [
          // 資産
          { name: '現金', type: '資産', business_ratio: 100 },
          { name: '普通預金', type: '資産', business_ratio: 100 },
          { name: '売掛金', type: '資産', business_ratio: 100 },
          { name: '事業主貸', type: '資産', business_ratio: 100 },
          { name: '前払費用', type: '資産', business_ratio: 100 },
          { name: '未収入金', type: '資産', business_ratio: 100 },
          { name: '工具器具備品', type: '資産', business_ratio: 100 },
          // 負債
          { name: '未払金', type: '負債', business_ratio: 100 },
          { name: '未払費用', type: '負債', business_ratio: 100 },
          { name: '預り金', type: '負債', business_ratio: 100 },
          { name: '借入金', type: '負債', business_ratio: 100 },
          { name: '事業主借', type: '負債', business_ratio: 100 },
          // 純資産
          { name: '元入金', type: '純資産', business_ratio: 100 },
          { name: '繰越利益', type: '純資産', business_ratio: 100 },
          // 収益
          { name: '売上', type: '収益', business_ratio: 100 },
          { name: '業務委託収入', type: '収益', business_ratio: 100 },
          { name: '雑収入', type: '収益', business_ratio: 100 },
          { name: '受取利息', type: '収益', business_ratio: 100 },
          // 費用
          { name: '通信費', type: '費用', business_ratio: 50 },
          { name: '旅費交通費', type: '費用', business_ratio: 100 },
          { name: '接待交際費', type: '費用', business_ratio: 100 },
          { name: '消耗品費', type: '費用', business_ratio: 100 },
          { name: '新聞図書費', type: '費用', business_ratio: 100 },
          { name: '会議費', type: '費用', business_ratio: 100 },
          { name: '水道光熱費', type: '費用', business_ratio: 30 },
          { name: '支払手数料', type: '費用', business_ratio: 100 },
          { name: '外注費', type: '費用', business_ratio: 100 },
          { name: '広告宣伝費', type: '費用', business_ratio: 100 },
          { name: '車両費', type: '費用', business_ratio: 50 },
          { name: '地代家賃', type: '費用', business_ratio: 30 },
          { name: '保険料', type: '費用', business_ratio: 50 },
          { name: '修繕費', type: '費用', business_ratio: 100 },
          { name: '諸会費', type: '費用', business_ratio: 100 },
          { name: '雑費', type: '費用', business_ratio: 100 },
          { name: '租税公課', type: '費用', business_ratio: 100 },
          { name: '減価償却費', type: '費用', business_ratio: 100 },
          { name: '労務費', type: '費用', business_ratio: 100 }
        ];

        for (const acc of defaultAccounts) {
          const id = crypto.randomUUID();
          await dbConnection.execute(
            'INSERT INTO bookkeeping_accounts (id, name, type, business_ratio, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, acc.name, acc.type, acc.business_ratio, nowStr, null]
          );
        }
      }

      // 2. Seed Entries
      const existingEntries = await dbConnection.query<BookkeepingEntry[]>(
        'SELECT * FROM bookkeeping_entries WHERE deleted_at IS NULL'
      );
      if (!existingEntries || existingEntries.length === 0) {
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

  // Helper to sync debit and credit values for simple entries
  const handleAmountChange = (val: string, target: 'debit' | 'credit') => {
    if (target === 'debit') {
      setDebitAmount(val);
      setCreditAmount(val);
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

  // Add custom account
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbConnection) return;
    if (!newAccountName.trim()) return;

    if (newAccountRatio < 0 || newAccountRatio > 100) {
      setAccountFormError('事業比率は0から100の間で設定してください。');
      return;
    }

    // Check duplicate
    const exists = accounts.some(acc => acc.name === newAccountName.trim());
    if (exists) {
      setAccountFormError('この勘定科目は既に登録されています。');
      return;
    }

    try {
      const nowStr = new Date().toISOString();
      const newId = crypto.randomUUID();
      await dbConnection.execute(
        'INSERT INTO bookkeeping_accounts (id, name, type, business_ratio, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [newId, newAccountName.trim(), newAccountType, newAccountRatio, nowStr, null]
      );
      setNewAccountName('');
      setAccountFormError(null);
      await loadData();
    } catch (err) {
      console.error('Failed to create account:', err);
      setAccountFormError('勘定科目の登録に失敗しました。');
    }
  };

  // Update ratio for an existing account
  const handleUpdateRatio = async (id: string, ratio: number) => {
    if (!dbConnection) return;
    try {
      await dbConnection.execute(
        'UPDATE bookkeeping_accounts SET business_ratio = $1 WHERE id = $2',
        [ratio, id]
      );
      // Update in local state to avoid full reload delay
      setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, business_ratio: ratio } : acc));
    } catch (err) {
      console.error('Failed to update ratio:', err);
      alert('比率の更新に失敗しました。');
    }
  };

  // Calculate Financial Statements dynamically incorporating household apportionment (家事按分)
  const calculateBalances = () => {
    // Generate type map and ratio map from loaded accounts
    const accountTypes: Record<string, string> = {};
    const accountRatios: Record<string, number> = {};

    accounts.forEach(acc => {
      accountTypes[acc.name] = acc.type;
      accountRatios[acc.name] = acc.business_ratio;
    });

    // Sub-balances
    const rawBalances: Record<string, number> = {};
    accounts.forEach(acc => {
      rawBalances[acc.name] = 0;
    });

    // Apportioned values
    let businessExpenses = 0;
    let personalExpenses = 0; // Cumulative owner's drawings (事業主貸) from private expense portions
    let revenue = 0;

    // Process entries
    entries.forEach(entry => {
      const debitAcc = entry.debit_account;
      const creditAcc = entry.credit_account;
      const debitAmt = entry.debit_amount;
      const creditAmt = entry.credit_amount;

      // Accumulate raw balances
      if (rawBalances[debitAcc] === undefined) rawBalances[debitAcc] = 0;
      const debitType = accountTypes[debitAcc] || '資産';
      if (debitType === '資産' || debitType === '費用') {
        rawBalances[debitAcc] += debitAmt;
      } else {
        rawBalances[debitAcc] -= debitAmt;
      }

      if (rawBalances[creditAcc] === undefined) rawBalances[creditAcc] = 0;
      const creditType = accountTypes[creditAcc] || '純資産';
      if (creditType === '資産' || creditType === '費用') {
        rawBalances[creditAcc] -= creditAmt;
      } else {
        rawBalances[creditAcc] += creditAmt;
      }
    });

    const plItems: Record<string, number> = {};
    const bsItems: Record<string, number> = {};

    // Group items and apply apportionment to expenses (費用)
    Object.entries(rawBalances).forEach(([accName, rawVal]) => {
      const type = accountTypes[accName];
      if (type === '収益') {
        revenue += rawVal;
        plItems[accName] = rawVal;
      } else if (type === '費用') {
        const ratio = accountRatios[accName] !== undefined ? accountRatios[accName] : 100;
        const businessPart = Math.round(rawVal * (ratio / 100));
        const personalPart = rawVal - businessPart;
        
        businessExpenses += businessPart;
        personalExpenses += personalPart;
        
        plItems[accName] = businessPart; // Show only business portion in P/L
      } else {
        bsItems[accName] = rawVal;
      }
    });

    const netProfit = revenue - businessExpenses;

    // Calculate B/S totals
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalNetAssets = 0;

    Object.entries(bsItems).forEach(([accName, val]) => {
      const type = accountTypes[accName];
      if (type === '資産') totalAssets += val;
      if (type === '負債') totalLiabilities += val;
      if (type === '純資産') totalNetAssets += val;
    });

    // Add dynamic apportionment (事業主貸) to assets
    const drawingsBalance = (bsItems['事業主貸'] || 0) + personalExpenses;
    const finalAssets = totalAssets - (bsItems['事業主貸'] || 0) + drawingsBalance;

    // Net Assets include元入金 + 當期純利益
    const finalNetAssets = totalNetAssets + netProfit;

    return {
      plItems,
      bsItems: {
        ...bsItems,
        '事業主貸': drawingsBalance
      },
      totalRevenue: revenue,
      totalExpense: businessExpenses,
      netProfit,
      netIncome: netProfit,
      totalAssets: finalAssets,
      totalLiabilities,
      finalNetAssets,
      personalExpenses,
      isBalanced: finalAssets === (totalLiabilities + finalNetAssets)
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

      {/* Sub Tabs switcher */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveSubTab('ledger')}
          style={{
            background: activeSubTab === 'ledger' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
            border: 'none',
            color: activeSubTab === 'ledger' ? '#38bdf8' : '#94a3b8',
            padding: '8px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          仕訳登録・履歴 (仕訳帳)
        </button>
        <button
          onClick={() => setActiveSubTab('reports')}
          style={{
            background: activeSubTab === 'reports' ? 'rgba(236, 72, 153, 0.12)' : 'transparent',
            border: 'none',
            color: activeSubTab === 'reports' ? '#ec4899' : '#94a3b8',
            padding: '8px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          財務報告書 (B/S & P/L)
        </button>
        <button
          onClick={() => setActiveSubTab('settings')}
          style={{
            background: activeSubTab === 'settings' ? 'rgba(168, 85, 247, 0.12)' : 'transparent',
            border: 'none',
            color: activeSubTab === 'settings' ? '#a855f7' : '#94a3b8',
            padding: '8px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          勘定科目 ＆ 家事按分設定
        </button>
      </div>

      {/* Tab: LEDGER */}
      {activeSubTab === 'ledger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Manual Entry Form */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
              新規仕訳入力
            </h2>
            
            <form onSubmit={handleSubmitEntry} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {formError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
                  ⚠️ {formError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
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

              {/* Debit/Credit blocks */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Debit */}
                <div style={{
                  background: 'rgba(56, 189, 248, 0.03)',
                  border: '1px solid rgba(56, 189, 248, 0.1)',
                  borderRadius: '10px',
                  padding: '14px'
                }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8', marginBottom: '10px' }}>借方 (左側)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.name}>{acc.name} ({acc.type})</option>
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

                {/* Credit */}
                <div style={{
                  background: 'rgba(244, 114, 182, 0.03)',
                  border: '1px solid rgba(244, 114, 182, 0.1)',
                  borderRadius: '10px',
                  padding: '14px'
                }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#f472b6', marginBottom: '10px' }}>貸方 (右側)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.name}>{acc.name} ({acc.type})</option>
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
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                仕訳を登録
              </button>
            </form>
          </div>

          {/* History Ledger */}
          <div className="glass-panel">
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
              仕訳帳履歴
            </h2>
            {entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>仕訳データが存在しません。</div>
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
      )}

      {/* Tab: REPORTS */}
      {activeSubTab === 'reports' && (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Header & PL/BS Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ec4899' }}>
              主要決算書の下書き (家事按分考慮済)
            </h2>
            
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <button
                onClick={() => setActiveReportTab('bs')}
                style={{
                  background: activeReportTab === 'bs' ? 'rgba(236, 72, 153, 0.2)' : 'transparent',
                  border: 'none',
                  color: activeReportTab === 'bs' ? '#f472b6' : '#94a3b8',
                  padding: '6px 16px',
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
                  padding: '6px 16px',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                
                {/* Assets (資産の部) */}
                <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
                  <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '10px 16px', borderBottom: '1px solid rgba(56,189,248,0.2)', fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>
                    資産の部 (Assets)
                  </div>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '200px' }}>
                    {Object.entries(financials.bsItems)
                      .filter(([accName]) => accounts.find(a => a.name === accName)?.type === '資産')
                      .map(([accName, val]) => (
                        <div key={accName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span>{accName}</span>
                          <span>{val.toLocaleString()}円</span>
                        </div>
                      ))}
                    {financials.personalExpenses > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#10b981', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                        <span>事業主貸（家事按分控除分）</span>
                        <span>{financials.personalExpenses.toLocaleString()}円</span>
                      </div>
                    )}
                  </div>
                  <div style={{ background: 'rgba(56, 189, 248, 0.05)', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#38bdf8' }}>
                    <span>資産合計</span>
                    <span>{financials.totalAssets.toLocaleString()}円</span>
                  </div>
                </div>

                {/* Liabilities & Equity (負債・純資産の部) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Liabilities */}
                  <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
                    <div style={{ background: 'rgba(244, 114, 182, 0.1)', padding: '10px 16px', borderBottom: '1px solid rgba(244,114,182,0.2)', fontSize: '14px', fontWeight: 700, color: '#f472b6' }}>
                      負債の部 (Liabilities)
                    </div>
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(financials.bsItems)
                        .filter(([accName]) => accounts.find(a => a.name === accName)?.type === '負債')
                        .map(([accName, val]) => (
                          <div key={accName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span>{accName}</span>
                            <span>{val.toLocaleString()}円</span>
                          </div>
                        ))}
                      {Object.entries(financials.bsItems).filter(([accName]) => accounts.find(a => a.name === accName)?.type === '負債').length === 0 && (
                        <div style={{ color: '#6b7280', fontSize: '12px', fontStyle: 'italic' }}>負債なし</div>
                      )}
                    </div>
                    <div style={{ background: 'rgba(244, 114, 182, 0.05)', padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#f472b6' }}>
                      <span>負債合計</span>
                      <span>{financials.totalLiabilities.toLocaleString()}円</span>
                    </div>
                  </div>

                  {/* Net Assets / Equity */}
                  <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
                    <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '10px 16px', borderBottom: '1px solid rgba(168,85,247,0.2)', fontSize: '14px', fontWeight: 700, color: '#a855f7' }}>
                      純資産の部 (Equity)
                    </div>
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(financials.bsItems)
                        .filter(([accName]) => accounts.find(a => a.name === accName)?.type === '純資産')
                        .map(([accName, val]) => (
                          <div key={accName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span>{accName}</span>
                            <span>{val.toLocaleString()}円</span>
                          </div>
                        ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>当期純利益 (PLより動的算出)</span>
                        <span style={{ color: financials.netIncome >= 0 ? '#10b981' : '#f87171', fontWeight: 600 }}>
                          {financials.netIncome.toLocaleString()}円
                        </span>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(168, 85, 247, 0.05)', padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#a855f7' }}>
                      <span>純資産合計</span>
                      <span>{financials.finalNetAssets.toLocaleString()}円</span>
                    </div>
                  </div>

                </div>

              </div>

              {/* Balance Check Statement */}
              <div style={{
                background: financials.isBalanced ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: financials.isBalanced ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '13px'
              }}>
                <span style={{ fontWeight: 600, color: financials.isBalanced ? '#10b981' : '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{financials.isBalanced ? '✓ 貸借完全一致 (B/S 均等確認済)' : '⚠ 貸借が不均等です'}</span>
                </span>
                <span style={{ color: '#94a3b8' }}>
                  差額: {Math.abs(financials.totalAssets - (financials.totalLiabilities + financials.finalNetAssets)).toLocaleString()}円
                </span>
              </div>

            </div>
          )}

          {/* P/L View */}
          {activeReportTab === 'pl' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Revenues */}
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px 16px', borderBottom: '1px solid rgba(16,185,129,0.2)', fontSize: '14px', fontWeight: 700, color: '#10b981' }}>
                  収益の部 (Revenue)
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(financials.plItems)
                    .filter(([accName]) => accounts.find(a => a.name === accName)?.type === '収益')
                    .map(([accName, val]) => (
                      <div key={accName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>{accName}</span>
                        <span>{val.toLocaleString()}円</span>
                      </div>
                    ))}
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#10b981' }}>
                  <span>収益合計 (売上高)</span>
                  <span>{financials.totalRevenue.toLocaleString()}円</span>
                </div>
              </div>

              {/* Expenses */}
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px 16px', borderBottom: '1px solid rgba(245,158,11,0.2)', fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>
                  費用の部 (Expenses - 家事按分事業分のみ計上)
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(financials.plItems)
                    .filter(([accName]) => accounts.find(a => a.name === accName)?.type === '費用')
                    .map(([accName, val]) => {
                      const acc = accounts.find(a => a.name === accName);
                      const ratio = acc ? acc.business_ratio : 100;
                      return (
                        <div key={accName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span>
                            {accName} <span style={{ color: '#6b7280', fontSize: '11px' }}>({ratio}% 按分)</span>
                          </span>
                          <span>{val.toLocaleString()}円</span>
                        </div>
                      );
                    })}
                  {Object.entries(financials.plItems).filter(([accName]) => accounts.find(a => a.name === accName)?.type === '費用').length === 0 && (
                    <div style={{ color: '#6b7280', fontSize: '12px', fontStyle: 'italic' }}>支出経費なし</div>
                  )}
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#f59e0b' }}>
                  <span>費用合計 (経費)</span>
                  <span>{financials.totalExpense.toLocaleString()}円</span>
                </div>
              </div>

              {/* Net profit statement card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: financials.netIncome >= 0 ? '#10b981' : '#f87171' }}>当期純利益</span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: financials.netIncome >= 0 ? '#10b981' : '#f87171' }}>
                    {financials.netIncome.toLocaleString()}円
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.4 }}>
                  ※ 家事按分により除外されたプライベート支出額 ({financials.personalExpenses.toLocaleString()}円) は費用から差し引かれ、B/S上に「事業主貸」として記録されています。
                </p>
              </div>

            </div>
          )}

        </div>
      )}

      {/* Tab: SETTINGS (Accounts & Apportionment) */}
      {activeSubTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Add custom account inline */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>新規勘定科目の追加</h3>
            {accountFormError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                ⚠️ {accountFormError}
              </div>
            )}
            
            <form onSubmit={handleAddAccount} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>科目名 (例: 水道光熱費)</label>
                <input
                  type="text"
                  placeholder="科目名"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '13px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>区分</label>
                <select
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value as any)}
                  style={{
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '13px',
                    height: '37px'
                  }}
                >
                  <option value="資産">資産</option>
                  <option value="負債">負債</option>
                  <option value="純資産">純資産</option>
                  <option value="収益">収益</option>
                  <option value="費用">費用</option>
                </select>
              </div>

              {newAccountType === '費用' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>家事按分比率 (事業%)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '0 8px', height: '37px' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newAccountRatio}
                      onChange={(e) => setNewAccountRatio(parseInt(e.target.value, 10) || 0)}
                      style={{
                        width: '45px',
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        outline: 'none',
                        fontSize: '13px',
                        textAlign: 'right'
                      }}
                    />
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>%</span>
                  </div>
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ padding: '8px 20px', height: '37px', fontSize: '13px' }}>
                追加
              </button>
            </form>
          </div>

          {/* Apportionment Ratio Settings for Expenses */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              経費の家事按分比率（事業利用割合）設定
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>
              スライダーを操作して各経費科目の「事業利用比率 (%)」を調整してください。変更はデータベースにリアルタイムで保存され、B/S・P/Lに即座に反映されます。
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {accounts
                .filter(acc => acc.type === '費用')
                .map(acc => (
                  <div key={acc.id} style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '24px'
                  }}>
                    <div style={{ flex: '0 0 150px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>{acc.name}</span>
                    </div>
                    
                    <div style={{ flex: '1', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={acc.business_ratio}
                        onChange={(e) => handleUpdateRatio(acc.id, parseInt(e.target.value, 10))}
                        style={{
                          width: '100%',
                          accentColor: '#a855f7',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                    
                    <div style={{ flex: '0 0 80px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={acc.business_ratio}
                        onChange={(e) => handleUpdateRatio(acc.id, parseInt(e.target.value, 10) || 0)}
                        style={{
                          width: '45px',
                          background: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '4px',
                          color: '#fff',
                          textAlign: 'right',
                          padding: '3px',
                          fontSize: '12px'
                        }}
                      />
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>%</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* General accounts listing */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>全登録勘定科目一覧</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {accounts.map(acc => {
                let badgeColor = 'rgba(255,255,255,0.05)';
                let textColor = '#94a3b8';
                if (acc.type === '資産') { badgeColor = 'rgba(56, 189, 248, 0.1)'; textColor = '#38bdf8'; }
                if (acc.type === '負債') { badgeColor = 'rgba(244, 114, 182, 0.1)'; textColor = '#f472b6'; }
                if (acc.type === '純資産') { badgeColor = 'rgba(168, 85, 247, 0.1)'; textColor = '#a855f7'; }
                if (acc.type === '収益') { badgeColor = 'rgba(16, 185, 129, 0.1)'; textColor = '#10b981'; }
                if (acc.type === '費用') { badgeColor = 'rgba(245, 158, 11, 0.1)'; textColor = '#f59e0b'; }

                return (
                  <div key={acc.id} style={{
                    background: badgeColor,
                    color: textColor,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.03)'
                  }}>
                    {acc.name} ({acc.type})
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
