# 第17章 Glossary

## 用語集

---

# 17.1 Purpose

本章では、BaseKitで使用する主要な用語を定義する。

Blueprint、Architecture、Specification、およびDocumentation全体において、用語の意味を統一し、利用者・開発者・AIが共通の理解を持てるようにすることを目的とする。

本章で定義された用語を公式な用語とする。

---

# 17.2 BaseKit

BaseKitとは、本プロジェクトが提供する共通開発基盤である。

BaseKitは業務システムそのものではなく、様々なシステムを効率的に構築するためのCore・Plugin Framework・SDK・Documentationから構成される。

---

# 17.3 Core

Coreとは、BaseKitの中核となる実行基盤である。

Coreは最小限の責務のみを持ち、Pluginが動作するために必要な共通機能のみを提供する。

Coreへ業務ロジックを実装しないことを原則とする。

---

# 17.4 Plugin

Pluginとは、BaseKitへ機能を追加する独立した拡張モジュールである。

Pluginは独立して開発・配布・更新・削除できる。

業務機能は原則としてPluginとして実装する。

---

# 17.5 Foundation Plugin

業務に依存しない共通機能を提供するPlugin。

例

* Notification
* Scheduler
* Search
* Dashboard
* Audit Log

---

# 17.6 Business Plugin

業務システムを構成するPlugin。

例

* CRM
* Accounting
* Inventory
* Sales
* SNS

---

# 17.7 Analysis Plugin

分析処理を提供するPlugin。

例

* Stock Analysis
* Lottery Analysis
* Forecast
* Statistics

---

# 17.8 Integration Plugin

外部サービスとの連携を担当するPlugin。

例

* Email
* Calendar
* Cloud Storage
* Payment
* OAuth

---

# 17.9 AI Plugin

AI機能を提供するPlugin。

例

* AI Chat
* AI Review
* Prompt Manager
* Workflow Assistant

---

# 17.10 Unit

Unitとは、一つの責務のみを持つ最小単位のモジュールである。

AIによる開発・レビュー・修正はUnit単位で実施することを推奨する。

---

# 17.11 Module

Moduleとは、複数のUnitをまとめた論理的な機能単位である。

Plugin内部は複数のModuleによって構成される場合がある。

---

# 17.12 SDK

SDK（Software Development Kit）とは、Plugin開発を支援する共通ライブラリ群である。

SDKはPlugin開発者がCoreへ依存しすぎることを防ぎ、統一された実装方法を提供する。

---

# 17.13 Event

Eventとは、Plugin間の情報伝達を行うための通知である。

Pluginは直接依存せず、Eventを介して疎結合に連携する。

---

# 17.14 Event Bus

Event Busとは、Eventを配信・受信する共通基盤である。

Plugin同士の直接通信を避けるために利用する。

---

# 17.15 Blueprint

Blueprintとは、BaseKit全体の設計思想を定義する最上位文書である。

Vision、Mission、Philosophy、Architecture概要などを含む。

---

# 17.16 Architecture

Architectureとは、システム構造を定義した文書である。

Core構造、Plugin構造、Layer、Dependencyなどを定義する。

---

# 17.17 Specification

Specificationとは、実装仕様を定義した文書である。

実装はSpecificationに基づいて行う。

---

# 17.18 ADR

ADR（Architecture Decision Record）とは、重要な設計判断を記録する文書である。

背景、選択肢、採用理由、影響範囲などを記録する。

---

# 17.19 Documentation Suite

Documentation Suiteとは、BaseKit全体のドキュメント群を指す。

構成例

* Blueprint
* Architecture
* Specification
* ADR
* Developer Guide
* AI Guide
* Plugin Guide
* Tutorials

---

# 17.20 Constitution

Constitutionとは、BaseKitの基本理念・設計原則・運営方針を定義した最上位規約である。

すべてのDocumentationおよびImplementationはConstitutionに従う。

---

# 17.21 Manifest

Manifestとは、Pluginに関する基本情報を定義した設定ファイルである。

例

* Plugin ID
* Version
* Dependencies
* Entry Point
* License

---

# 17.22 Dependency

Dependencyとは、ある機能が他の機能へ依存する関係を指す。

BaseKitでは依存関係を最小限に保ち、疎結合設計を推奨する。

---

# 17.23 Layer

Layerとは、責務ごとに分離されたシステム構造である。

Layer間の責務を明確にし、保守性を向上させる。

---

# 17.24 Rule of Three

Rule of Threeとは、三回以上利用された機能のみ共通化を検討する設計原則である。

将来の利用を予測した共通化は行わない。

---

# 17.25 Proven Reusability

Proven Reusabilityとは、実際の利用実績によって共通化の価値が証明された状態を指す。

実証されていない抽象化は採用しない。

---

# 17.26 Documentation First

Documentation Firstとは、実装より先に設計書・仕様書を整備する開発方針である。

Documentationをプロジェクト全体の基準とする。

---

# 17.27 AI Native

AI Nativeとは、AIとの共同開発を前提として設計・Documentation・開発フローを構築する考え方である。

AIを補助ツールではなく共同開発者として位置付ける。

---

# 17.28 AI Review

AI Reviewとは、AIを利用してArchitecture・Specification・コード・Documentationをレビューする工程である。

AI Reviewは品質向上を目的とするが、最終判断は人が行う。

---

# 17.29 Reference Project

Reference Projectとは、BaseKitの設計を実証するためのサンプルシステムである。

例

* CRM BaseKit
* 個人業務効率化BaseKit
* 株価分析BaseKit
* SNS BaseKit

Reference Projectは共通化候補を発見するための実証環境でもある。

---

# 17.30 Ecosystem

Ecosystemとは、Core・Plugin・SDK・Documentation・AI・コミュニティが相互に連携しながら価値を生み出す全体構造を指す。

BaseKitの最終目標は、このEcosystemを持続的に成長させることである。

---

# 17.31 Contributor

Contributorとは、BaseKitへ貢献するすべての参加者を指す。

コードだけでなく、

* Documentation
* Translation
* Testing
* Review
* Plugin開発
* Issue報告
* AI Guide改善

なども重要なContributionとして扱う。

---

# 17.32 Maintainer

Maintainerとは、BaseKitまたはPluginの保守・レビュー・品質管理を担当するメンバーである。

Maintainerはコードだけでなく、Documentationやコミュニティ運営にも責任を持つ。

---

# 17.33 Founder

Founderとは、BaseKitプロジェクトの創設者である。

Founderの役割は、Vision・Blueprint・Architectureを維持し、プロジェクト全体の方向性を示すことである。

---

# 第17章まとめ

本章で定義した用語は、BaseKit Documentation Suite全体で共通して使用する公式用語である。

用語を統一することで、人・AI・コミュニティが同じ設計思想を共有し、誤解のないコミュニケーションと持続可能な開発を実現する。

Glossaryは、BaseKitの成長に合わせて継続的に更新される「生きた用語集」として維持する。
