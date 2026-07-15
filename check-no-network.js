const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(__dirname, 'packages', 'standalone', 'src');
const ALLOWED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css', '.html'];

const FORBIDDEN_PATTERNS = [
  { regex: /\bfetch\s*\(/, label: 'fetch()' },
  { regex: /\bwindow\.fetch\b/, label: 'window.fetch' },
  { regex: /\baxios\b/, label: 'axios' },
  { regex: /\bWebSocket\b/, label: 'WebSocket' },
  { regex: /\bXMLHttpRequest\b/, label: 'XMLHttpRequest' },
  { regex: /\bsendBeacon\b/, label: 'navigator.sendBeacon' },
  { regex: /\bEventSource\b/, label: 'EventSource' }
];

const URL_REGEX = /(?:https?|wss?):\/\/[^\s"'`]+/g;
const WHITELIST_URLS = [
  /^(?:https?|wss?):\/\/localhost\b/,
  /^(?:https?|wss?):\/\/127\.0\.0\.1\b/,
  /^(?:https?|wss?):\/\/0\.0\.0\.0\b/,
  /^https?:\/\/www\.w3\.org\b/,
  /^http:\/\/www\.w3\.org\b/
];

let errorCount = 0;

function scanDir(dir) {
  if (!fs.existsSync(dir)) {
    console.warn(`[WARN] Directory does not exist: ${dir}`);
    return;
  }
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else {
      const ext = path.extname(fullPath);
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        checkFile(fullPath);
      }
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // ブロックコメントを除去（行数を維持するため改行に置換）
  const contentNoBlockComments = content.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    return '\n'.repeat((match.match(/\n/g) || []).length);
  });

  const lines = contentNoBlockComments.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    // ラインコメントを除去
    const codeLine = line.replace(/(?<!:)\/\/.*$/, '');

    // 1. 禁止パターンのチェック
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.regex.test(codeLine)) {
        console.error(`[ERROR] Forbidden pattern "${pattern.label}" detected in ${filePath}:${lineNumber}`);
        console.error(`  > ${line.trim()}`);
        errorCount++;
      }
    }

    // 2. 絶対URLのチェック
    let match;
    // execを使うために正規表現のlastIndexを初期化
    URL_REGEX.lastIndex = 0;
    while ((match = URL_REGEX.exec(codeLine)) !== null) {
      const url = match[0];
      const isAllowed = WHITELIST_URLS.some(regex => regex.test(url));
      if (!isAllowed) {
        console.error(`[ERROR] Non-whitelisted absolute URL "${url}" detected in ${filePath}:${lineNumber}`);
        console.error(`  > ${line.trim()}`);
        errorCount++;
      }
    }
  });
}

console.log(`Scanning for network operations in: ${TARGET_DIR}`);
scanDir(TARGET_DIR);

if (errorCount > 0) {
  console.error(`\n[FAIL] Checker found ${errorCount} network policy violation(s). Build aborted.`);
  process.exit(1);
} else {
  console.log('\n[PASS] No unauthorized network operations detected.');
  process.exit(0);
}
