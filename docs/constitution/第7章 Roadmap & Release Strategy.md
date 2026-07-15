# 第7章 Roadmap & Release Strategy

## ロードマップとリリース戦略

---

# 7.1 Purpose

BaseKitは、一度の開発で完成するプロジェクトではない。

実証プロジェクトを通じて共通機能を抽出し、Core・Plugin・SDK・Documentationを継続的に改善する長期プロジェクトである。

本章では、BaseKitの開発ロードマップとリリース方針を定義する。

---

# 7.2 Development Philosophy

BaseKitのロードマップは「機能追加」を目的としない。

目標は以下の3点である。

* Coreを安定させること
* Pluginエコシステムを育てること
* AIとの共同開発手法を成熟させること

機能数ではなく、品質・再利用性・保守性を重視する。

---

# 7.3 Development Phases

BaseKitは以下のフェーズで発展する。

```text
Phase 0
Concept

↓

Phase 1
Foundation

↓

Phase 2
Verification

↓

Phase 3
Core Stabilization

↓

Phase 4
Plugin Ecosystem

↓

Phase 5
Community Growth

↓

Phase 6
Long-term Maintenance
```

各フェーズには明確な目的を設定する。

---

# 7.4 Phase 0 – Concept

目的

BaseKitの思想と方向性を確立する。

成果物

* Blueprint
* Vision
* Mission
* Constitution
* Project Philosophy

完了条件

* 基本理念が文書化されている。
* 開発方針が定義されている。

---

# 7.5 Phase 1 – Foundation

目的

最小構成のBaseKitを構築する。

対象

* Core
* SDK
* Plugin Loader
* Event Bus
* Authentication
* Logging
* Configuration
* Documentation

完了条件

* Coreが単独で動作する。
* Pluginが読み込める。
* サンプルPluginが動作する。

---

# 7.6 Phase 2 – Verification

目的

実証プロジェクトを通じて設計を検証する。

対象プロジェクト

* 個人業務効率化ツール
* CRM BaseKit
* 株価分析システム
* 複式簿記システム
* SNSシステム
* マルチ業務システム

評価項目

* 共通機能
* Plugin構造
* SDK
* AI開発フロー
* ドキュメント

完了条件

* Rule of Threeを満たす共通機能が抽出されている。

---

# 7.7 Phase 3 – Core Stabilization

目的

Coreを安定させる。

実施内容

* API整理
* Event整理
* SDK改善
* 後方互換性の確保
* Performance改善
* セキュリティ確認

Coreへの新規機能追加は最小限とする。

---

# 7.8 Phase 4 – Plugin Ecosystem

目的

Pluginを中心としたエコシステムを形成する。

対象

* Official Plugin
* Community Plugin
* Sample Plugin
* Marketplace構想（将来）

Pluginは独立したライフサイクルで開発・公開できる構造とする。

---

# 7.9 Phase 5 – Community Growth

目的

コミュニティ主導のプロジェクトへ発展させる。

実施内容

* Contributor Guide整備
* Plugin Guide整備
* AI Guide整備
* Issue Template整備
* Pull Request Template整備
* ADR公開

BaseKitは、一人の開発者だけで成長するプロジェクトではない。

---

# 7.10 Phase 6 – Long-term Maintenance

目的

長期的に利用できる基盤を維持する。

重点項目

* 安定性
* 後方互換性
* Documentation
* SDK保守
* セキュリティ更新
* Plugin互換性

Coreは継続的に改善するが、大規模な破壊的変更は慎重に判断する。

---

# 7.11 Release Policy

BaseKitでは以下のリリース区分を採用する。

## Alpha

設計検証を目的とした初期版。

対象

* 開発者
* AIレビュー
* 実証プロジェクト

---

## Beta

基本機能が完成し、実運用前の評価を行う版。

対象

* テスト利用者
* 小規模事業者
* パイロットユーザー

---

## Stable

一般利用を想定した安定版。

対象

* OSS利用者
* 個人開発者
* 小規模開発会社
* 中小企業

---

## LTS（Long Term Support）

長期間利用する利用者向けの安定版。

重要な修正のみを提供する。

---

# 7.12 Versioning Policy

BaseKitはSemantic Versioningを採用する。

```
MAJOR.MINOR.PATCH
```

MAJOR

互換性が失われる変更。

MINOR

新機能追加。

PATCH

バグ修正。

CoreとPluginは、それぞれ独立してバージョン管理できる。

---

# 7.13 Success Milestones

BaseKitでは以下を重要なマイルストーンとする。

## Milestone 1

Blueprint完成

---

## Milestone 2

Core v1完成

---

## Milestone 3

SDK公開

---

## Milestone 4

Official Plugin公開

---

## Milestone 5

実証プロジェクト完了

---

## Milestone 6

BaseKit v1.0 Stable公開

---

## Milestone 7

Community Contributors参加開始

---

## Milestone 8

Plugin Ecosystem形成

---

# 7.14 Non-goals

ロードマップには含めないもの。

* あらゆる業務システムをCoreへ実装すること
* 巨大なフレームワーク化
* Pluginへの過度な制約
* 特定言語への依存
* 短期間での機能追加競争

BaseKitは機能数ではなく、品質を重視する。

---

# 7.15 Long-term Vision

BaseKitの最終目標は、多数の業務システムを提供することではない。

共通基盤とPluginエコシステムを育てることで、個人開発者・フリーランス・小規模開発会社・中小企業が、AIと協力しながら効率的にシステムを構築できる環境を提供することである。

BaseKitは、一人の開発者が完成させるプロジェクトではなく、多くの利用者と開発者によって継続的に改善されるOSSプラットフォームを目指す。

---

# 第7章まとめ

BaseKitは、短期間で完成を目指すプロジェクトではなく、実証・改善・共通化を繰り返しながら成熟していく長期プロジェクトである。

Coreは最小限に保ち、Pluginエコシステムを中心に発展させる。

ロードマップは「機能を増やす計画」ではなく、「品質・再利用性・持続可能性を高める計画」として運用する。
