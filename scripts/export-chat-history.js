const fs = require('fs');
const path = require('path');

// 会話IDとアプリデータディレクトリの設定（環境に合わせて自動追従するようパスを定義）
const CONVERSATION_ID = '1890960b-c341-4565-aed4-aad933e7f34d';
const SYSTEM_LOG_PATH = path.join(
  process.env.USERPROFILE || 'C:\\Users\\tk030',
  '.gemini',
  'antigravity-ide',
  'brain',
  CONVERSATION_ID,
  '.system_generated',
  'logs',
  'transcript.jsonl'
);

const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'development_logs');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'complete_chat_history.md');

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function exportHistory() {
  console.log(`システムログの読み込み中: ${SYSTEM_LOG_PATH}`);
  
  if (!fs.existsSync(SYSTEM_LOG_PATH)) {
    console.error('システムログ（transcript.jsonl）が見つかりません。パスを確認してください。');
    process.exit(1);
  }

  const lines = fs.readFileSync(SYSTEM_LOG_PATH, 'utf8').split('\n');
  let markdownContent = `# BaseKit Suite - 開発チャット履歴 (全記録)\n\n本ドキュメントは、システムログから自動抽出された開発者とAI（Antigravity）の対話全履歴である。\n\n---\n\n`;

  let currentStep = 1;

  lines.forEach(line => {
    if (!line.trim()) return;

    try {
      const logData = JSON.parse(line);
      const source = logData.source;
      const type = logData.type;
      const content = logData.content;

      // ユーザーの入力メッセージの抽出
      if (type === 'USER_INPUT' && source === 'USER_EXPLICIT') {
        markdownContent += `## 👤 ユーザー (ステップ ${currentStep})\n\n`;
        // <USER_REQUEST> などのタグを綺麗に処理
        const cleanContent = content
          .replace(/<USER_REQUEST>/g, '')
          .replace(/<\/USER_REQUEST>/g, '')
          .replace(/<ADDITIONAL_METADATA>[\s\S]*<\/ADDITIONAL_METADATA>/g, '')
          .trim();
        
        markdownContent += `${cleanContent}\n\n`;
        markdownContent += `---\n\n`;
        currentStep++;
      }

      // AIの回答メッセージの抽出（ツール呼び出しなどを除く純粋な思考と回答）
      if (type === 'PLANNER_RESPONSE' && source === 'MODEL') {
        markdownContent += `## 🤖 AI (Antigravity)\n\n`;
        
        // 思考プロセスやメタデータが含まれる場合はテキスト部分のみを綺麗に抽出
        let cleanReply = content;
        // プロンプトタグ等のノイズ除去
        cleanReply = cleanReply
          .replace(/<EPHEMERAL_MESSAGE>[\s\S]*<\/EPHEMERAL_MESSAGE>/g, '')
          .trim();

        markdownContent += `${cleanReply}\n\n`;
        markdownContent += `---\n\n`;
      }

    } catch (e) {
      // JSONパースエラーはスキップ
    }
  });

  ensureDirectoryExistence(OUTPUT_FILE);
  fs.writeFileSync(OUTPUT_FILE, markdownContent, 'utf8');
  console.log(`チャット履歴の出力に成功しました:\n${OUTPUT_FILE}`);
}

exportHistory();
