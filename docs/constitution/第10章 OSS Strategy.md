# 第10章 OSS Strategy

## オープンソース戦略

---

# 10.1 Purpose

BaseKitは、一人の開発者だけで完成させるプロジェクトではない。

本章では、OSS（Open Source Software）として長期的に成長するための基本戦略を定義する。

目標は、多くの機能を公式で提供することではなく、多くの人が安心して参加・利用・改善できる基盤を構築することである。

---

# 10.2 Vision

BaseKitは、AI時代の共通開発基盤となることを目指す。

個人開発者、フリーランス、小規模開発会社、中小企業が、共通の設計思想と共通基盤を利用しながら、それぞれの業務に応じたシステムを効率的に構築できる環境を提供する。

BaseKitは「完成品を配布するOSS」ではなく、「開発基盤を育てるOSS」である。

---

# 10.3 Official Scope

BaseKit Projectが公式に提供する範囲を以下とする。

## Core

* Core Runtime
* Plugin Manager
* Event Bus
* SDK
* Authentication
* Authorization
* Configuration
* Logging
* Storage Interface

---

## Documentation

* Blueprint
* Architecture
* Specifications
* ADR
* Developer Guide
* AI Guide
* API Reference

---

## Official Plugins

BaseKit Projectでは、共通性が高く再利用価値のあるPluginのみを公式Pluginとして提供する。

例

* User Management
* Notification
* File Management
* Scheduler
* Dashboard
* Audit Log

---

# 10.4 Community Scope

以下はコミュニティによる自由な開発を歓迎する。

* CRM
* SNS
* 会計
* 在庫管理
* 販売管理
* 株価分析
* ロト分析
* AI支援ツール
* 業界特化システム

公式プロジェクトは方向性を示すが、実装を独占しない。

---

# 10.5 Plugin Ecosystem

BaseKitではPluginを中心としたエコシステムを形成する。

Pluginは

* 独立して開発できる
* 独立して公開できる
* 独立して更新できる
* 独立して削除できる

ことを基本とする。

PluginのライフサイクルはCoreから独立している。

---

# 10.6 Governance

BaseKitは段階的にガバナンスを発展させる。

## Stage 1

Founder Driven

設計方針はプロジェクト創設者が決定する。

---

## Stage 2

Maintainer Team

複数のメンテナーによってレビューを行う。

---

## Stage 3

Community Governance

コミュニティによる提案・議論・レビューを中心とした運営へ移行する。

---

# 10.7 Contribution Model

Contributionはコードだけではない。

以下をすべて正式なContributionと位置付ける。

* Documentation
* Architecture改善
* Specification改善
* AI Guide改善
* Plugin開発
* バグ報告
* Issue作成
* テスト
* 翻訳
* サンプル作成

BaseKitは、多様な形での参加を歓迎する。

---

# 10.8 Review Policy

すべてのContributionはレビューを行う。

レビュー対象

* Architectureとの整合性
* Blueprintとの整合性
* Specificationとの整合性
* Coding Standards
* Documentation
* 後方互換性

レビューは品質保証のためのプロセスであり、参加者を評価するものではない。

---

# 10.9 Documentation First Community

BaseKitでは、Documentationへの貢献を重視する。

以下のような改善も重要なContributionとする。

* 誤字修正
* 図の改善
* サンプル追加
* AIプロンプト改善
* チュートリアル追加
* FAQ追加

DocumentationはOSSの重要な成果物である。

---

# 10.10 AI Collaboration Community

BaseKitでは、人だけでなくAIとの協調開発もコミュニティ活動の一部と考える。

推奨される活動

* AIによるレビュー
* AIプロンプト改善
* AI開発フロー改善
* AI比較検証
* AI活用事例の共有

AIを活用した知見もプロジェクト資産として蓄積する。

---

# 10.11 Sustainability

BaseKitは持続可能なOSS運営を目指す。

以下の考え方を基本とする。

* Coreは小さく保つ
* Pluginへ責務を分散する
* Documentationを資産化する
* コミュニティへ権限を委譲する
* 保守可能な範囲で運営する

プロジェクトの成長が、運営者の負担増加だけにつながらない構造を目指す。

---

# 10.12 Funding Philosophy

BaseKitはOSSとして公開する。

プロジェクト運営を継続するため、寄付・スポンサーシップ・技術支援・教育コンテンツ・コミュニティ支援など、多様な支援の仕組みを取り入れることを妨げない。

ただし、Coreの基本機能およびBlueprint・Architecture・Specificationなどの基礎ドキュメントは、可能な限りオープンな形で提供する。

収益化は目的ではなく、プロジェクトを継続するための手段として位置付ける。

---

# 10.13 Success Criteria

OSSとしての成功は、以下で評価する。

* Community Contributorsが増えている。
* Pluginが継続的に公開されている。
* Documentationが改善され続けている。
* AI活用事例が蓄積されている。
* Coreが安定している。
* 実証プロジェクトが継続している。
* 利用者同士が知見を共有している。

---

# 10.14 Long-term Ecosystem

長期的には、以下のようなエコシステム形成を目指す。

```text
BaseKit Core
      │
      ├── Official Plugins
      │
      ├── Community Plugins
      │
      ├── Industry Plugins
      │
      ├── AI Development Guides
      │
      ├── Documentation Suite
      │
      ├── Sample Projects
      │
      └── Community Knowledge Base
```

BaseKit Projectは、このエコシステム全体を支える基盤となる。

---

# 10.15 Project Statement

BaseKitは、一人ですべてを開発するプロジェクトではない。

共通基盤を整備し、利用者・開発者・コミュニティが、それぞれの専門性を活かしながら価値を積み重ねられる環境を提供する。

プロジェクトの役割は「すべてを提供すること」ではなく、「成長できる土台を提供すること」である。

---

# 第10章まとめ

BaseKitのOSS戦略は、Coreを小さく保ち、PluginエコシステムとDocumentationを中心に発展することを基本とする。

公式プロジェクトは設計思想と共通基盤を維持し、コミュニティは多様なPluginや知見を積み重ねる。

AIとの共同開発、仕様書中心の設計、実証による共通化という理念のもと、持続可能で拡張性の高いOSSプラットフォームを長期的に育てていく。
