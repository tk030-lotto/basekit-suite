# BaseKit Suite 開発引き継ぎサマリー (2026-07-15 - P2-3完了)

本ドキュメントは、プロジェクト「BaseKit Suite」のフェーズ2「コア再構築」におけるステップ2-3「データベース抽象化レイヤー（マルチDB接続）」完了時点での状況、システム構成、および次回開始時のタスクをまとめた引き継ぎ書である。

---

## 1. プロジェクト基本情報
*   **プロジェクト名**: BaseKit Suite
*   **プロジェクトディレクトリ**: `c:\Users\tk030\Desktop\basekit-suite`
*   **現在の進捗**: フェーズ2-3「データベース抽象化レイヤー（マルチDB接続）」完了。全体進捗率 50%。
*   **開発計画書**: プロジェクトルートの `DEVELOPMENT_PLAN.md` に最新のマイルストーン工程表が設置済。
*   **開発実績記録**: `各種情報\Projects\BaseKit_Suite\RECORD.md` に各フェーズの完了履歴が記載済。

---

## 2. 物理フォルダ構成と主要モジュール
`npm workspaces` を採用したモノレポ物理構成：

```plaintext
basekit-suite/
├── packages/
│   ├── core/                       # ① Coreパッケージ (Next.js Webポータル基盤)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── api/
│   │   │   │   │   ├── ai/
│   │   │   │   │   │   └── route.ts  # AIプロキシエンドポイント (Ollama等のCORS回避用)
│   │   │   │   │   └── db/
│   │   │   │   │       └── route.ts  # DBプロキシエンドポイント (PostgreSQL等のCORS回避用)
│   │   │   │   ├── settings/
│   │   │   │   │   └── page.tsx      # システム設定画面 (AI/DB切り替えと接続疎通テスト)
│   │   │   │   └── page.tsx          # ダッシュボードポータル
│   │   │   ├── lib/
│   │   │   │   ├── ai/
│   │   │   │   │   ├── LLMProviderFactory.ts
│   │   │   │   │   ├── GeminiLLMProvider.ts
│   │   │   │   │   └── OllamaLLMProvider.ts
│   │   │   │   └── db/
│   │   │   │       └── DatabaseManager.ts # DB接続マネージャー (LocalStorage/Mock/Postgres動的切り替え)
│   │   │   └── types/
│   │   │       └── index.ts          # コアインターフェース・型定義
│   ├── standalone/                 # ② スタンドアロンパッケージ (ViteプレーンHTML/JS。社用PC用)
│   └── plugins/
│       ├── personal-ops/           # ③ 個人業務効率化プラグイン (スケルトン)
│       ├── bookkeeping/            # ④ 複式簿記プラグイン (スケルトン)
│       └── sns/                    # ⑤ 業務用SNSプラグイン (スケルトン)
└── DEVELOPMENT_PLAN.md             # 統合開発計画書・工程管理表
```

---

## 3. 合意された「自己防衛」および「マルチDB」設計思想

### ① 「0円運用」と「自律データベース」の原則
*   **AIプロバイダの切り替え**: Google Gemini（個人の無料APIキー）とローカルLLMサーバー（Ollama）を、設定画面からノーコードで切り替えて利用可能。
*   **マルチDB接続抽象化**: 
    1.  `LocalStorage`: 完全ブラウザ内完結のプライベートかつ無料の運用。
    2.  `Mock PostgreSQL`: サーバーを持たずにRDB（SQL）クエリやDDL動作をブラウザ内でシミュレートし、LocalStorageで永続化。
    3.  `PostgreSQL`: Supabase（無料枠あり）やローカルのPostgreSQLサーバーに直接/プロキシ経由で接続し、本格的なRDB運用が可能。

### ② データベースCORS回避・認証情報秘匿プロキシ
*   ブラウザ側から外部PostgreSQLへTCPソケットを直接繋ぐことができないCORS/セキュリティの制限を回避するため、Next.js APIルート `/api/db` を経由したプロキシ通信を構築。
*   設定画面で入力されたホストやユーザー名、パスワード等の接続パラメータを安全にサーバー側へ引き渡し、サーバー側で `pg` クライアントを用いて疎通確認（接続テスト）やクエリを実行する。

---

## 4. 次回開始時のタスク
統合開発計画書（[DEVELOPMENT_PLAN.md](file:///c:/Users/tk030/Desktop/basekit-suite/DEVELOPMENT_PLAN.md)）の「**P2: コア再構築 - ステップ2-4: 認証トグル（ログインバイパス）機能の実装**」より開始する。

1.  ローカル開発や個人利用時に、ログイン画面をスキップして即座に画面へログインできるトグルスイッチを設定画面または環境変数に追加・実装する。
2.  バイパス有効時にダミーの管理者（ADMIN）セッションコンテキストを生成し、システム全体に配るセキュリティバイパス制御の仕組みを `middleware.ts` または認証プロバイダ内に組み込む。
