# BaseKit Suite

> **Build Less. Share More. Grow Together.**

AI時代のソフトウェア開発を前提として設計された、コンポーザブル（着脱可能）かつ自己防衛的なOSS開発基盤および業務系ツールパッケージ。

---

## 1. プロジェクト概要

BaseKit Suiteは、個人開発者や副業エンジニアが、セキュリティと法的リスクを徹底的に自己防衛しながら、ランニングコスト0円で頑丈なWebアプリケーション/スタンドアロンツールを構築・提供するためのお手本（Codex）となるリポジトリです。

---

## 2. ディレクトリ構成（モノレポ）

本プロジェクトは、`npm workspaces` を使用したモノレポ構成を採用し、共通インフラと各機能を物理的に完全に分離しています。

*   **[core/](packages/core/)** : 共通UI、PluginBus、認証抽象化、免責Middleware等を備えたNext.js Webポータル基盤。
*   **[standalone/](packages/standalone/)** : サーバーもデータベースも不要、ブラウザの `localStorage` だけで安全に動く社用PC向けの超軽量シングルHTML版。
*   **plugins/** (機能プラグイン):
    *   **[personal-ops/](packages/plugin-personal-ops/)** : 個人業務効率化ツール（タスク・タイムトラッカー）
    *   **[sns/](packages/plugin-sns/)** : 業務用SNSシステム（チーム連絡・PluginBus通知連携）
    *   **[bookkeeping/](packages/plugin-bookkeeping/)** : 複式簿記システム（簡易仕訳・確定申告用B/S, P/L下書き出力）

---

## 3. 技術設計 ＆ プラグイン開発仕様

BaseKit Coreのアーキテクチャおよびプラグインを自作するための仕様書です。

*   **[BaseKit Core 定義設計書](docs/architecture/basekit-core-design.md)** : 0円運用、認証トグル、マルチDB接続、3大拡張インターフェース（AI・入出力・通知）の設計解説。
*   **[プラグイン実装仕様書](docs/specification/plugin-spec.md)** : モノレポ規則、論理削除、PluginBus連携、外部通信完全遮断ルールの開発規格。

---

## 4. BaseKit Constitution（憲法 ＆ 開発思想）

AIとの対話から紡ぎ出された、BaseKitプロジェクトの最上位ビジョンおよび運営指針。

### ドキュメント概要
*   [Document Information](docs/constitution/Document%20Information.md) (文書情報)
*   [Version History](docs/constitution/Version%20History.md) (改訂履歴)
*   [Acknowledgements](docs/constitution/Acknowledgements.md) (謝辞)
*   [BaseKit Project Blueprint v1.0](docs/constitution/BaseKit%20Project%20Blueprint%20v1.0.md) (プロジェクト全体像)

### 各章へのリンク
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

### あとがき
*   [あとがき: AIと共に歩き始めた4か月、そしてこれから](docs/constitution/あとがき.md)
