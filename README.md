# BaseKit Suite

> **Build Less. Share More. Grow Together.**

AI時代のソフトウェア開発を前提として設計された、コンポーザブル（着脱可能）かつ自己防衛的なOSS開発基盤および業務系ツールパッケージ。

---

## 1. プロジェクト概要

BaseKit Suiteは、個人開発者や中小開発会社が、個人事業主や中小企業等からの依頼において、セキュリティと法的リスクを徹底的に自己防衛しながら、ランニングコスト0円で頑丈なWebアプリケーション/スタンドアロンツールを構築・提供するためのお手本（Codex）となるリポジトリです。

本プロジェクトの核心は、**「強固な共通コア基盤（Core）の上に、任意の業務機能（プラグイン）を自由に着脱・接続して様々なアプリケーションを構成できる」** というコンポーザブル（着脱可能）なプラグインアーキテクチャにあります。

---

## 2. 開発者向け最重要ドキュメント（技術設計 ＆ プラグイン開発仕様）

本基盤の仕組みを理解し、独自のプラグインを開発して機能を拡張するための最重要仕様書です。

*   **[BaseKit Core 定義設計書](docs/architecture/basekit-core-design.md)** : 0円運用、認証トグル（ログインバイパス）、マルチDB接続（LocalStorage, Mock PostgreSQL, 本番用PostgreSQL）、免責ゲート、監査ログトリガーなどのCORE共通機能の設計解説。
*   **[プラグイン実装仕様書](docs/specification/plugin-spec.md)** : モノレポ規則、論理削除、PluginBusによる非同期イベント連携、外部通信完全遮断ルールの開発規格。

---

## 3. ディレクトリ構成（モノレポ）

本プロジェクトは、`npm workspaces` を使用したモノレポ構成を採用し、共通インフラと各プラグイン機能を物理的に完全に分離しています。

```
basekit-suite/
├── packages/
│   ├── core/               # Next.jsによるWebポータル。共通UI、PluginBus、認証、免責ゲート等を内包。
│   ├── standalone/         # Viteによる超軽量シングルHTML版。ブラウザのlocalStorageのみで安全に動作。
│   ├── plugin-personal-ops/# [リファレンス実装] 個人業務効率化プラグイン
│   ├── plugin-sns/         # [リファレンス実装] 業務用SNSプラグイン
│   └── plugin-bookkeeping/ # [リファレンス実装] 複式簿記プラグイン
├── docs/                   # プロジェクト憲法、アーキテクチャ設計書、開発ログ等
└── check-no-network.js     # 外部通信完全遮断チェッカー（静的コード解析スクリプト）
```

---

## 4. 同梱リファレンスプラグイン

プラグイン設計思想と、PluginBusを介したプラグイン間連携を実証するための具体的な「リファレンス実装（参照用サンプル）」です。

### 4.1. 個人業務効率化プラグイン (`@basekit/plugin-personal-ops`)
個人ビジネスの日常業務をデジタル化するタスク＆タイムトラッカー。
*   **主な機能**:
    *   **タスク管理**: TODO / IN_PROGRESS / DONE の3ステータス管理。タスクごとに **締切日 (`due_date`)** および **Gmail等の関連メールURL (`mail_url`)** を保持し、ワンクリックでメールへ別タブ遷移。論理削除対応。
    *   **工数記録**: リアルタイムタイマー（localStorageキャッシュによるリロード復帰対応、脈動アニメーションUI）と手動入力。
    *   **売上管理**: 案件名、金額、発生日の管理。月間目標金額（初期値: 100,000円）に対するプログレスバー表示。
    *   **カレンダー**: 当月・前月・翌月のカレンダーグリッド。各日付セルに締切タスク件数ドットを表示。
    *   **日報自動生成**: 指定日について、本日完了/進行中タスク・作業時間（工数ログ）・売上データ・監査ログ (`audit_logs`) をアトミックにマージし、時系列のMarkdown形式日報を自動生成。クリップボードコピー、ダウンロード、A4印刷最適化CSS対応。
    *   **バックアップ＆リストア**: 全データを1つのJSONファイルにシリアライズしてエクスポート。インポート時は「上書き復元」または「マージ追加」を選択可能。最終バックアップから7日以上経過時に警告ヘッダーを表示。
