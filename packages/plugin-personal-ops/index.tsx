import React, { useState, useEffect, useRef } from 'react';
import { IDatabaseConnection } from '../core/src/types';
import { pluginBus } from '../core/src/lib/bus/PluginBus';

interface PersonalOpsPluginProps {
  dbConnection?: IDatabaseConnection;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  due_date?: string | null; // YYYY-MM-DD
  mail_url?: string | null;  // Gmail URL
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface WorkLog {
  id: string;
  task_id: string;
  duration_minutes: number;
  memo: string;
  work_date: string;
  created_at: string;
  deleted_at?: string | null;
}

export interface Revenue {
  id: string;
  project: string;
  amount: number;
  accrued_date: string; // YYYY-MM-DD
  created_at: string;
  deleted_at?: string | null;
}

interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

export default function PersonalOpsPlugin({ dbConnection }: PersonalOpsPluginProps) {
  // Plugin sub-tabs
  const [pluginTab, setPluginTab] = useState<'tasks' | 'revenues' | 'calendar' | 'report' | 'backup'>('tasks');

  // DB States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Task Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [newDueDate, setNewDueDate] = useState('');
  const [newMailUrl, setNewMailUrl] = useState('');
  const [taskFormError, setTaskFormError] = useState<string | null>(null);

  // Manual log state
  const [selectedTaskIdForLog, setSelectedTaskIdForLog] = useState('');
  const [logDuration, setLogDuration] = useState('30');
  const [logMemo, setLogMemo] = useState('');
  const [logDate, setLogDate] = useState(() => {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  });

  // Revenue Form states
  const [revProject, setRevProject] = useState('');
  const [revAmount, setRevAmount] = useState('');
  const [revAccruedDate, setRevAccruedDate] = useState(() => {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  });
  const [revenueFormError, setRevenueFormError] = useState<string | null>(null);



  // Timer states
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);
  const [timerIsRunning, setTimerIsRunning] = useState(false);
  const [timerElapsedSeconds, setTimerElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calendar states
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth()); // 0-11
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  });

  // Daily Report states
  const [reportDate, setReportDate] = useState(() => {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  });
  const [reportMarkdown, setReportMarkdown] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Backup state
  const [lastExportStr, setLastExportStr] = useState<string | null>(() => {
    return localStorage.getItem('basekit_personal_last_export');
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any | null>(null);
  const [importModalError, setImportModalError] = useState<string | null>(null);

  // Load database data
  const loadData = async () => {
    if (!dbConnection) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      await ensureInitialData();

      // Fetch active tasks
      const tasksData = await dbConnection.query<Task[]>(
        'SELECT * FROM personal_tasks WHERE deleted_at IS NULL ORDER BY created_at DESC'
      );
      setTasks(tasksData || []);

      // Fetch active work logs
      const logsData = await dbConnection.query<WorkLog[]>(
        'SELECT * FROM personal_work_logs WHERE deleted_at IS NULL ORDER BY created_at DESC'
      );
      setWorkLogs(logsData || []);

      // Fetch revenues
      const revenuesData = await dbConnection.query<Revenue[]>(
        'SELECT * FROM personal_revenues WHERE deleted_at IS NULL ORDER BY accrued_date DESC, created_at DESC'
      );
      setRevenues(revenuesData || []);

      setError(null);
    } catch (err: any) {
      console.error('Failed to load personal-ops database content:', err);
      setError('データベースの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const ensureInitialData = async () => {
    if (!dbConnection) return;
    try {
      // Seed Tasks
      const activeTasks = await dbConnection.query<Task[]>(
        'SELECT * FROM personal_tasks WHERE deleted_at IS NULL'
      );
      const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });

      if (!activeTasks || activeTasks.length === 0) {
        const defaultTasks: Task[] = [
          {
            id: 'task-default-1',
            title: '【ロトツール】note毎週記事の自動生成バッチをテストする',
            description: '週末にバッチを動かして、noteの下書きがBOM付きUTF-8で正しく生成されるか確認。',
            status: 'TODO',
            priority: 'HIGH',
            due_date: todayStr,
            mail_url: 'https://mail.google.com/mail/u/0/#inbox',
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
            updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: 'task-default-2',
            title: '業務ツール第4弾・第5弾のnoteリリース告知投稿完了を確認',
            description: '無事にnoteに投稿完了。',
            status: 'DONE',
            priority: 'MEDIUM',
            due_date: todayStr,
            mail_url: null,
            created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
            updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          },
          {
            id: 'task-default-3',
            title: '新しい株価分析ベースキット（StockAnalyzerKit）の設計書作成',
            description: 'CRMベースキットのテンプレートに従って計画書をまとめる。',
            status: 'IN_PROGRESS',
            priority: 'LOW',
            due_date: todayStr,
            mail_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ];

        for (const task of defaultTasks) {
          await dbConnection.execute(
            'INSERT INTO personal_tasks (id, title, description, status, priority, due_date, mail_url, created_at, updated_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [task.id, task.title, task.description, task.status, task.priority, task.due_date, task.mail_url, task.created_at, task.updated_at, null]
          );
        }

        // Insert default log
        await dbConnection.execute(
          'INSERT INTO personal_work_logs (id, task_id, duration_minutes, memo, work_date, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          ['log-default-1', 'task-default-2', 45, 'リリース告知投稿完了の確認およびブラッシュアップ。', todayStr, new Date().toISOString(), null]
        );
      }

      // Seed Revenues
      const activeRevenues = await dbConnection.query<Revenue[]>(
        'SELECT * FROM personal_revenues WHERE deleted_at IS NULL'
      );
      if (!activeRevenues || activeRevenues.length === 0) {
        const defaultRevenues: Revenue[] = [
          {
            id: 'rev-default-1',
            project: '受託案件A：フロントエンドモックアップ開発',
            amount: 150000,
            accrued_date: todayStr,
            created_at: new Date().toISOString(),
          },
          {
            id: 'rev-default-2',
            project: 'note有料記事・サポート売上（6月分）',
            amount: 45000,
            accrued_date: todayStr,
            created_at: new Date().toISOString(),
          }
        ];
        for (const rev of defaultRevenues) {
          await dbConnection.execute(
            'INSERT INTO personal_revenues (id, project, amount, accrued_date, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6)',
            [rev.id, rev.project, rev.amount, rev.accrued_date, rev.created_at, null]
          );
        }
      }
    } catch (e) {
      console.error('Failed to initialize seed data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [dbConnection]);

  // Load and sync timer state from localStorage
  useEffect(() => {
    const savedTimer = localStorage.getItem('basekit_personal_timer_state');
    if (savedTimer) {
      try {
        const { taskId, isRunning, startTime, accumulatedSeconds } = JSON.parse(savedTimer);
        setActiveTimerTaskId(taskId);
        setTimerIsRunning(isRunning);

        if (isRunning) {
          const delta = Math.floor((Date.now() - startTime) / 1000);
          setTimerElapsedSeconds(accumulatedSeconds + delta);
        } else {
          setTimerElapsedSeconds(accumulatedSeconds);
        }
      } catch (e) {
        console.error('Failed to parse saved timer state', e);
      }
    }
  }, []);

  // Timer tick effect
  useEffect(() => {
    if (timerIsRunning && activeTimerTaskId) {
      timerIntervalRef.current = setInterval(() => {
        setTimerElapsedSeconds((prev) => {
          const newSeconds = prev + 1;
          const savedState = localStorage.getItem('basekit_personal_timer_state');
          if (savedState) {
            const parsed = JSON.parse(savedState);
            localStorage.setItem(
              'basekit_personal_timer_state',
              JSON.stringify({
                ...parsed,
                accumulatedSeconds: newSeconds,
                startTime: Date.now(),
              })
            );
          }
          return newSeconds;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerIsRunning, activeTimerTaskId]);

  const saveTimerState = (taskId: string | null, isRunning: boolean, accum: number) => {
    if (taskId) {
      localStorage.setItem(
        'basekit_personal_timer_state',
        JSON.stringify({
          taskId,
          isRunning,
          startTime: Date.now(),
          accumulatedSeconds: accum,
        })
      );
    } else {
      localStorage.removeItem('basekit_personal_timer_state');
    }
  };

  const handleStartTimer = (taskId: string) => {
    if (activeTimerTaskId && activeTimerTaskId !== taskId) {
      if (!window.confirm('別のタスクのタイマーが動作中です。切り替えてよろしいですか？')) {
        return;
      }
    }
    
    const isResumingSameTask = activeTimerTaskId === taskId;
    const initialSeconds = isResumingSameTask ? timerElapsedSeconds : 0;

    setActiveTimerTaskId(taskId);
    setTimerIsRunning(true);
    setTimerElapsedSeconds(initialSeconds);
    saveTimerState(taskId, true, initialSeconds);
  };

  const handlePauseTimer = () => {
    setTimerIsRunning(false);
    saveTimerState(activeTimerTaskId, false, timerElapsedSeconds);
  };

  const handleStopAndSaveTimer = async () => {
    if (!activeTimerTaskId || !dbConnection) return;

    setTimerIsRunning(false);
    const durationMin = Math.max(1, Math.round(timerElapsedSeconds / 60));
    const targetTask = tasks.find((t) => t.id === activeTimerTaskId);
    const taskName = targetTask ? targetTask.title : 'タスク';

    const memo = window.prompt('タイマーを停止しました。作業メモを入力してください（空欄可）:', `${taskName}のタイマー計測`);
    if (memo === null) {
      setTimerIsRunning(true);
      saveTimerState(activeTimerTaskId, true, timerElapsedSeconds);
      return;
    }

    try {
      const logId = crypto.randomUUID();
      const nowStr = new Date().toISOString();
      
      await dbConnection.execute(
        'INSERT INTO personal_work_logs (id, task_id, duration_minutes, memo, work_date, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [logId, activeTimerTaskId, durationMin, memo || `${taskName}のタイマー計測`, logDate, nowStr, null]
      );

      setActiveTimerTaskId(null);
      setTimerElapsedSeconds(0);
      saveTimerState(null, false, 0);

      await loadData();
      pluginBus.emit('personal-ops:work-log-added', {
        logId,
        taskId: activeTimerTaskId,
        taskTitle: taskName,
        durationMinutes: durationMin,
        memo: memo || `${taskName}のタイマー計測`,
        workDate: logDate
      });
    } catch (e) {
      console.error('Failed to save timer logs:', e);
      setError('作業ログの保存に失敗しました。');
    }
  };

  const handleCancelTimer = () => {
    if (window.confirm('計測中のタイマーを破棄しますか？作業時間は記録されません。')) {
      setTimerIsRunning(false);
      setActiveTimerTaskId(null);
      setTimerElapsedSeconds(0);
      saveTimerState(null, false, 0);
    }
  };

  // Add new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbConnection) return;

    if (!newTitle.trim()) {
      setTaskFormError('タスク名は必須です。');
      return;
    }

    try {
      const taskId = crypto.randomUUID();
      const nowStr = new Date().toISOString();

      await dbConnection.execute(
        'INSERT INTO personal_tasks (id, title, description, status, priority, due_date, mail_url, created_at, updated_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [
          taskId,
          newTitle.trim(),
          newDesc.trim(),
          'TODO',
          newPriority,
          newDueDate || null,
          newMailUrl.trim() || null,
          nowStr,
          nowStr,
          null
        ]
      );

      setNewTitle('');
      setNewDesc('');
      setNewPriority('MEDIUM');
      setNewDueDate('');
      setNewMailUrl('');
      setTaskFormError(null);
      await loadData();
    } catch (err) {
      console.error('Failed to create task:', err);
      setTaskFormError('タスクの登録に失敗しました。');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    if (!dbConnection) return;
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    try {
      const nowStr = new Date().toISOString();
      await dbConnection.execute(
        'UPDATE personal_tasks SET status = $1, updated_at = $2 WHERE id = $3',
        [newStatus, nowStr, taskId]
      );

      await loadData();

      if (newStatus === 'DONE') {
        pluginBus.emit('personal-ops:task-completed', {
          id: taskId,
          title: targetTask.title,
        });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!dbConnection || !window.confirm('このタスクを削除してもよろしいですか？')) return;
    try {
      const nowStr = new Date().toISOString();
      await dbConnection.execute(
        'UPDATE personal_tasks SET deleted_at = $1 WHERE id = $2',
        [nowStr, taskId]
      );
      await loadData();
    } catch (err) {
      console.error('Failed to logically delete task:', err);
    }
  };

  // Manual work log entry submit
  const handleManualLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbConnection || !selectedTaskIdForLog) return;

    const mins = parseInt(logDuration, 10);
    if (isNaN(mins) || mins <= 0) return;

    try {
      const logId = crypto.randomUUID();
      const nowStr = new Date().toISOString();
      const targetTask = tasks.find(t => t.id === selectedTaskIdForLog);
      const taskName = targetTask ? targetTask.title : 'タスク';

      await dbConnection.execute(
        'INSERT INTO personal_work_logs (id, task_id, duration_minutes, memo, work_date, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [logId, selectedTaskIdForLog, mins, logMemo || `${taskName}の手動工数入力`, logDate, nowStr, null]
      );

      setLogMemo('');
      setSelectedTaskIdForLog('');
      await loadData();

      pluginBus.emit('personal-ops:work-log-added', {
        logId,
        taskId: selectedTaskIdForLog,
        taskTitle: taskName,
        durationMinutes: mins,
        memo: logMemo || `${taskName}の手動工数入力`,
        workDate: logDate
      });
    } catch (err) {
      console.error('Failed to add manual work log:', err);
    }
  };

  // Create Revenue submit
  const handleCreateRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbConnection) return;

    const amt = parseInt(revAmount, 10);
    if (!revProject.trim() || isNaN(amt) || amt <= 0 || !revAccruedDate) {
      setRevenueFormError('正しい案件名、金額（1以上）、発生日を入力してください。');
      return;
    }

    try {
      const newId = crypto.randomUUID();
      const nowStr = new Date().toISOString();

      await dbConnection.execute(
        'INSERT INTO personal_revenues (id, project, amount, accrued_date, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [newId, revProject.trim(), amt, revAccruedDate, nowStr, null]
      );

      setRevProject('');
      setRevAmount('');
      setRevenueFormError(null);
      await loadData();
    } catch (err) {
      console.error('Failed to create revenue:', err);
      setRevenueFormError('売上の登録に失敗しました。');
    }
  };

  // Logical delete of revenue
  const handleDeleteRevenue = async (id: string) => {
    if (!dbConnection || !window.confirm('この売上レコードを削除してもよろしいですか？')) return;
    try {
      const nowStr = new Date().toISOString();
      await dbConnection.execute(
        'UPDATE personal_revenues SET deleted_at = $1 WHERE id = $2',
        [nowStr, id]
      );
      await loadData();
    } catch (err) {
      console.error('Failed to delete revenue:', err);
    }
  };

  // Helper calculations for revenues
  const currentMonthRevenues = revenues.filter(rev => {
    const today = new Date();
    const currentYearStr = String(today.getFullYear());
    const currentMonthStr = String(today.getMonth() + 1).padStart(2, '0');
    // accrued_date starts with e.g. "2026-07"
    return rev.accrued_date.startsWith(`${currentYearStr}-${currentMonthStr}`);
  });

  const totalMonthlyRevenue = currentMonthRevenues.reduce((sum, rev) => sum + rev.amount, 0);
  const monthlyGoal = 100000;
  const targetPercent = Math.min(100, Math.round((totalMonthlyRevenue / monthlyGoal) * 100));

  // Calendar logic
  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay(); // Sunday=0
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // Fill prev month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthTotalDays - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dateStr: d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })
      });
    }

    // Fill current month
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        isCurrentMonth: true,
        dateStr: d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })
      });
    }

    // Fill next month padding to reach 42 cells
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dateStr: d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })
      });
    }

    return days;
  };

  const calendarDays = getDaysInMonth(calendarYear, calendarMonth);

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(prev => prev - 1);
    } else {
      setCalendarMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(prev => prev + 1);
    } else {
      setCalendarMonth(prev => prev + 1);
    }
  };

  // Generate Daily Report from Audit Logs and active records
  const handleGenerateReport = async () => {
    if (!dbConnection) return;
    setIsGeneratingReport(true);
    try {
      // 1. Fetch Audit Logs matching reportDate
      const auditLogs = await dbConnection.query<AuditLog[]>(
        'SELECT * FROM audit_logs ORDER BY created_at ASC'
      );

      const jstOffset = 9 * 60 * 60 * 1000;
      const targetDayLogs = (auditLogs || []).filter(log => {
        if (!log.created_at) return false;
        try {
          const d = new Date(log.created_at);
          // offset to JST
          const jstD = new Date(d.getTime() + jstOffset);
          return jstD.toISOString().substring(0, 10) === reportDate;
        } catch {
          return false;
        }
      });

      // 2. Filter completed/todo tasks on reportDate JST
      const completedTasksToday = tasks.filter(t => {
        if (t.status !== 'DONE' || !t.updated_at) return false;
        try {
          const d = new Date(t.updated_at);
          const jstD = new Date(d.getTime() + jstOffset);
          return jstD.toISOString().substring(0, 10) === reportDate;
        } catch {
          return false;
        }
      });

      const activeTasksToday = tasks.filter(t => t.status !== 'DONE');

      // 3. Filter work logs on reportDate
      const logsToday = workLogs.filter(wl => wl.work_date === reportDate);
      const totalMinutesToday = logsToday.reduce((sum, wl) => sum + wl.duration_minutes, 0);

      // 4. Filter revenues on reportDate
      const revsToday = revenues.filter(rev => rev.accrued_date === reportDate);
      const totalRevenueToday = revsToday.reduce((sum, rev) => sum + rev.amount, 0);

      // 5. Build report markdown
      let md = `# 業務日報 (${reportDate})\n\n`;
      md += `**出力日時:** ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })} (ローカル時間)\n\n`;
      md += `---\n\n`;

      md += `## 1. 本日の操作履歴（タイムライン）\n\n`;
      if (targetDayLogs.length === 0) {
        md += `* 本日はシステム内での操作ログが記録されていません。\n`;
      } else {
        md += `| 時刻 | アクション | 対象テーブル | 詳細内容 |\n`;
        md += `| :--- | :--- | :--- | :--- |\n`;
        targetDayLogs.forEach(log => {
          const timeStr = new Date(log.created_at).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Tokyo'
          });
          let detail = '-';
          const targetVal = log.new_value || log.old_value;
          if (targetVal) {
            try {
              const parsed = JSON.parse(targetVal);
              detail = parsed.title || parsed.project || parsed.description || JSON.stringify(parsed);
            } catch {
              detail = targetVal;
            }
          }
          md += `| ${timeStr} | \`${log.action}\` | \`${log.table_name}\` | ${detail} |\n`;
        });
      }

      md += `\n## 2. 業務サマリー\n\n`;
      md += `### 🟢 完了したタスク (${completedTasksToday.length} 件)\n`;
      if (completedTasksToday.length === 0) {
        md += `- (なし)\n`;
      } else {
        completedTasksToday.forEach(t => {
          md += `- **${t.title}** ${t.description ? ` - ${t.description}` : ''}\n`;
        });
      }

      md += `\n### ⏱ 本日の工数実績 (${totalMinutesToday} 分)\n`;
      if (logsToday.length === 0) {
        md += `- (工数記録なし)\n`;
      } else {
        logsToday.forEach(wl => {
          const matchingTask = tasks.find(t => t.id === wl.task_id);
          md += `- 【${matchingTask ? matchingTask.title : '不明なタスク'}】 ${wl.duration_minutes}分 (${wl.memo || 'メモなし'})\n`;
        });
      }

      md += `\n### 💰 本日の売上実績 (¥${totalRevenueToday.toLocaleString()})\n`;
      if (revsToday.length === 0) {
        md += `- (売上なし)\n`;
      } else {
        revsToday.forEach(rev => {
          md += `- **${rev.project}**: ¥${rev.amount.toLocaleString()}\n`;
        });
      }

      md += `\n### 🔵 進行中・未着手タスク (${activeTasksToday.length} 件)\n`;
      if (activeTasksToday.length === 0) {
        md += `- (未完了タスクなし)\n`;
      } else {
        activeTasksToday.forEach(t => {
          const limitStr = t.due_date ? ` (締切: ${t.due_date})` : '';
          md += `- [ ] **${t.title}** [${t.status}]${limitStr}\n`;
        });
      }

      md += `\n---\n*本レポートは PersonalOps 監査ログおよび活動データより自動生成されました（完全ローカル隔離環境）*\n`;

      setReportMarkdown(md);
    } catch (err) {
      console.error('Failed to generate daily report:', err);
      setError('日報の生成に失敗しました。');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleCopyReport = () => {
    if (!reportMarkdown) return;
    navigator.clipboard.writeText(reportMarkdown);
    alert('日報をクリップボードにコピーしました！');
  };

  const handleDownloadReport = () => {
    if (!reportMarkdown) return;
    const blob = new Blob([reportMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `daily-report-${reportDate}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Backup Export/Import logic
  const handleExportJSON = () => {
    try {
      const backupData = {
        tasks,
        workLogs,
        revenues,
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const nowDay = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
      link.href = url;
      link.setAttribute('download', `basekit-personalops-backup-${nowDay}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Save last export date
      const exportTimeStr = new Date().toISOString();
      localStorage.setItem('basekit_personal_last_export', exportTimeStr);
      setLastExportStr(exportTimeStr);
      alert('バックアップファイルのエクスポートに成功しました！');
    } catch (e) {
      console.error('JSON export error:', e);
      alert('エクスポートに失敗しました。');
    }
  };

  // Drop or select json handler
  const handleJSONFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processJSONFile(files[0]);
  };

  const processJSONFile = (file: File) => {
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      alert('JSON形式のバックアップファイルを選択してください。');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.tasks || !data.workLogs || !data.revenues) {
          alert('不正なバックアップフォーマットです。必要なテーブルが存在しません。');
          return;
        }
        setPendingImportData(data);
        setShowImportModal(true);
        setImportModalError(null);
      } catch (err) {
        alert('ファイルの読み込みに失敗しました。有効なJSONファイルであることを確認してください。');
      }
    };
    reader.readAsText(file);
  };

  // Perform import
  const handleConfirmImport = async (method: 'overwrite' | 'merge') => {
    if (!dbConnection || !pendingImportData) return;
    try {
      const nowStr = new Date().toISOString();

      if (method === 'overwrite') {
        // Clear old tables (logic: we mark existing as deleted or we completely overwrite localStorage items)
        // With LocalStorageConnection we can just empty the key or execute queries. Let's do clear:
        await dbConnection.execute('UPDATE personal_tasks SET deleted_at = $1 WHERE deleted_at IS NULL', [nowStr]);
        await dbConnection.execute('UPDATE personal_work_logs SET deleted_at = $1 WHERE deleted_at IS NULL', [nowStr]);
        await dbConnection.execute('UPDATE personal_revenues SET deleted_at = $1 WHERE deleted_at IS NULL', [nowStr]);

        // Insert new records
        for (const task of pendingImportData.tasks) {
          await dbConnection.execute(
            'INSERT INTO personal_tasks (id, title, description, status, priority, due_date, mail_url, created_at, updated_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [task.id, task.title, task.description, task.status, task.priority, task.due_date || null, task.mail_url || null, task.created_at || nowStr, task.updated_at || nowStr, task.deleted_at || null]
          );
        }
        for (const wl of pendingImportData.workLogs) {
          await dbConnection.execute(
            'INSERT INTO personal_work_logs (id, task_id, duration_minutes, memo, work_date, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [wl.id, wl.task_id, wl.duration_minutes, wl.memo, wl.work_date, wl.created_at || nowStr, wl.deleted_at || null]
          );
        }
        for (const rev of pendingImportData.revenues) {
          await dbConnection.execute(
            'INSERT INTO personal_revenues (id, project, amount, accrued_date, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6)',
            [rev.id, rev.project, rev.amount, rev.accrued_date, rev.created_at || nowStr, rev.deleted_at || null]
          );
        }
      } else {
        // Merge - Insert only if ID does not exist in active lists
        const existingTaskIds = new Set(tasks.map(t => t.id));
        const existingLogIds = new Set(workLogs.map(wl => wl.id));
        const existingRevIds = new Set(revenues.map(rev => rev.id));

        for (const task of pendingImportData.tasks) {
          if (!existingTaskIds.has(task.id)) {
            await dbConnection.execute(
              'INSERT INTO personal_tasks (id, title, description, status, priority, due_date, mail_url, created_at, updated_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
              [task.id, task.title, task.description, task.status, task.priority, task.due_date || null, task.mail_url || null, task.created_at || nowStr, task.updated_at || nowStr, task.deleted_at || null]
            );
          }
        }
        for (const wl of pendingImportData.workLogs) {
          if (!existingLogIds.has(wl.id)) {
            await dbConnection.execute(
              'INSERT INTO personal_work_logs (id, task_id, duration_minutes, memo, work_date, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
              [wl.id, wl.task_id, wl.duration_minutes, wl.memo, wl.work_date, wl.created_at || nowStr, wl.deleted_at || null]
            );
          }
        }
        for (const rev of pendingImportData.revenues) {
          if (!existingRevIds.has(rev.id)) {
            await dbConnection.execute(
              'INSERT INTO personal_revenues (id, project, amount, accrued_date, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6)',
              [rev.id, rev.project, rev.amount, rev.accrued_date, rev.created_at || nowStr, rev.deleted_at || null]
            );
          }
        }
      }

      setShowImportModal(false);
      setPendingImportData(null);
      alert('インポートが正常に完了しました。');
      await loadData();
    } catch (err) {
      console.error(err);
      setImportModalError('インポート中にデータベースエラーが発生しました。');
    }
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processJSONFile(files[0]);
    }
  };

  // Days passed since last backup export
  const getBackupDaysPassed = () => {
    if (!lastExportStr) return -1;
    try {
      const diff = Date.now() - new Date(lastExportStr).getTime();
      return Math.floor(diff / (1000 * 60 * 60 * 24));
    } catch {
      return -1;
    }
  };
  const daysPassed = getBackupDaysPassed();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in" onDragOver={handleDragOver} onDrop={handleDrop}>
      
      {/* Backup Alert Banner */}
      {(daysPassed === -1 || daysPassed > 7) && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '12px',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <span style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 600 }}>
              {daysPassed === -1 
                ? '【重要】まだデータがバックアップされていません。ブラウザのデータ消失に備えてエクスポートを実行してください。'
                : `【重要】最終バックアップから ${daysPassed} 日が経過しています。最新のデータをエクスポートしてください。`}
            </span>
          </div>
          <button
            onClick={() => setPluginTab('backup')}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '12px', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', whiteSpace: 'nowrap' }}
          >
            バックアップ管理へ
          </button>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '14px', borderRadius: '12px', fontSize: '14px' }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '14px', borderRadius: '12px', fontSize: '14px' }}>
          🔄 データを読み込み中...
        </div>
      )}

      {/* Sub tabs switcher */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
        <button
          onClick={() => setPluginTab('tasks')}
          style={{
            background: pluginTab === 'tasks' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
            border: 'none',
            color: pluginTab === 'tasks' ? '#38bdf8' : '#94a3b8',
            padding: '8px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          タスク ＆ タイマー
        </button>
        <button
          onClick={() => setPluginTab('revenues')}
          style={{
            background: pluginTab === 'revenues' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
            border: 'none',
            color: pluginTab === 'revenues' ? '#10b981' : '#94a3b8',
            padding: '8px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          売上管理
        </button>
        <button
          onClick={() => setPluginTab('calendar')}
          style={{
            background: pluginTab === 'calendar' ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
            border: 'none',
            color: pluginTab === 'calendar' ? '#f59e0b' : '#94a3b8',
            padding: '8px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          月間カレンダー
        </button>
        <button
          onClick={() => setPluginTab('report')}
          style={{
            background: pluginTab === 'report' ? 'rgba(168, 85, 247, 0.12)' : 'transparent',
            border: 'none',
            color: pluginTab === 'report' ? '#a855f7' : '#94a3b8',
            padding: '8px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          日報自動生成
        </button>
        <button
          onClick={() => setPluginTab('backup')}
          style={{
            background: pluginTab === 'backup' ? 'rgba(244, 114, 182, 0.12)' : 'transparent',
            border: 'none',
            color: pluginTab === 'backup' ? '#f472b6' : '#94a3b8',
            padding: '8px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          データバックアップ
        </button>
      </div>

      {/* Tab: TASKS & TIMER */}
      {pluginTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Create Task Form */}
          <div className="glass-panel">
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
              新規タスク登録
            </h2>
            {taskFormError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>
                ⚠️ {taskFormError}
              </div>
            )}
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>タスク名 *</label>
                  <input
                    type="text"
                    placeholder="タスク概要を入力..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>優先度</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none', height: '41px' }}
                  >
                    <option value="LOW">低 (LOW)</option>
                    <option value="MEDIUM">中 (MEDIUM)</option>
                    <option value="HIGH">高 (HIGH)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>締切日</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>Gmail / チャット等の参照リンクURL</label>
                  <input
                    type="url"
                    placeholder="https://mail.google.com/..."
                    value={newMailUrl}
                    onChange={(e) => setNewMailUrl(e.target.value)}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>ノート (メモ)</label>
                <textarea
                  placeholder="詳細やメモを入力..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none', resize: 'vertical' }}
                  rows={2}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                タスクを追加
              </button>
            </form>
          </div>

          {/* Kanban / Task board */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            {/* TODO */}
            <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '12px', fontSize: '14px', fontWeight: 700, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                <span>TODO</span>
                <span>({tasks.filter(t => t.status === 'TODO').length})</span>
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '300px' }}>
                {tasks.filter(t => t.status === 'TODO').map(t => renderTaskCard(t))}
              </div>
            </div>

            {/* IN_PROGRESS */}
            <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '12px', fontSize: '14px', fontWeight: 700, color: '#38bdf8', display: 'flex', justifyContent: 'space-between' }}>
                <span>進行中 (DOING)</span>
                <span>({tasks.filter(t => t.status === 'IN_PROGRESS').length})</span>
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '300px' }}>
                {tasks.filter(t => t.status === 'IN_PROGRESS').map(t => renderTaskCard(t))}
              </div>
            </div>

            {/* DONE */}
            <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', fontSize: '14px', fontWeight: 700, color: '#10b981', display: 'flex', justifyContent: 'space-between' }}>
                <span>完了 (DONE)</span>
                <span>({tasks.filter(t => t.status === 'DONE').length})</span>
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '300px' }}>
                {tasks.filter(t => t.status === 'DONE').map(t => renderTaskCard(t))}
              </div>
            </div>
          </div>

          {/* Timer and manual log entry */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
            {/* Active timer module */}
            <div className="glass-panel" style={{
              border: activeTimerTaskId ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '30px',
              gap: '16px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {activeTimerTaskId ? (
                <>
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    fontSize: '11px',
                    color: '#38bdf8',
                    fontWeight: 600,
                    background: 'rgba(56, 189, 248, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    ⏱ タイマー計測中
                  </div>

                  <span style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 600, textAlign: 'center', maxWidth: '80%' }}>
                    {tasks.find(t => t.id === activeTimerTaskId)?.title}
                  </span>

                  <div className="pulsing-timer-glow" style={{
                    fontSize: '48px',
                    fontWeight: 800,
                    color: '#38bdf8',
                    fontFamily: 'monospace',
                    textShadow: '0 0 12px rgba(56, 189, 248, 0.4)',
                    animation: timerIsRunning ? 'pulse 2s infinite' : 'none'
                  }}>
                    {formatTime(timerElapsedSeconds)}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '10px' }}>
                    {timerIsRunning ? (
                      <button onClick={handlePauseTimer} className="btn-secondary" style={{ flex: 1 }}>一時停止</button>
                    ) : (
                      <button onClick={() => handleStartTimer(activeTimerTaskId)} className="btn-primary" style={{ flex: 1 }}>再開</button>
                    )}
                    <button onClick={handleStopAndSaveTimer} className="btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>記録＆停止</button>
                  </div>
                  <button onClick={handleCancelTimer} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>
                    タイマーを破棄
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280' }}>
                  <p style={{ fontSize: '14px', marginBottom: '8px' }}>⏱ 工数タイマー未始動</p>
                  <p style={{ fontSize: '11px' }}>各タスクカードの「タイマー開始」ボタンから計測できます。</p>
                </div>
              )}
            </div>

            {/* Manual log form */}
            <div className="glass-panel">
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>過去実績の手動工数入力</h3>
              <form onSubmit={handleManualLogSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>対象タスク</label>
                    <select
                      value={selectedTaskIdForLog}
                      onChange={(e) => setSelectedTaskIdForLog(e.target.value)}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', color: '#fff', outline: 'none' }}
                      required
                    >
                      <option value="">-- タスクを選択 --</option>
                      {tasks.map(t => (
                        <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>作業時間 (分)</label>
                    <input
                      type="number"
                      min="1"
                      value={logDuration}
                      onChange={(e) => setLogDuration(e.target.value)}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', color: '#fff', outline: 'none' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>作業日</label>
                    <input
                      type="date"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', color: '#fff', outline: 'none' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>作業メモ</label>
                    <input
                      type="text"
                      placeholder="何を行いましたか？"
                      value={logMemo}
                      onChange={(e) => setLogMemo(e.target.value)}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px', color: '#fff', outline: 'none' }}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-secondary" style={{ width: '100%', marginTop: '6px' }}>
                  作業ログを記録
                </button>
              </form>
            </div>
          </div>

          {/* Work log history list */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>最近の作業ログ履歴</h3>
            {workLogs.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>作業ログがありません。</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                      <th style={{ textAlign: 'left', padding: '8px' }}>作業日</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>タスク名</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>作業時間 (分)</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>メモ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workLogs.slice(0, 10).map((wl) => {
                      const associatedTask = tasks.find(t => t.id === wl.task_id);
                      return (
                        <tr key={wl.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '8px', color: '#94a3b8' }}>{wl.work_date}</td>
                          <td style={{ padding: '8px', fontWeight: 600 }}>{associatedTask ? associatedTask.title : '不明なタスク'}</td>
                          <td style={{ padding: '8px' }}>{wl.duration_minutes} 分</td>
                          <td style={{ padding: '8px', color: '#94a3b8' }}>{wl.memo}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: REVENUES (移植) */}
      {pluginTab === 'revenues' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
            
            {/* Left: Goals & Goal Filling */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#10b981', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                今月の売上目標
              </h2>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>今月の総売上実績</span>
                <span style={{ fontSize: '32px', fontWeight: 800, color: '#10b981' }}>
                  ¥{totalMonthlyRevenue.toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                  <span>目標達成率 (目標 ¥{monthlyGoal.toLocaleString()})</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>{targetPercent}%</span>
                </div>
                <div style={{ width: '100%', height: '12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{
                    width: `${targetPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                    borderRadius: '6px',
                    transition: 'width 0.4s ease'
                  }}></div>
                </div>
              </div>
            </div>

            {/* Right: Accrue Revenue Form */}
            <div className="glass-panel">
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                新規売上の計上
              </h2>
              {revenueFormError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>
                  ⚠️ {revenueFormError}
                </div>
              )}
              
              <form onSubmit={handleCreateRevenue} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>案件名 / 業務内容 *</label>
                  <input
                    type="text"
                    placeholder="例: フロントエンドモックアップ開発"
                    value={revProject}
                    onChange={(e) => setRevProject(e.target.value)}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 12px', color: '#fff', outline: 'none' }}
                    required
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>金額 (円) *</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="金額"
                      value={revAmount}
                      onChange={(e) => setRevAmount(e.target.value)}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 12px', color: '#fff', outline: 'none' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>発生日 *</label>
                    <input
                      type="date"
                      value={revAccruedDate}
                      onChange={(e) => setRevAccruedDate(e.target.value)}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 12px', color: '#fff', outline: 'none' }}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '6px' }}>
                  売上を登録
                </button>
              </form>
            </div>

          </div>

          {/* Revenue Ledger History */}
          <div className="glass-panel">
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>売上履歴</h2>
            {revenues.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>売上データがありません。</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                      <th style={{ textAlign: 'left', padding: '10px 8px' }}>発生日</th>
                      <th style={{ textAlign: 'left', padding: '10px 8px' }}>案件名</th>
                      <th style={{ textAlign: 'right', padding: '10px 8px' }}>売上額</th>
                      <th style={{ textAlign: 'center', padding: '10px 8px', width: '80px' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenues.map((rev) => (
                      <tr key={rev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 8px', color: '#94a3b8' }}>{rev.accrued_date}</td>
                        <td style={{ padding: '10px 8px', fontWeight: 600 }}>{rev.project}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>¥{rev.amount.toLocaleString()}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteRevenue(rev.id)}
                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
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

      {/* Tab: CALENDAR (移植) */}
      {pluginTab === 'calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
          
          <div className="glass-panel">
            {/* Header controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b' }}>
                カレンダー・スケジュール ({calendarYear}年 {calendarMonth + 1}月)
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handlePrevMonth} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '13px' }}>前月</button>
                <button onClick={handleNextMonth} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '13px' }}>翌月</button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '16px' }}>
              {['日', '月', '火', '水', '木', '金', '土'].map((w, idx) => (
                <div key={idx} style={{ padding: '8px', fontSize: '12px', fontWeight: 700, color: idx === 0 ? '#f87171' : idx === 6 ? '#60a5fa' : '#94a3b8' }}>
                  {w}
                </div>
              ))}

              {calendarDays.map((cell, idx) => {
                // Find tasks due on this date
                const dueTasks = tasks.filter(t => t.due_date === cell.dateStr);
                const isSelected = selectedCalendarDate === cell.dateStr;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedCalendarDate(cell.dateStr);
                      setReportDate(cell.dateStr); // 連動
                    }}
                    style={{
                      minHeight: '80px',
                      background: isSelected 
                        ? 'rgba(245, 158, 11, 0.15)' 
                        : cell.isCurrentMonth ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.005)',
                      border: isSelected 
                        ? '1px solid #f59e0b' 
                        : '1px solid rgba(255, 255, 255, 0.04)',
                      borderRadius: '8px',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'stretch',
                      opacity: cell.isCurrentMonth ? 1 : 0.4,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: cell.date.getDay() === 0 ? '#f87171' : cell.date.getDay() === 6 ? '#60a5fa' : '#fff'
                    }}>
                      {cell.date.getDate()}
                    </span>

                    {dueTasks.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {dueTasks.slice(0, 2).map((t, tIdx) => (
                          <div key={tIdx} style={{
                            background: t.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : t.priority === 'MEDIUM' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                            color: t.priority === 'HIGH' ? '#f87171' : t.priority === 'MEDIUM' ? '#fbbf24' : '#38bdf8',
                            fontSize: '9px',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            textAlign: 'left'
                          }}>
                            {t.title}
                          </div>
                        ))}
                        {dueTasks.length > 2 && (
                          <span style={{ fontSize: '8px', color: '#6b7280', textAlign: 'left' }}>他 {dueTasks.length - 2} 件...</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected day tasks drawer */}
            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b', marginBottom: '12px' }}>
                📅 選択日 ({selectedCalendarDate}) のタスク締切
              </h3>
              {tasks.filter(t => t.due_date === selectedCalendarDate).length === 0 ? (
                <p style={{ fontSize: '12px', color: '#6b7280' }}>この日が締切のタスクはありません。</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tasks.filter(t => t.due_date === selectedCalendarDate).map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', background: '#0f172a', padding: '8px 12px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{t.title}</span>
                      <span style={{
                        background: t.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.1)' : t.priority === 'MEDIUM' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                        color: t.priority === 'HIGH' ? '#f87171' : t.priority === 'MEDIUM' ? '#f59e0b' : '#38bdf8',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700
                      }}>
                        {t.priority}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
          
        </div>
      )}

      {/* Tab: DAILY REPORT (移植) */}
      {pluginTab === 'report' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
          <div className="glass-panel">
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#a855f7', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '16px' }}>
              日報の自動生成
            </h2>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '24px' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>対象日</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
                />
              </div>
              <button onClick={handleGenerateReport} className="btn-primary" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', height: '41px', padding: '0 24px', fontSize: '13px' }} disabled={isGeneratingReport}>
                {isGeneratingReport ? '日報を生成中...' : '日報を生成'}
              </button>
            </div>

            {reportMarkdown ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', background: '#0f172a', padding: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                  <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '13px', color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {reportMarkdown}
                  </pre>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleCopyReport} className="btn-secondary" style={{ flex: 1 }}>コピー</button>
                  <button onClick={handleDownloadReport} className="btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' }}>日報をダウンロード (.md)</button>
                  <button onClick={() => window.print()} className="btn-secondary" style={{ flex: 1 }}>印刷プレビュー</button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280', fontSize: '13px' }}>
                対象日を選択して「日報を生成」ボタンを押すと、自動的にMarkdownテキストが生成されます。
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: BACKUP (移植) */}
      {pluginTab === 'backup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
            
            {/* Left: stats & export */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f472b6', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                バックアップの保存
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#94a3b8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>全登録タスク数</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>{tasks.length} 件</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>全作業ログ履歴数</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>{workLogs.length} 件</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>全売上実績数</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>{revenues.length} 件</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '4px' }}>
                  <span>最終バックアップ日時</span>
                  <span style={{ color: '#f472b6', fontWeight: 600 }}>
                    {lastExportStr ? new Date(lastExportStr).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '未実行'}
                  </span>
                </div>
              </div>

              <button onClick={handleExportJSON} className="btn-primary" style={{ background: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)', width: '100%' }}>
                JSON形式でエクスポート
              </button>
            </div>

            {/* Right: import */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '16px' }}>
                  データのインポート / 復元
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
                  過去にエクスポートしたJSONバックアップファイルを選択、またはこのパネル上に直接ドラッグ＆ドロップしてデータを復元します。
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <input
                  type="file"
                  id="import-json-file"
                  accept=".json"
                  onChange={handleJSONFileSelect}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => document.getElementById('import-json-file')?.click()}
                  className="btn-secondary"
                  style={{ width: '100%', border: '1px dashed rgba(244,114,182,0.3)', color: '#f472b6', padding: '16px', borderRadius: '10px', background: 'rgba(244,114,182,0.02)' }}
                >
                  📁 バックアップファイルを読み込む (.json)
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Import Modal */}
      {showImportModal && pendingImportData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(9, 13, 22, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="glass-panel" style={{ width: '450px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📥 バックアップインポートの確認</span>
            </h3>
            
            <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.6 }}>
              <p style={{ fontWeight: 600, color: '#f59e0b', marginBottom: '10px' }}>
                検出されたレコード数:
              </p>
              <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                <li>タスク: {pendingImportData.tasks?.length || 0} 件</li>
                <li>作業ログ: {pendingImportData.workLogs?.length || 0} 件</li>
                <li>売上実績: {pendingImportData.revenues?.length || 0} 件</li>
              </ul>
              
              <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>インポート方法を選択してください：</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', fontSize: '11px', color: '#94a3b8' }}>
                <div><strong>【上書き復元】</strong>: 現在のデータをすべて論理削除し、ファイルの内容で置き換えます。</div>
                <div><strong>【マージ追加】</strong>: 既存データを残したまま、IDの重複しない新規レコードのみを追加します。</div>
              </div>
            </div>

            {importModalError && (
              <p style={{ color: '#f87171', fontSize: '12px' }}>{importModalError}</p>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={() => { setShowImportModal(false); setPendingImportData(null); }} className="btn-secondary" style={{ flex: 1 }}>キャンセル</button>
              <button onClick={() => handleConfirmImport('merge')} className="btn-secondary" style={{ flex: 1, borderColor: 'rgba(168, 85, 247, 0.4)', color: '#c084fc' }}>マージ追加</button>
              <button onClick={() => handleConfirmImport('overwrite')} className="btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)' }}>上書き復元</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  // Helper renderer for Task card
  function renderTaskCard(t: Task) {
    const isOverdue = t.due_date && new Date(t.due_date) < new Date(new Date().setHours(0, 0, 0, 0));
    return (
      <div key={t.id} style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: '8px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'; }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', textDecoration: t.status === 'DONE' ? 'line-through' : 'none', opacity: t.status === 'DONE' ? 0.5 : 1 }}>
            {t.title}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{
              background: t.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : t.priority === 'MEDIUM' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)',
              color: t.priority === 'HIGH' ? '#f87171' : t.priority === 'MEDIUM' ? '#fbbf24' : '#38bdf8',
              fontSize: '9px',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '4px'
            }}>{t.priority}</span>
            <button
              onClick={() => handleDeleteTask(t.id)}
              style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '11px' }}
              title="削除"
            >
              ✕
            </button>
          </div>
        </div>

        {t.description && (
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, lineBreak: 'anywhere' }}>{t.description}</p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontSize: '11px' }}>
          {t.due_date && (
            <span style={{ color: isOverdue ? '#f87171' : '#94a3b8', fontWeight: isOverdue ? 700 : 'normal' }}>
              📅 {t.due_date} {isOverdue && '(期限超過)'}
            </span>
          )}
          {t.mail_url && (
            <a href={t.mail_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>
              🔗 メール
            </a>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px', marginTop: '4px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {t.status === 'TODO' && (
              <button onClick={() => handleStatusChange(t.id, 'IN_PROGRESS')} className="btn-secondary" style={{ padding: '2px 8px', fontSize: '10px' }}>進行中にする</button>
            )}
            {t.status === 'IN_PROGRESS' && (
              <>
                <button onClick={() => handleStatusChange(t.id, 'TODO')} className="btn-secondary" style={{ padding: '2px 8px', fontSize: '10px' }}>TODOに戻す</button>
                <button onClick={() => handleStatusChange(t.id, 'DONE')} className="btn-primary" style={{ padding: '2px 8px', fontSize: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>完了にする</button>
              </>
            )}
            {t.status === 'DONE' && (
              <button onClick={() => handleStatusChange(t.id, 'IN_PROGRESS')} className="btn-secondary" style={{ padding: '2px 8px', fontSize: '10px' }}>進行中に戻す</button>
            )}
          </div>
          {t.status !== 'DONE' && (
            activeTimerTaskId === t.id ? (
              <button onClick={handleStopAndSaveTimer} className="btn-primary" style={{ padding: '2px 8px', fontSize: '10px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>停止</button>
            ) : (
              <button onClick={() => handleStartTimer(t.id)} className="btn-secondary" style={{ padding: '2px 8px', fontSize: '10px', color: '#38bdf8' }}>タイマー開始</button>
            )
          )}
        </div>
      </div>
    );
  }

  // Format elapsed seconds into HH:MM:SS
  function formatTime(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
      hours > 0 ? String(hours).padStart(2, '0') : null,
      String(minutes).padStart(2, '0'),
      String(seconds).padStart(2, '0')
    ].filter(Boolean).join(':');
  }
}
