# BaseKit Suite 開発引き継ぎサマリー (2026-07-14)

本ドキュメントは、プロジェクト「BaseKit Suite」の開発移行（フェーズ1）完了時点での状況、決定された設計思想、および次回開始時のタスクをまとめた引き継ぎ書である。

---

## 1. プロジェクト基本情報
*   **プロジェクト名**: BaseKit Suite
*   **プロジェクトディレクトリ**: `c:\Users\tk030\Desktop\basekit-suite`
*   **現在の進捗**: フェーズ1「準備」完了。新モノレポ構造の初期化およびドキュメントのMarkdown移行・配置が完了。
*   **開発計画書**: プロジェクトルートの `DEVELOPMENT_PLAN.md` に最新のマイルストーン工程表が設置済。
*   **対話ログ**: `docs/development_logs/complete_chat_history.md` に本日行われた設計議論の全記録がMarkdown化済。

---

## 2. 物理フォルダ構成（モノレポ）
`npm workspaces` を採用し、以下の5つの独立パッケージに物理分割されています。

```plaintext
basekit-suite/
├── core/                       # ① Coreパッケージ (Next.jsWebポータル基盤)
├── standalone/                 # ② スタンドアロンパッケージ (ViteプレーンHTML/JS。社用PC用)
├── plugins/
│   ├── personal-ops/           # ③ 個人業務効率化プラグイン
│   ├── bookkeeping/            # ④ 複式簿記プラグイン
│   └── sns/                    # ⑤ 業務用SNSプラグイン
├── docs/
│   ├── constitution/           # 憲法（ブループリント全20章＋あとがき。txtからmdへ変換済）
│   ├── architecture/           # 技術設計書 (basekit-core-design.md)
│   └── specification/          # プラグイン開発仕様書 (plugin-spec.md)
├── DEVELOPMENT_PLAN.md         # 統合開発計画書・工程管理表
└── README.md                   # 総合案内（docs/へのインデックス目次リンク設置済）
```

---

## 3. 合意された3大「自己防衛」設計思想

### ① 「0円運用」の原則
*   **有料APIの完全排除**: OpenAI等の従量課金APIを前提とせず、**「利用者が各自で用意する無料のGemini APIキー」**または**「完全無料のローカルLLM（Ollama等）」**をサポートする。
*   **無料インフラ**: DBは無料枠が手厚いSupabaseやNeonを前提とし、容量オーバーを防ぐ防衛設計を敷く。
*   **クライアントサイド完結**: PDF生成やデータ出力に有料SaaSを一切使わず、ブラウザ内ライブラリ（`jsPDF`等）で処理する。

### ② 認証トグル設計
個人利用（スタンドアロン）時に「ログイン画面」が邪魔になるのを避けるため、環境変数 `NEXT_PUBLIC_DISABLE_AUTH=true` の場合は、認証を完全にバイパスし、システム管理者（ADMIN）としての仮想セッションを自動返却して即座に使える快適なUXを提供する。

### ③ 3大拡張インターフェースのCore定義
将来の機能追加を容易にするため、AI (`ILLMProvider`)、データ入出力 (`IDataExporter`)、通知 (`INotificationProvider`) をCoreで抽象化。

---

## 4. 次回開始時のタスク
統合開発計画書（[DEVELOPMENT_PLAN.md](file:///c:/Users/tk030/Desktop/basekit-suite/DEVELOPMENT_PLAN.md)）の「**P2: コア再構築 - ステップ2-1: CoreパッケージNext.js環境の初期化**」より開始する。

1.  `packages/core/` フォルダのNext.js環境を整備し、共通UI（サイドバー、ヘッダー）を備えたポータル画面の土台を構築する。
2.  データベース接続抽象化マネージャー（PostgreSQL ⇄ localStorage ⇄ SQLite の動的切り替え）のインフラ設計・実装に着手する。