*   **詳細仕様書 ＆ スキーマ**: [SPEC.md](packages/plugin-personal-ops/SPEC.md) を参照。
    *   `personal_tasks` (タスク情報)
    *   `personal_work_logs` (作業時間記録)
    *   `personal_revenues` (売上実績)

### 4.2. 業務用SNSプラグイン (`@basekit/plugin-sns`)
チームコミュニケーションを円滑にするスレッド形式の簡易チャット。
*   **主な機能**:
    *   **スレッド（トピック）管理**: 新規スレッド作成、論理削除、最終更新日によるソート。
    *   **チャットメッセージ**: 投稿内容、投稿者、送信日時の記録。最大2000文字の厳密な制限（文字数カウンター付き）。
    *   **いいね！リアクション**: トグルの「いいね」リアクション、いいね総数バッジ、いいねを押したユーザー一覧のツールチップ表示。
    *   **ファイル・画像添付**: メッセージに複数のファイルや画像（Base64エンコード）を最大4つまで添付可能。ファイル形式を `JPEG, PNG, GIF, WEBP, PDF, TXT` に厳密に制限。
    *   **PluginBus連携**: 他プラグインのアクティビティ（例: タスクの完了、工数記録の追加）を受信し、「📢 システム通知・アクティビティフィード」スレッドへ「システム」アカウントとして自動的にフィードを投稿。
*   **詳細仕様書 ＆ スキーマ**: [SPEC.md](packages/plugin-sns/SPEC.md) を参照。
    *   `sns_threads` (スレッド情報)
    *   `sns_messages` (メッセージ本文・いいね・添付ファイル情報)

### 4.3. 複式簿記プラグイン (`@basekit/plugin-bookkeeping`)
副業・個人事業主向けの本格的な複式簿記＆決算書作成モジュール。
*   **主な機能**:
    *   **勘定科目管理（事業按分比率）**: 資産・負債・純資産・収益・費用の勘定科目の登録。各科目ごとに「事業比率 (家事按分%)」を 0% 〜 100% の範囲で編集可能。初期起動時に副業向けの標準勘定科目（約40件）を自動シード。
    *   **簡易仕訳**: 取引日、摘要、借方勘定・金額、貸方勘定・金額の1対1の仕訳入力。借方・貸方の金額が一致しているか等の整合性バリデーション。論理削除対応。
    *   **決算書下書き出力**:
        *   **損益計算書 (P/L)**: 収益合計と、費用科目の金額に「事業比率」を掛け合わせた「事業経費合計」から当期純利益を自動計算。
        *   **貸借対照表 (B/S)**: 資産・負債・純資産の自動集計。家事按分により除外されたプライベート使用分（`金額 * (100 - 事業比率) / 100`）を **`事業主貸`** 勘定として動的に加算し、`資産 = 負債 + 純資産` の貸借一致を保証。
    *   **PluginBus連携**: 個人業務効率化プラグインでの「工数記録追加」イベントを購読し、「金額 = (作業時間(分) / 60) * 時給単価(初期値: 3,000円)」として労務費・未払費用の **仕訳下書き** を自動生成。UI上での「承認（正規仕訳へ登録 ＆ 下書き削除）」または「却下（下書き削除）」が可能。
*   **詳細仕様書 ＆ スキーマ**: [SPEC.md](packages/plugin-bookkeeping/SPEC.md) を参照。
    *   `bookkeeping_accounts` (勘定科目・按分比率)
    *   `bookkeeping_entries` (仕訳帳)
    *   `bookkeeping_drafts` (仕訳下書き)

---

## 5. 動作手順 ＆ ビルド手順

### 5.1. 依存関係のセットアップ
モノレポのルートディレクトリで以下を実行します：
```bash
npm install
```

### 5.2. ローカル開発サーバーの起動
*   **共通ポータル (Next.js)** を起動する場合:
    ```bash
    npm run dev:core
    ```
    ブラウザで `http://localhost:3000` を開きます。設定画面から認証トグル（バイパス）やデータベース接続先の切り替え（Mock PostgreSQL, LocalStorage, PostgreSQL）が可能です。
    
*   **スタンドアロン版 (Vite + React)** を起動する場合:
    ```bash
    npm run dev:standalone
    ```
    ブラウザで `http://localhost:5173` を開きます。データベースは `localStorage` 上で完全に閉じた状態で動作します。

