# 第12章 Documentation Strategy

## ドキュメント戦略

---

# 12.1 Purpose

BaseKitでは、ドキュメントをコードと同等の重要な成果物として位置付ける。

Blueprint、Architecture、Specification、ADR、Guideは、実装を補足する資料ではなく、プロジェクト全体を支える設計資産である。

本章では、Documentationの役割、構成、運用方針を定義する。

---

# 12.2 Documentation Philosophy

BaseKitでは以下を基本理念とする。

**Documentation is Architecture.**

設計思想はDocumentationによって共有される。

実装は変更されても、設計思想はDocumentationとして長期間維持される。

Documentationは、利用者・開発者・AIの共通言語である。

---

# 12.3 Documentation Objectives

Documentationは次の目的を持つ。

* プロジェクトの思想を共有する。
* Architectureを定義する。
* 実装方針を統一する。
* AIとの共同開発を支援する。
* Plugin開発を容易にする。
* OSS参加者の学習コストを下げる。
* 長期保守を支援する。

---

# 12.4 Documentation Structure

Documentation Suiteは以下の構成とする。

```text
docs/

├── blueprint/
│
├── constitution/
│
├── architecture/
│
├── specifications/
│
├── adr/
│
├── methodology/
│
├── developer-guide/
│
├── ai-guide/
│
├── plugin-guide/
│
├── sdk-guide/
│
├── tutorials/
│
├── reference/
│
└── diagrams/
```

すべてのDocumentationは、この構成に従って管理する。

---

# 12.5 Documentation Hierarchy

Documentationには優先順位を定義する。

```text
Vision

↓

Mission

↓

Constitution

↓

Blueprint

↓

Architecture

↓

ADR

↓

Specification

↓

Developer Guide

↓

AI Guide

↓

Implementation
```

下位の文書は、上位文書と矛盾してはならない。

---

# 12.6 Blueprint

BlueprintはBaseKit全体の設計思想を定義する。

対象

* Vision
* Mission
* Philosophy
* Architecture概要
* Development Methodology
* OSS Strategy

Blueprintは設計の最上位文書である。

---

# 12.7 Architecture Documents

Architectureでは構造を定義する。

対象

* Core
* Plugin
* SDK
* Event Bus
* Directory
* Layer
* Dependency

実装方法ではなく、構造を説明する。

---

# 12.8 Specifications

Specificationでは詳細仕様を定義する。

例

* Plugin Specification
* Event Specification
* SDK Specification
* Authentication Specification
* Configuration Specification
* Logging Specification

実装前にSpecificationを作成する。

---

# 12.9 ADR (Architecture Decision Records)

重要な設計判断はADRとして記録する。

記録内容

* 背景
* 課題
* 選択肢
* 採用理由
* 却下理由
* 影響範囲

将来の設計変更時にも参照できるよう保管する。

---

# 12.10 Developer Guide

Developer Guideは実装者向け文書である。

内容

* 開発環境
* ディレクトリ構成
* Plugin作成方法
* SDK利用方法
* テスト方法
* コーディング規約

新規開発者が短期間で参加できることを目的とする。

---

# 12.11 AI Guide

AI GuideはAIとの共同開発を支援する。

内容

* Prompt Rules
* Review Rules
* Context Rules
* Specificationの渡し方
* Unit単位の開発方法
* AIレビュー方法

AIごとの差異ではなく、共通原則を中心に整理する。

---

# 12.12 Plugin Guide

Plugin GuideはPlugin開発者向け文書である。

内容

* Plugin構造
* Manifest
* Lifecycle
* Event
* Dependency
* Version管理
* 配布方法

Pluginを独立して開発できるよう支援する。

---

# 12.13 Documentation Lifecycle

Documentationは以下の順序で作成・更新する。

```text
Idea

↓

Blueprint

↓

Architecture

↓

Specification

↓

ADR

↓

Implementation

↓

Review

↓

Documentation Update
```

Documentationは実装と同期して更新する。

---

# 12.14 Documentation Review

Documentationにもレビューを行う。

確認項目

* Blueprintとの整合性
* Architectureとの整合性
* 用語統一
* 図との一致
* 実装との一致
* AIが理解しやすいか
* OSS利用者が理解しやすいか

Documentationもコードレビューと同等に扱う。

---

# 12.15 Documentation Versioning

Documentationはソースコードと同様にバージョン管理する。

対象

* Markdown
* Diagram
* ADR
* Specification
* API Reference

すべてGitで履歴を管理する。

---

# 12.16 Living Documentation

Documentationは完成品ではない。

BaseKitの進化に合わせて継続的に改善する。

新しい設計、Plugin、AI開発手法が追加された場合は、Documentationも同時に更新する。

Documentationは「生きた設計資産」として維持する。

---

# 12.17 Quality Standards

Documentationは以下を満たすことを目標とする。

* 一貫性
* 正確性
* 再利用性
* 保守性
* 可読性
* AI可読性
* OSS利用者の理解しやすさ

専門知識がない利用者でも、設計思想を理解できる品質を目指す。

---

# 12.18 Long-term Vision

BaseKit Documentation Suiteは、単なる操作説明書ではない。

BlueprintからSpecificationまでを統合した「設計資産」として、長期間利用できることを目指す。

AI、人、OSSコミュニティが共通の設計思想を共有するための基盤となり、実装が変わっても価値を失わない知識体系を形成する。

---

# 第12章まとめ

BaseKitでは、Documentationをプロジェクトの中核資産として扱う。

Blueprint・Architecture・Specification・ADR・Guideは相互に連携し、人とAIの共通言語として機能する。

コードだけではなくDocumentationを継続的に育てることで、長期的に保守可能で参加しやすいOSSプロジェクトを実現する。
