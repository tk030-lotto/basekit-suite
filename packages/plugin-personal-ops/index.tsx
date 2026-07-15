import React, { useState, useEffect, useRef } from 'react';
import { IDatabaseConnection } from '../core/src/types';
import { pluginBus } from '../core/src/lib/bus/PluginBus';

interface PersonalOpsPluginProps {
  dbConnection?: IDatabaseConnection;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

interface WorkLog {
  id: string;
  task_id: string;
  duration_minutes: number;
  memo: string;
  work_date: string;
  created_at: string;
  deleted_at?: string | null;
}

export default function PersonalOpsPlugin({ dbConnection }: PersonalOpsPluginProps) {
  // DB status & lists
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Forms state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  const [selectedTaskIdForLog, setSelectedTaskIdForLog] = useState('');
  const [logDuration, setLogDuration] = useState('30');
  const [logMemo, setLogMemo] = useState('');
  const [logDate, setLogDate] = useState(() => {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  });

  // Filter & tab state
  const [activeFilterTab, setActiveFilterTab] = useState<'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE'>('ALL');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Timer states
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);
  const [timerIsRunning, setTimerIsRunning] = useState(false);
  const [timerElapsedSeconds, setTimerElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load database data
  const loadData = async () => {
    if (!dbConnection) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
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
      setError(null);
    } catch (err: any) {
      console.error('Failed to load database content:', err);
      setError('データベースの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // Seed default tasks if empty
  const ensureInitialData = async () => {
    if (!dbConnection) return;
    try {
      const activeTasks = await dbConnection.query<Task[]>(
        'SELECT * FROM personal_tasks WHERE deleted_at IS NULL'
      );
      if (!activeTasks || activeTasks.length === 0) {
        const defaultTasks: Task[] = [
          {
            id: 'task-default-1',
            title: 'BaseKitの基本設計を確認する',
            description: 'packages/core 配下や各種ドキュメントを読み込み、システム構成を把握する。',
            status: 'DONE',
            priority: 'HIGH',
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
            updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: 'task-default-2',
            title: '個人業務効率化プラグインの動作検証',
            description: 'タスク追加、タイマー動作、LocalStorageConnection によるクエリ実行の正常確認。',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'task-default-3',
            title: '複式簿記プラグインとSNSプラグインの開発設計',
            description: '次フェーズ以降に予定されている残りのプラグイン機能の結合方式を策定する。',
            status: 'TODO',
            priority: 'LOW',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ];

        for (const task of defaultTasks) {
          await dbConnection.execute(
            'INSERT INTO personal_tasks (id, title, description, status, priority, created_at, updated_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [task.id, task.title, task.description, task.status, task.priority, task.created_at, task.updated_at, null]
          );
        }

        // Insert default log
        await dbConnection.execute(
          'INSERT INTO personal_work_logs (id, task_id, duration_minutes, memo, work_date, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          ['log-default-1', 'task-default-1', 45, '基本設計書およびソース読込完了。', logDate, new Date().toISOString(), null]
        );
      }
    } catch (e) {
      console.error('Failed to initialize seed data:', e);
    }
  };

  // Initialize DB and load
  useEffect(() => {
    const init = async () => {
      if (dbConnection) {
        await ensureInitialData();
        await loadData();
      }
    };
    init();
  }, [dbConnection]);

  // Load and sync timer state from localStorage (browser survival)
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
          // Periodically save state to protect against abrupt close
          const savedState = localStorage.getItem('basekit_personal_timer_state');
          if (savedState) {
            const parsed = JSON.parse(savedState);
            localStorage.setItem(
              'basekit_personal_timer_state',
              JSON.stringify({
                ...parsed,
                accumulatedSeconds: newSeconds,
                startTime: Date.now(), // update start time to match current sync point
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

  // Save current timer configuration to localstorage
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

  // Timer controls
  const handleStartTimer = (taskId: string) => {
    if (activeTimerTaskId && activeTimerTaskId !== taskId) {
      if (!confirm('別のタスクのタイマーが動作中です。切り替えてよろしいですか？')) {
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

    const memo = prompt('タイマーを停止しました。作業メモを入力してください（空欄可）:', `${taskName}のタイマー計測`);
    if (memo === null) {
      // User cancelled
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

      // Clean up timer
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
      alert(`作業時間 ${durationMin} 分を記録しました！`);
    } catch (e) {
      console.error('Failed to save timer logs:', e);
      alert('エラー：作業ログの保存に失敗しました。');
    }
  };

  const handleCancelTimer = () => {
    if (confirm('計測中のタイマーを破棄しますか？作業時間は記録されません。')) {
      setTimerIsRunning(false);
      setActiveTimerTaskId(null);
      setTimerElapsedSeconds(0);
      saveTimerState(null, false, 0);
    }
  };

  // Add Task Action
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !dbConnection) return;

    try {
      const taskId = crypto.randomUUID();
      const nowStr = new Date().toISOString();

      await dbConnection.execute(
        'INSERT INTO personal_tasks (id, title, description, status, priority, created_at, updated_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [taskId, newTitle.trim(), newDesc.trim(), 'TODO', newPriority, nowStr, nowStr, null]
      );

      setNewTitle('');
      setNewDesc('');
      setNewPriority('MEDIUM');
      await loadData();
    } catch (e) {
      console.error('Failed to create task:', e);
      alert('エラー：タスクの作成に失敗しました。');
    }
  };

  // Update Task Status
  const handleUpdateStatus = async (taskId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    if (!dbConnection) return;
    try {
      const nowStr = new Date().toISOString();
      await dbConnection.execute(
        'UPDATE personal_tasks SET status = $1, updated_at = $2 WHERE id = $3',
        [status, nowStr, taskId]
      );
      await loadData();
      if (status === 'DONE') {
        const targetTask = tasks.find(t => t.id === taskId);
        pluginBus.emit('personal-ops:task-completed', {
          taskId,
          title: targetTask ? targetTask.title : '不明なタスク'
        });
      }
    } catch (e) {
      console.error('Failed to update status:', e);
      alert('エラー：ステータスの更新に失敗しました。');
    }
  };

  // Edit Task Save
  const handleSaveEdit = async () => {
    if (!editingTask || !editingTask.title.trim() || !dbConnection) return;
    try {
      const nowStr = new Date().toISOString();
      await dbConnection.execute(
        'UPDATE personal_tasks SET title = $1, description = $2, priority = $3, updated_at = $4 WHERE id = $5',
        [editingTask.title.trim(), editingTask.description, editingTask.priority, nowStr, editingTask.id]
      );
      setEditingTask(null);
      await loadData();
    } catch (e) {
      console.error('Failed to save task edits:', e);
      alert('エラー：タスクの更新に失敗しました。');
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('このタスクを削除しますか？（記録された作業ログは保持されます）') || !dbConnection) return;
    try {
      const nowStr = new Date().toISOString();
      await dbConnection.execute(
        'UPDATE personal_tasks SET deleted_at = $1 WHERE id = $2',
        [nowStr, taskId]
      );

      // If active timer was on this task, clear it
      if (activeTimerTaskId === taskId) {
        setTimerIsRunning(false);
        setActiveTimerTaskId(null);
        setTimerElapsedSeconds(0);
        saveTimerState(null, false, 0);
      }

      await loadData();
    } catch (e) {
      console.error('Failed to delete task:', e);
      alert('エラー：タスクの削除に失敗しました。');
    }
  };

  // Add Manual Work Log
  const handleAddManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskIdForLog || !logDuration || !dbConnection) {
      alert('タスクを選択し、時間を入力してください。');
      return;
    }

    const durationMin = parseInt(logDuration, 10);
    if (isNaN(durationMin) || durationMin <= 0) {
      alert('作業時間は1分以上の数値を入力してください。');
      return;
    }

    try {
      const logId = crypto.randomUUID();
      const nowStr = new Date().toISOString();

      await dbConnection.execute(
        'INSERT INTO personal_work_logs (id, task_id, duration_minutes, memo, work_date, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          logId,
          selectedTaskIdForLog,
          durationMin,
          logMemo.trim() || '手動作業時間記録',
          logDate,
          nowStr,
          null
        ]
      );

      setLogMemo('');
      setLogDuration('30');
      await loadData();
      const targetTask = tasks.find(t => t.id === selectedTaskIdForLog);
      const taskName = targetTask ? targetTask.title : 'タスク';
      pluginBus.emit('personal-ops:work-log-added', {
        logId,
        taskId: selectedTaskIdForLog,
        taskTitle: taskName,
        durationMinutes: durationMin,
        memo: logMemo.trim() || '手動作業時間記録',
        workDate: logDate
      });
    } catch (e) {
      console.error('Failed to save manual log:', e);
      alert('エラー：ログの保存に失敗しました。');
    }
  };

  // Delete Log
  const handleDeleteLog = async (logId: string) => {
    if (!confirm('この作業記録を削除しますか？') || !dbConnection) return;
    try {
      const nowStr = new Date().toISOString();
      await dbConnection.execute(
        'UPDATE personal_work_logs SET deleted_at = $1 WHERE id = $2',
        [nowStr, logId]
      );
      await loadData();
    } catch (e) {
      console.error('Failed to delete log:', e);
      alert('エラー：ログの削除に失敗しました。');
    }
  };

  // Formatting helpers
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  // Stats calculation
  const getTaskTotalLoggedMinutes = (taskId: string) => {
    return workLogs
      .filter((log) => log.task_id === taskId)
      .reduce((sum, log) => sum + log.duration_minutes, 0);
  };

  const totalLoggedMinutes = workLogs.reduce((sum, log) => sum + log.duration_minutes, 0);
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === 'DONE').length;

  const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  const loggedMinutesToday = workLogs
    .filter((log) => log.work_date === todayStr)
    .reduce((sum, log) => sum + log.duration_minutes, 0);

  // Filtered task logic
  const filteredTasks = tasks.filter((t) => {
    if (activeFilterTab === 'ALL') return true;
    return t.status === activeFilterTab;
  });

  // Styles Injection
  const stylesInject = `
    @keyframes pulse-glow {
      0%, 100% {
        box-shadow: 0 0 15px rgba(14, 165, 233, 0.4), inset 0 0 5px rgba(14, 165, 233, 0.2);
        transform: scale(1);
      }
      50% {
        box-shadow: 0 0 30px rgba(14, 165, 233, 0.7), inset 0 0 10px rgba(14, 165, 233, 0.4);
        transform: scale(1.02);
      }
    }
    .pulse-animation {
      animation: pulse-glow 2s infinite ease-in-out;
    }
    .task-row:hover {
      background: rgba(255, 255, 255, 0.03) !important;
    }
    .grid-responsive-layout {
      display: grid;
      grid-template-columns: 1fr;
      align-items: flex-start;
    }
    @media (min-width: 1024px) {
      .grid-responsive-layout.main-grid {
        grid-template-columns: 3fr 2fr;
      }
    }
    .grid-responsive-form {
      display: grid;
      grid-template-columns: 1fr;
    }
    @media (min-width: 768px) {
      .grid-responsive-form {
        grid-template-columns: 2fr 1fr;
      }
    }
  `;

  if (!dbConnection) {
    return (
      <div style={{ padding: '24px', color: '#94a3b8', textAlign: 'center' }}>
        <h2 style={{ color: '#f43f5e', marginBottom: '16px' }}>DB未接続</h2>
        <p>有効な IDatabaseConnection プロップが提供されていません。</p>
      </div>
    );
  }

  return (
    <div style={{ color: '#f8fafc', padding: '10px 0' }}>
      <style>{stylesInject}</style>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#f87171',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      )}

      {/* Overview Statistics Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '20px', background: 'rgba(17, 24, 39, 0.45)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>タスク進捗率</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: '#38bdf8' }}>
              {totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0}%
            </span>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>({completedTasksCount} / {totalTasksCount} 完了)</span>
          </div>
          {/* Progress bar */}
          <div style={{ background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
            <div style={{
              width: `${totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0}%`,
              background: 'linear-gradient(90deg, #38bdf8 0%, #a855f7 100%)',
              height: '100%',
              borderRadius: '3px',
              transition: 'width 0.4s ease-out'
            }}></div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: 'rgba(17, 24, 39, 0.45)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>本日の工数合計</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>
              {(loggedMinutesToday / 60).toFixed(1)}
            </span>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>時間 ({loggedMinutesToday} 分)</span>
          </div>
          <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '12px' }}>日付: {todayStr}</p>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: 'rgba(17, 24, 39, 0.45)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>累積合計工数</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: '#c084fc' }}>
              {(totalLoggedMinutes / 60).toFixed(1)}
            </span>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>時間 ({totalLoggedMinutes} 分)</span>
          </div>
          <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '12px' }}>全タスクの累積合計時間</p>
        </div>
      </section>

      {/* Main Interface Layout */}
      <div className="grid-responsive-layout main-grid" style={{ gap: '32px' }}>
        
        {/* Left Column: Tasks Section */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Add Task Block */}
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(17,24,39,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>➕</span> 新しいタスクを追加
            </h3>
            <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="grid-responsive-form" style={{ gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>タスクタイトル</label>
                  <input
                    type="text"
                    placeholder="例：週報の作成と提出"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>優先度</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value="LOW">低 (LOW)</option>
                    <option value="MEDIUM">中 (MEDIUM)</option>
                    <option value="HIGH">高 (HIGH)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>タスク詳細（メモ）</label>
                <textarea
                  placeholder="タスクの具体的な内容やリンクなどを記入"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '14px',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px' }}>
                  <span>タスクを作成</span>
                </button>
              </div>
            </form>
          </div>

          {/* Tasks List Block */}
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(17,24,39,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>📝 タスク一覧</h3>
              
              {/* Tabs */}
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {(['ALL', 'TODO', 'IN_PROGRESS', 'DONE'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFilterTab(tab)}
                    style={{
                      background: activeFilterTab === tab ? '#38bdf8' : 'transparent',
                      color: activeFilterTab === tab ? '#0b0f19' : '#94a3b8',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {tab === 'ALL' && 'すべて'}
                    {tab === 'TODO' && '未着手'}
                    {tab === 'IN_PROGRESS' && '進行中'}
                    {tab === 'DONE' && '完了'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                <span>データを読み込んでいます...</span>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <span>該当するタスクはありません。</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredTasks.map((task) => {
                  const loggedMinutes = getTaskTotalLoggedMinutes(task.id);
                  const isThisTaskTimerRunning = activeTimerTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      className="task-row"
                      style={{
                        background: 'rgba(30, 41, 59, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                        
                        {/* Title & priority */}
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {/* Priority Badge */}
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: task.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : task.priority === 'MEDIUM' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: task.priority === 'HIGH' ? '#f87171' : task.priority === 'MEDIUM' ? '#fbbf24' : '#34d399',
                              border: `1px solid ${task.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : task.priority === 'MEDIUM' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                            }}>
                              {task.priority}
                            </span>
                            
                            {/* Status Badge */}
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: task.status === 'DONE' ? 'rgba(16, 185, 129, 0.1)' : task.status === 'IN_PROGRESS' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(107, 114, 128, 0.15)',
                              color: task.status === 'DONE' ? '#10b981' : task.status === 'IN_PROGRESS' ? '#38bdf8' : '#94a3b8',
                              border: `1px solid ${task.status === 'DONE' ? 'rgba(16, 185, 129, 0.2)' : task.status === 'IN_PROGRESS' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(107, 114, 128, 0.2)'}`
                            }}>
                              {task.status === 'DONE' ? '完了' : task.status === 'IN_PROGRESS' ? '進行中' : '未着手'}
                            </span>

                            {/* Logged time badge */}
                            {loggedMinutes > 0 && (
                              <span style={{ fontSize: '11px', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                ⏱️ {loggedMinutes}分 記録済
                              </span>
                            )}
                          </div>

                          <h4 style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            marginTop: '8px',
                            color: '#fff',
                            textDecoration: task.status === 'DONE' ? 'line-through' : 'none',
                            opacity: task.status === 'DONE' ? 0.6 : 1
                          }}>
                            {task.title}
                          </h4>

                          {task.description && (
                            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Dropdown status switcher / Edit buttons */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={() => setEditingTask(task)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              fontSize: '14px',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              transition: 'color 0.2s'
                            }}
                            title="タスクを編集"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#f87171',
                              cursor: 'pointer',
                              fontSize: '14px',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              transition: 'color 0.2s'
                            }}
                            title="タスクを削除"
                          >
                            🗑️
                          </button>
                        </div>

                      </div>

                      {/* Bottom row: status transitions & timer triggers */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid rgba(255,255,255,0.03)',
                        paddingTop: '12px',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        {/* Status switcher controls */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {task.status !== 'TODO' && (
                            <button
                              onClick={() => handleUpdateStatus(task.id, 'TODO')}
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: '#94a3b8',
                                fontSize: '11px',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              未着手へ
                            </button>
                          )}
                          {task.status !== 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                              style={{
                                background: 'rgba(56, 189, 248, 0.08)',
                                border: '1px solid rgba(56, 189, 248, 0.2)',
                                color: '#38bdf8',
                                fontSize: '11px',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              進行中へ
                            </button>
                          )}
                          {task.status !== 'DONE' && (
                            <button
                              onClick={() => handleUpdateStatus(task.id, 'DONE')}
                              style={{
                                background: 'rgba(16, 185, 129, 0.08)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                color: '#10b981',
                                fontSize: '11px',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              完了へ
                            </button>
                          )}
                        </div>

                        {/* Timer control */}
                        {task.status !== 'DONE' && (
                          <div>
                            {isThisTaskTimerRunning ? (
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <span style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: '#ef4444',
                                  display: 'inline-block',
                                  animation: 'fadeInOut 1.5s infinite'
                                }}></span>
                                <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>計測中...</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartTimer(task.id)}
                                style={{
                                  background: 'rgba(14, 165, 233, 0.1)',
                                  border: '1px solid rgba(14, 165, 233, 0.3)',
                                  color: '#38bdf8',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  padding: '5px 12px',
                                  borderRadius: '20px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                ⏱️ タイマーを開始
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Timer & Work Logs */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Active Timer Card */}
          {activeTimerTaskId && (
            <div className="glass-panel pulse-animation" style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(17, 24, 39, 0.8) 100%)',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              borderRadius: '16px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                ACTIVE TIME TRACKER
              </span>
              
              <h4 style={{
                fontSize: '16px',
                fontWeight: 600,
                marginTop: '12px',
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {tasks.find((t) => t.id === activeTimerTaskId)?.title || '不明なタスク'}
              </h4>

              {/* Timer Display */}
              <div style={{
                fontSize: '42px',
                fontFamily: 'monospace',
                fontWeight: 700,
                color: '#fff',
                margin: '18px 0',
                letterSpacing: '2px'
              }}>
                {formatTime(timerElapsedSeconds)}
              </div>

              {/* Timer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                {timerIsRunning ? (
                  <button
                    onClick={handlePauseTimer}
                    style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      color: '#fbbf24',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    ⏸️ 一時停止
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartTimer(activeTimerTaskId)}
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#34d399',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    ▶️ 再開
                  </button>
                )}

                <button
                  onClick={handleStopAndSaveTimer}
                  style={{
                    background: 'rgba(14, 165, 233, 0.2)',
                    border: '1px solid rgba(14, 165, 233, 0.4)',
                    color: '#38bdf8',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  💾 記録保存
                </button>

                <button
                  onClick={handleCancelTimer}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  ❌ 破棄
                </button>
              </div>
            </div>
          )}

          {/* Manual Work Log Card */}
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(17,24,39,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#c084fc' }}>
              ⏱️ 手動で工数を記録
            </h3>
            <form onSubmit={handleAddManualLog} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>対象タスク</label>
                <select
                  value={selectedTaskIdForLog}
                  onChange={(e) => setSelectedTaskIdForLog(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="">-- タスクを選択してください --</option>
                  {tasks.filter(t => t.status !== 'DONE').map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                  {tasks.filter(t => t.status === 'DONE').length > 0 && (
                    <optgroup label="完了したタスク">
                      {tasks.filter(t => t.status === 'DONE').map((t) => (
                        <option key={t.id} value={t.id}>{t.title} (完了)</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>所要時間（分）</label>
                  <input
                    type="number"
                    min="1"
                    value={logDuration}
                    onChange={(e) => setLogDuration(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>作業日</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>作業メモ</label>
                <input
                  type="text"
                  placeholder="例：スライド作成、設計レビューなど"
                  value={logMemo}
                  onChange={(e) => setLogMemo(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary" style={{ padding: '8px 16px', background: 'rgba(192, 132, 252, 0.15)', border: '1px solid rgba(192, 132, 252, 0.3)', color: '#c084fc' }}>
                  <span>ログを記録</span>
                </button>
              </div>
            </form>
          </div>

          {/* Time allocation summary card */}
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(17,24,39,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#eab308' }}>
              📊 タスク別時間配分
            </h3>
            {totalLoggedMinutes === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#6b7280', fontSize: '13px' }}>
                作業実績が記録されていません。
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {tasks.map((task) => {
                  const minutes = getTaskTotalLoggedMinutes(task.id);
                  if (minutes === 0) return null;
                  const percentage = Math.round((minutes / totalLoggedMinutes) * 100);

                  return (
                    <div key={task.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                          {task.title}
                        </span>
                        <span style={{ color: '#94a3b8' }}>{minutes}分 ({percentage}%)</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${percentage}%`,
                          background: 'linear-gradient(90deg, #eab308 0%, #fb923c 100%)',
                          height: '100%',
                          borderRadius: '3px'
                        }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Work Log History List */}
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(17,24,39,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>📜 最近の作業ログ</h3>
            
            {workLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#6b7280', fontSize: '13px' }}>
                ログ履歴はありません。
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                {workLogs.map((log) => {
                  const task = tasks.find((t) => t.id === log.task_id);
                  return (
                    <div
                      key={log.id}
                      style={{
                        background: 'rgba(0,0,0,0.15)',
                        border: '1px solid rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        padding: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                          <span>{log.work_date}</span>
                          <span style={{ fontWeight: 600, color: '#38bdf8' }}>{log.duration_minutes}分</span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                          {task ? task.title : '削除されたタスク'}
                        </p>
                        {log.memo && (
                          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {log.memo}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#f87171',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '4px'
                        }}
                        title="ログを削除"
                      >
                        🗑️
                      </button>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </section>

      </div>

      {/* Task Edit Modal dialog */}
      {editingTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{
            width: '90%',
            maxWidth: '500px',
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: '#38bdf8' }}>タスクの編集</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>タイトル</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>優先度</label>
                <select
                  value={editingTask.priority}
                  onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="LOW">低 (LOW)</option>
                  <option value="MEDIUM">中 (MEDIUM)</option>
                  <option value="HIGH">高 (HIGH)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>詳細</label>
                <textarea
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '14px',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  onClick={() => setEditingTask(null)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="btn-primary"
                  style={{ padding: '8px 16px' }}
                >
                  保存する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