### 5.3. ビルドと静的検証
*   **モノレポ全体のビルド**:
    ```bash
    npm run build:all
    ```
*   **スタンドアロンパッケージのビルド ＆ 外部通信完全遮断チェック**:
    ```bash
    npm run build -w @basekit/standalone
    ```
    このビルドプロセスを実行すると、ビルドスクリプト (`check-no-network.js`) が自動的に起動し、`packages/standalone/src` 配下のソースコードに `fetch` や `axios` などの通信処理、または localhost 以外の外部URLが存在しないかを静的にスキャンします。違反が検出された場合、ビルドは即座に中止されます（安全なオフライン配信用）。

---

## 6. ドキュメント体系マッピング

本リポジトリに含まれる全ドキュメントへのリンクマップです。

### 6.1. プロジェクト運営 ＆ 思想（BaseKit Constitution）
AI協調開発の下で作成された、プロジェクトの運営指針と哲学です。
*   [Document Information](docs/constitution/Document%20Information.md) (文書情報)
*   [Version History](docs/constitution/Version%20History.md) (改訂履歴)
*   [Acknowledgements](docs/constitution/Acknowledgements.md) (謝辞)
*   [BaseKit Project Blueprint v1.0](docs/constitution/BaseKit%20Project%20Blueprint%20v1.0.md) (プロジェクト全体像)
*   [第2章: Vision & Mission](docs/constitution/第2章%20Vision%20&%20Mission.md) (ビジョンと使命)
*   [第3章: Project Philosophy](docs/constitution/第3章%20Project%20Philosophy.md) (プロジェクト哲学)
*   [第4章: Architecture Blueprint](docs/constitution/第4章%20Architecture%20Blueprint.md) (アーキテクチャ設計図)
*   [第5章: Development Methodology](docs/constitution/第5章%20Development%20Methodology.md) (仕様書中心・AI協調開発手法)
*   [第6章: Verification Projects](docs/constitution/第6章%20Verification%20Projects.md) (実証プロジェクト戦略)
*   [第7章: Roadmap & Release Strategy](docs/constitution/第7章%20Roadmap%20&%20Release%20Strategy.md) (ロードマップとリリース戦略)
*   [第8章: Project Principles](docs/constitution/第8章%20Project%20Principles.md) (開発原則)
*   [第9章: Non-Goals](docs/constitution/第9章%20Non-Goals.md) (非目標・やらないこと)
*   [第10章: OSS Strategy](docs/constitution/第10章%20OSS%20Strategy.md) (オープンソース戦略・Pluginエコシステム)
*   [第11章: AI Collaboration Framework](docs/constitution/第11章%20AI%20Collaboration%20Framework.md) (AI協調開発フレームワーク)
*   [第12章: Documentation Strategy](docs/constitution/第12章%20Documentation%20Strategy.md) (ドキュメントファースト戦略)
*   [第13章: Plugin Ecosystem](docs/constitution/第13章%20Plugin%20Ecosystem.md) (エコシステムの形成)
*   [第14章: Governance & Sustainability](docs/constitution/第14章%20Governance%20&%20Sustainability.md) (ガバナンスと持続可能性)
*   [第15章: Future Vision](docs/constitution/第15章%20Future%20Vision.md) (未来への展望)
*   [第16章: Roadmap](docs/constitution/第16章%20Roadmap.md) (長期開発ロードマップ)
*   [第17章: Glossary](docs/constitution/第17章%20Glossary.md) (用語集)
*   [第18章: Appendix](docs/constitution/第18章%20Appendix.md) (付録)
*   [第19章: BaseKit Declaration](docs/constitution/第19章%20BaseKit%20Declaration.md) (ベースキット宣言)
*   [第20章: Origin Story](docs/constitution/第20章%20Origin%20Story.md) (オリジンストーリー)
*   [あとがき: AIと共に歩き始めた4か月、そしてこれから](docs/constitution/あとがき.md)

### 6.2. 開発ログ ＆ 移行記録
これまでの開発プロセスやマイグレーションの記録です。
*   [2026-07-14 移行ログ](docs/development_logs/2026-07-14_migration_log.md) (移行・統合計画の歩み)
*   [全チャットログ履歴](docs/development_logs/complete_chat_history.md) (対話プロセスアーカイブ)
