import React, { useState, useEffect, useRef } from 'react';
import { IDatabaseConnection } from '../core/src/types';

interface SnsPluginProps {
  dbConnection?: IDatabaseConnection;
}

interface Thread {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

interface Message {
  id: string;
  thread_id: string;
  content: string;
  sender: string;
  likes?: string; // JSON string of string[] (user names)
  media_urls?: string; // JSON string of {name, type, data}[]
  created_at: string;
  deleted_at?: string | null;
}

interface Attachment {
  name: string;
  type: string;
  data: string; // Base64 Data URL
  size: number;
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain',
];

export default function SnsPlugin({ dbConnection }: SnsPluginProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [isAddingThread, setIsAddingThread] = useState(false);
  const [messageSender, setMessageSender] = useState(() => {
    return localStorage.getItem('basekit_sns_sender') || '一般ユーザー (山田)';
  });
  const [messageContent, setMessageContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Attachment[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load threads and messages
  const loadData = async (targetThreadId?: string | null) => {
    if (!dbConnection) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      await ensureInitialData();

      // Fetch active threads
      const threadsData = await dbConnection.query<Thread[]>(
        'SELECT * FROM sns_threads WHERE deleted_at IS NULL ORDER BY created_at DESC'
      );
      const activeThreads = threadsData || [];
      setThreads(activeThreads);

      // Select default thread if none selected
      let currentThreadId = targetThreadId !== undefined ? targetThreadId : selectedThreadId;
      if (!currentThreadId && activeThreads.length > 0) {
        currentThreadId = activeThreads[activeThreads.length - 1].id;
      }

      if (currentThreadId) {
        setSelectedThreadId(currentThreadId);
        // Fetch active messages for the selected thread
        const messagesData = await dbConnection.query<Message[]>(
          'SELECT * FROM sns_messages WHERE thread_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC',
          [currentThreadId]
        );
        setMessages(messagesData || []);
      } else {
        setSelectedThreadId(null);
        setMessages([]);
      }
      setError(null);
    } catch (err: any) {
      console.error('Failed to load SNS database content:', err);
      setError('データベースの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // Seed default threads & messages
  const ensureInitialData = async () => {
    if (!dbConnection) return;
    try {
      const activeThreads = await dbConnection.query<Thread[]>(
        'SELECT * FROM sns_threads WHERE deleted_at IS NULL'
      );
      
      if (!activeThreads || activeThreads.length === 0) {
        const now = new Date();
        const getOffsetIso = (offsetMinutes: number) => {
          return new Date(now.getTime() - offsetMinutes * 60000).toISOString();
        };

        const defaultThreads = [
          {
            id: 'thread-sys-feed',
            title: '📢 システム通知・アクティビティフィード',
            created_by: 'システム',
            created_at: getOffsetIso(120),
            updated_at: getOffsetIso(120),
            deleted_at: null
          },
          {
            id: 'thread-chat-1',
            title: '💬 雑談・アナウンス',
            created_by: '管理者',
            created_at: getOffsetIso(60),
            updated_at: getOffsetIso(30),
            deleted_at: null
          },
          {
            id: 'thread-dev-1',
            title: '💻 開発方針について',
            created_by: '管理者',
            created_at: getOffsetIso(240),
            updated_at: getOffsetIso(240),
            deleted_at: null
          }
        ];

        const defaultMessages = [
          {
            id: 'msg-sys-1',
            thread_id: 'thread-sys-feed',
            content: '本スレッドはシステムの自動通知専用です。タスク完了や工数登録のログが自動投稿されます。',
            sender: 'システム',
            likes: '[]',
            media_urls: '[]',
            created_at: getOffsetIso(120),
            deleted_at: null
          },
          {
            id: 'msg-chat-1',
            thread_id: 'thread-chat-1',
            content: 'BaseKit Suite 開発お疲れ様です！本日の進捗状況や雑談など、こちらで自由につぶやいてください。',
            sender: '管理者',
            likes: '[]',
            media_urls: '[]',
            created_at: getOffsetIso(60),
            deleted_at: null
          },
          {
            id: 'msg-chat-2',
            thread_id: 'thread-chat-1',
            content: '個人業務効率化ツールでの作業登録時に、 PluginBus を経由してこのチャットにアクティビティが自動投稿されます。',
            sender: 'システム',
            likes: '[]',
            media_urls: '[]',
            created_at: getOffsetIso(30),
            deleted_at: null
          }
        ];

        for (const t of defaultThreads) {
          await dbConnection.execute(
            'INSERT INTO sns_threads (id, title, created_by, created_at, updated_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6)',
            [t.id, t.title, t.created_by, t.created_at, t.updated_at, null]
          );
        }

        for (const m of defaultMessages) {
          await dbConnection.execute(
            'INSERT INTO sns_messages (id, thread_id, content, sender, likes, media_urls, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [m.id, m.thread_id, m.content, m.sender, m.likes, m.media_urls, m.created_at, null]
          );
        }
      }
    } catch (e) {
      console.error('Failed to initialize SNS seed data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [dbConnection]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSenderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessageSender(val);
    localStorage.setItem('basekit_sns_sender', val);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessageContent(val);
    if (val.length > 2000) {
      setValidationError('投稿内容は2000文字以内で入力してください。');
    } else {
      setValidationError(null);
    }
  };

  // Attachments loading
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (selectedFiles.length + files.length > 4) {
      setValidationError('添付できるファイルは最大4個までです。');
      return;
    }

    setValidationError(null);
    const promises = Array.from(files).map(file => {
      return new Promise<Attachment>((resolve, reject) => {
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          reject(new Error(`許可されていないファイル形式です: ${file.name}`));
          return;
        }
        if (file.size > 2 * 1024 * 1024) {
          reject(new Error(`ファイルサイズが大きすぎます (最大2MB): ${file.name}`));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            name: file.name,
            type: file.type,
            data: reader.result as string,
            size: file.size
          });
        };
        reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました。'));
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises)
      .then(loadedFiles => {
        setSelectedFiles(prev => [...prev, ...loadedFiles]);
      })
      .catch(err => {
        setValidationError(err.message);
      });
  };

  const handleRemoveSelectedFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Create Thread Action
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !dbConnection) return;

    try {
      const threadId = crypto.randomUUID();
      const nowStr = new Date().toISOString();
      const sender = '管理者';

      await dbConnection.execute(
        'INSERT INTO sns_threads (id, title, created_by, created_at, updated_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [threadId, newThreadTitle.trim(), sender, nowStr, nowStr, null]
      );

      // Create initial message
      const msgId = crypto.randomUUID();
      await dbConnection.execute(
        'INSERT INTO sns_messages (id, thread_id, content, sender, likes, media_urls, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [msgId, threadId, `スレッド 「${newThreadTitle.trim()}」 が作成されました。`, 'システム', '[]', '[]', nowStr, null]
      );

      setNewThreadTitle('');
      setIsAddingThread(false);
      await loadData(threadId);
    } catch (e) {
      console.error('Failed to create thread:', e);
      setError('スレッドの作成に失敗しました。');
    }
  };

  // Send Message Action
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThreadId || !dbConnection) return;
    if (!messageContent.trim() && selectedFiles.length === 0) {
      setValidationError('メッセージを入力するか、ファイルを添付してください。');
      return;
    }

    if (messageContent.length > 2000) {
      setValidationError('投稿内容は2000文字以内で入力してください。');
      return;
    }

    try {
      const msgId = crypto.randomUUID();
      const nowStr = new Date().toISOString();
      const sender = messageSender.trim() || 'メンバー';

      await dbConnection.execute(
        'INSERT INTO sns_messages (id, thread_id, content, sender, likes, media_urls, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          msgId,
          selectedThreadId,
          messageContent.trim(),
          sender,
          '[]',
          JSON.stringify(selectedFiles),
          nowStr,
          null
        ]
      );

      // Update thread's updated_at
      await dbConnection.execute(
        'UPDATE sns_threads SET updated_at = $1 WHERE id = $2',
        [nowStr, selectedThreadId]
      );

      setMessageContent('');
      setSelectedFiles([]);
      setValidationError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadData(selectedThreadId);
    } catch (e) {
      console.error('Failed to post message:', e);
      setError('メッセージの送信に失敗しました。');
    }
  };

  // Likes Reaction Toggle
  const handleToggleLike = async (msgId: string, currentLikes: string) => {
    if (!dbConnection || !selectedThreadId) return;
    try {
      const likesArray: string[] = currentLikes ? JSON.parse(currentLikes) : [];
      const myName = messageSender.trim() || 'メンバー';
      const index = likesArray.indexOf(myName);
      
      if (index > -1) {
        likesArray.splice(index, 1);
      } else {
        likesArray.push(myName);
      }

      await dbConnection.execute(
        'UPDATE sns_messages SET likes = $1 WHERE id = $2',
        [JSON.stringify(likesArray), msgId]
      );
      await loadData(selectedThreadId);
    } catch (err) {
      console.error('Failed to toggle like reaction:', err);
    }
  };

  // Delete Thread Action
  const handleDeleteThread = async (threadId: string) => {
    if (!dbConnection) return;
    if (threadId === 'thread-sys-feed') {
      setValidationError('システムフィードスレッドは削除できません。');
      return;
    }
    if (!window.confirm('このスレッドを削除しますか？内のメッセージも非表示になります。')) return;

    try {
      const nowStr = new Date().toISOString();
      await dbConnection.execute(
        'UPDATE sns_threads SET deleted_at = $1 WHERE id = $2',
        [nowStr, threadId]
      );
      const nextThread = threads.find(t => t.id !== threadId && t.deleted_at == null);
      await loadData(nextThread?.id || null);
    } catch (e) {
      console.error('Failed to delete thread:', e);
      setError('スレッドの削除に失敗しました。');
    }
  };

  // Delete Message Action
  const handleDeleteMessage = async (msgId: string) => {
    if (!dbConnection || !selectedThreadId) return;
    if (!window.confirm('このメッセージを削除しますか？')) return;

    try {
      const nowStr = new Date().toISOString();
      await dbConnection.execute(
        'UPDATE sns_messages SET deleted_at = $1 WHERE id = $2',
        [nowStr, msgId]
      );
      await loadData(selectedThreadId);
    } catch (e) {
      console.error('Failed to delete message:', e);
      setError('メッセージの削除に失敗しました。');
    }
  };

  if (!dbConnection) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: '#ef4444' }}>
        <p>有効な IDatabaseConnection プロップが提供されていません。</p>
      </div>
    );
  }

  const selectedThread = threads.find(t => t.id === selectedThreadId);

  return (
    <div style={{ display: 'flex', gap: '24px', flexGrow: 1, minHeight: '500px', height: 'calc(100vh - 220px)' }}>
      
      {/* Thread list sidebar */}
      <div className="glass-panel" style={{
        width: '320px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px',
        overflowY: 'auto',
        maxHeight: '100%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#38bdf8' }}>#</span> スレッド一覧
          </h2>
          <button
            onClick={() => setIsAddingThread(!isAddingThread)}
            style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              color: '#38bdf8',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '16px',
              transition: 'all 0.2s'
            }}
            title="新規スレッド作成"
          >
            +
          </button>
        </div>

        {/* Create Thread Form */}
        {isAddingThread && (
          <form onSubmit={handleCreateThread} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <input
              type="text"
              placeholder="スレッドのタイトル..."
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              required
              maxLength={100}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(15,23,42,0.8)',
                color: '#fff',
                fontSize: '13px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsAddingThread(false)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#94a3b8',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
              <button
                type="submit"
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#38bdf8',
                  color: '#0b0f19',
                  fontWeight: 600,
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                作成
              </button>
            </div>
          </form>
        )}

        {/* Thread List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1, overflowY: 'auto' }}>
          {threads.map((t) => {
            const isSelected = t.id === selectedThreadId;
            const isSys = t.id === 'thread-sys-feed';
            return (
              <div
                key={t.id}
                onClick={() => loadData(t.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden', flexGrow: 1 }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? '#38bdf8' : '#f8fafc',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}>
                    {t.title}
                  </span>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>
                    更新: {new Date(t.updated_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {!isSys && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteThread(t.id);
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#6b7280',
                      cursor: 'pointer',
                      padding: '4px',
                      fontSize: '12px',
                      opacity: isSelected ? 0.7 : 0,
                      transition: 'opacity 0.2s'
                    }}
                    className="delete-thread-btn"
                    title="スレッドを削除"
                  >
                    🗑️
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Message Chat Timeline */}
      <div className="glass-panel" style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        overflow: 'hidden'
      }}>
        {selectedThread ? (
          <>
            {/* Chat Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              background: 'rgba(255, 255, 255, 0.01)'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                  {selectedThread.title}
                </h3>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                  作成者: {selectedThread.created_by} • {new Date(selectedThread.created_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div style={{
              flexGrow: 1,
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              background: 'rgba(11, 15, 25, 0.2)'
            }}>
              {error && (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '13px' }}>
                  {error}
                </div>
              )}
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#38bdf8', fontSize: '14px' }}>
                  <span className="pulse-text">読み込み中...</span>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6b7280', fontSize: '14px' }}>
                  メッセージがまだありません。最初のメッセージを送信しましょう！
                </div>
              ) : (
                messages.map((m) => {
                  const isSys = m.sender === 'システム';
                  const likesArray: string[] = m.likes ? JSON.parse(m.likes) : [];
                  const isLikedByMe = likesArray.includes(messageSender.trim());
                  const attachments: Attachment[] = m.media_urls ? JSON.parse(m.media_urls) : [];

                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isSys ? 'center' : 'flex-start',
                        gap: '4px',
                        width: '100%',
                        position: 'relative'
                      }}
                    >
                      {/* Message Bubble wrapper */}
                      <div style={{
                        maxWidth: isSys ? '85%' : '75%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isSys ? 'center' : 'flex-start',
                        position: 'relative'
                      }}>
                        {/* Sender header */}
                        {!isSys && (
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginLeft: '4px' }}>
                            {m.sender}
                          </span>
                        )}

                        {/* Content Box */}
                        <div style={{
                          background: isSys
                            ? 'rgba(56, 189, 248, 0.08)'
                            : 'rgba(255, 255, 255, 0.03)',
                          border: isSys
                            ? '1px dashed rgba(56, 189, 248, 0.3)'
                            : '1px solid rgba(255, 255, 255, 0.04)',
                          borderRadius: isSys ? '8px' : '12px',
                          padding: isSys ? '10px 16px' : '12px 16px',
                          color: isSys ? '#38bdf8' : '#e2e8f0',
                          fontSize: isSys ? '13px' : '14px',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          textAlign: isSys ? 'center' : 'left',
                          position: 'relative',
                          width: '100%'
                        }}>
                          {m.content}

                          {/* Render file attachments if any */}
                          {attachments.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                              {attachments.map((file, fIdx) => (
                                <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {file.type.startsWith('image/') ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <img
                                        src={file.data}
                                        alt={file.name}
                                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '6px', objectFit: 'contain', border: '1px solid rgba(255,255,255,0.1)' }}
                                      />
                                      <span style={{ fontSize: '10px', color: '#6b7280' }}>📷 {file.name} ({Math.round(file.size / 1024)} KB)</span>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}>
                                      <span>📄</span>
                                      <a href={file.data} download={file.name} style={{ color: '#38bdf8', textDecoration: 'underline', fontWeight: 500 }}>
                                        {file.name}
                                      </a>
                                      <span style={{ color: '#6b7280', fontSize: '10px' }}>({Math.round(file.size / 1024)} KB)</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Inner timestamp / actions */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px',
                            marginTop: '8px',
                            fontSize: '10px',
                            color: '#6b7280'
                          }}>
                            {/* Likes section */}
                            {!isSys ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleLike(m.id, m.likes || '[]')}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: isLikedByMe ? '#ef4444' : '#6b7280',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                  title={likesArray.length > 0 ? `いいねしたメンバー: ${likesArray.join(', ')}` : 'いいね！'}
                                >
                                  <span>{isLikedByMe ? '❤️' : '🖤'}</span>
                                  <span>{likesArray.length}</span>
                                </button>
                              </div>
                            ) : <div></div>}

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>
                                {new Date(m.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                              <button
                                onClick={() => handleDeleteMessage(m.id)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#6b7280',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  fontSize: '10px'
                                }}
                                title="メッセージを削除"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Footer Form */}
            {selectedThreadId !== 'thread-sys-feed' ? (
              <form onSubmit={handleSendMessage} style={{
                padding: '20px 24px',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                background: 'rgba(255, 255, 255, 0.01)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>投稿者名:</label>
                      <input
                        type="text"
                        value={messageSender}
                        onChange={handleSenderChange}
                        required
                        placeholder="投稿者名..."
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'rgba(15,23,42,0.8)',
                          color: '#fff',
                          fontSize: '12px',
                          width: '180px'
                        }}
                      />
                    </div>

                    {/* File Upload Trigger */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="file"
                        id="sns-file-upload"
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('sns-file-upload')?.click()}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span>📎</span> 添付ファイル
                      </button>
                    </div>
                  </div>

                  <span style={{ fontSize: '11px', color: messageContent.length > 2000 ? '#ef4444' : '#6b7280' }}>
                    {messageContent.length} / 2000 文字
                  </span>
                </div>

                {/* Show thumbnails of currently selected files */}
                {selectedFiles.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px' }}>
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px'
                      }}>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSelectedFile(idx)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {validationError && (
                  <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#ef4444', fontSize: '12px' }}>
                    ⚠️ {validationError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <textarea
                    placeholder="メッセージを入力してください...（Shift + Enterで改行。最大2000字）"
                    value={messageContent}
                    onChange={handleContentChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    style={{
                      flexGrow: 1,
                      minHeight: '60px',
                      maxHeight: '120px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(15,23,42,0.8)',
                      color: '#fff',
                      fontSize: '14px',
                      resize: 'vertical',
                      lineHeight: '1.4'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      alignSelf: 'flex-end',
                      background: 'linear-gradient(135deg, #0ea5e9 0%, #d946ef 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '12px 20px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      boxShadow: '0 4px 12px rgba(14,165,233,0.2)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    送信
                  </button>
                </div>
              </form>
            ) : (
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                background: 'rgba(255, 255, 255, 0.01)',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '13px'
              }}>
                🔒 システムフィードスレッドには手動投稿できません。
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6b7280' }}>
            スレッドを選択するか、新しいスレッドを作成してください。
          </div>
        )}
      </div>
    </div>
  );
}
