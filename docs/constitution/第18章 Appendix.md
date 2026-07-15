# 第18章 Appendix

## 付録・参考資料

---

# 18.1 Purpose

本章では、BaseKitプロジェクトを理解・運用・拡張するための補足情報をまとめる。

Appendixは設計方針を定義する章ではなく、利用者・開発者・AI・コミュニティが参照するための参考資料集である。

今後もプロジェクトの成長に合わせて継続的に更新する。

---

# 18.2 Target Audience

BaseKitは幅広い利用者を想定している。

対象例

* 個人開発者
* 副業開発者
* フリーランス
* 小規模開発会社
* 中小企業
* OSSコミュニティ
* AIを活用した開発者
* 教育機関・学習者

それぞれが必要な範囲だけを利用できることを目指す。

---

# 18.3 Recommended Repository Structure

推奨するGitHubリポジトリ構成の一例を示す。

```text id="7qa82n"
basekit/

├── docs/
│
├── core/
│
├── sdk/
│
├── plugins/
│
├── examples/
│
├── templates/
│
├── tools/
│
├── tests/
│
├── scripts/
│
├── assets/
│
├── .github/
│
├── LICENSE
│
├── README.md
│
└── CONTRIBUTING.md
```

実際の構成はプロジェクトの成長に応じて変更できる。

---

# 18.4 Documentation Suite

Documentationは以下で構成される。

```text id="m4d8tc"
Vision

Mission

Constitution

Blueprint

Architecture

Specification

ADR

Developer Guide

Plugin Guide

AI Guide

Tutorials

Reference
```

DocumentationはBaseKit最大の資産である。

---

# 18.5 Reference Projects

BaseKitの設計を検証するため、以下のReference Projectを順次開発する。

現在

* CRM BaseKit
* 個人業務効率化BaseKit

計画中

* 株価分析BaseKit
* 副業者向け複式簿記BaseKit
* SNS BaseKit
* マルチ業務システムBaseKit

これらは完成品ではなく、共通化候補を発見するための実証プロジェクトとして位置付ける。

---

# 18.6 Plugin Examples

将来的に以下のようなPluginを公開することを想定する。

Foundation

* Logging
* Notification
* Scheduler
* Dashboard

Business

* CRM
* Accounting
* Inventory
* Sales

Analysis

* Stock Analysis
* Lottery Analysis
* Forecast

Integration

* Email
* OAuth
* Calendar
* Cloud Storage

AI

* Prompt Manager
* AI Review
* Workflow Assistant

これらは参考例であり、公式提供を保証するものではない。

---

# 18.7 AI Development Workflow

推奨するAI共同開発フロー

```text id="a3pt41"
Idea

↓

Blueprint

↓

Architecture

↓

Specification

↓

AI Implementation

↓

AI Review

↓

Human Review

↓

Testing

↓

Documentation Update

↓

Release
```

Documentationを中心に据えることが重要である。

---

# 18.8 Design Checklist

設計開始前に確認する項目

□ Visionに合致しているか

□ Coreへ追加する必要があるか

□ Pluginで実現できないか

□ Rule of Threeを満たしているか

□ Documentationを更新したか

□ AIが理解しやすい構造か

□ 保守可能か

□ 将来の再利用を考慮しているか

---

# 18.9 Plugin Checklist

Plugin公開前に確認する項目

□ Manifest作成

□ README作成

□ Version設定

□ License設定

□ Specification作成

□ テスト実施

□ AIレビュー

□ Humanレビュー

---

# 18.10 Documentation Checklist

Documentation更新時に確認する。

□ Blueprintとの整合性

□ Architectureとの整合性

□ 用語統一

□ 図の更新

□ サンプル更新

□ AI Guide更新

□ リンク確認

---

# 18.11 Recommended Development Flow

BaseKitでは以下の順序を推奨する。

```text id="qp8v2r"
Idea

↓

Requirements

↓

Blueprint

↓

Architecture

↓

Specification

↓

Prototype

↓

Verification

↓

Plugin

↓

Review

↓

Release
```

実装よりも設計を優先する。

---

# 18.12 Suggested Toolchain

BaseKitは特定ツールへの依存を前提としない。

想定される利用例

設計

* Markdown
* Mermaid
* Draw.io

実装

* Python
* JavaScript / TypeScript

バージョン管理

* Git
* GitHub

AI

* 任意の生成AIサービス

利用者は目的に応じて自由に選択できる。

---

# 18.13 Licensing Policy

BaseKitはOSSとして公開することを前提とする。

ライセンスはプロジェクト開始時に決定する。

選定基準

* 商用利用の可否
* Plugin配布との整合性
* コミュニティ参加のしやすさ
* 長期運営への適合性

ライセンスはプロジェクト理念と整合するものを採用する。

---

# 18.14 Frequently Asked Questions

**Q. BaseKitは完成品ですか。**

いいえ。

BaseKitは開発基盤です。

---

**Q. 業務システムは含まれますか。**

業務機能はPluginとして提供します。

---

**Q. Coreへ機能追加できますか。**

Rule of Threeと実証結果を満たした場合のみ検討します。

---

**Q. AIが必須ですか。**

必須ではありません。

ただし、AIとの共同開発を前提に設計されています。

---

**Q. 一人でも利用できますか。**

はい。

個人開発から小規模チームまで利用できます。

---

# 18.15 References

BaseKitは以下の考え方を参考に設計されている。

* Modular Architecture
* Plugin Architecture
* Event-Driven Architecture
* Domain-Driven Design
* Clean Architecture
* Documentation as Code
* Open Source Governance
* AI-Assisted Software Development

ただし、特定の設計手法に限定されず、BaseKit独自の設計思想として再構成している。

---

# 18.16 Appendix Maintenance

Appendixは固定資料ではない。

新しいReference Project、Plugin、設計パターン、AI活用方法などが追加された場合は、本章も継続的に更新する。

Appendixは、プロジェクト全体の知識ベースとして機能する。

---

# 18.17 Final Reference

BaseKit Documentationを利用する際は、以下の順序で参照することを推奨する。

```text id="vx90pb"
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

Specification

↓

Developer Guide

↓

Plugin Guide

↓

AI Guide

↓

Implementation
```

この順序に従うことで、設計思想から実装まで一貫した理解を得ることができる。

---

# 第18章まとめ

Appendixは、BaseKitの設計思想を実践するための参考資料集である。

Reference Project、Plugin例、開発フロー、チェックリスト、推奨構成などを体系的に整理し、利用者・開発者・AI・コミュニティが共通の知識を共有できる環境を提供する。

BaseKitはコードだけでなく、Documentationと知識の蓄積によって進化し続けるOSSプロジェクトである。
