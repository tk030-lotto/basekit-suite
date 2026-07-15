# 第16章 Roadmap

## 開発ロードマップ

---

# 16.1 Purpose

本章では、BaseKitの長期的な開発計画を定義する。

Roadmapは「実装予定一覧」ではない。

Visionを現実へ落とし込むための優先順位を示す指針であり、プロジェクト全体の方向性を共有することを目的とする。

BaseKitは完成を目指すプロジェクトではなく、継続的な改善と実証を繰り返しながら成熟するプロジェクトである。

---

# 16.2 Roadmap Philosophy

BaseKitは以下の原則に従って成長する。

* Coreを最小限に保つ。
* Pluginを中心に拡張する。
* Documentationを資産として育てる。
* AIとの共同開発を前提とする。
* 実証されたものだけを共通化する。

Roadmapは、この原則を維持しながら段階的に発展する。

---

# 16.3 Development Stages

BaseKitは5つの段階を経て成長する。

```text id="1k4l2a"
Stage 1
Foundation

↓

Stage 2
Validation

↓

Stage 3
Expansion

↓

Stage 4
Community

↓

Stage 5
Ecosystem
```

---

# 16.4 Stage 1 – Foundation

## 目的

BaseKitの土台を完成させる。

### 主な成果物

* Vision
* Mission
* Constitution
* Blueprint
* Architecture
* Specification
* SDK
* Plugin Framework
* Event Bus
* Documentation Suite

### 成功基準

* Coreが安定している。
* 基本設計が完成している。
* AIで開発可能な状態になっている。

**この段階が最優先である。**

---

# 16.5 Stage 2 – Validation

## 目的

実証プロジェクトを通じて設計を検証する。

対象例

* CRM BaseKit
* Personal Productivity BaseKit
* Stock Analysis
* Double-entry Accounting
* SNS
* Multi Business System

### 実施内容

* 共通化候補抽出
* Plugin化
* Specification改善
* Architecture改善

### 成功基準

* Rule of Threeを満たす機能が現れる。
* Plugin設計が安定する。
* Core変更が減少する。

---

# 16.6 Stage 3 – Expansion

## 目的

Pluginエコシステムを拡大する。

対象

* Foundation Plugins
* Business Plugins
* Analysis Plugins
* Integration Plugins
* AI Plugins

### 実施内容

* Plugin Template公開
* SDK改善
* Plugin Guide整備
* Sample Plugin追加

### 成功基準

* Plugin開発が容易になる。
* Documentationが充実する。
* AIによるPlugin開発が効率化する。

---

# 16.7 Stage 4 – Community

## 目的

OSSコミュニティを育成する。

対象

* Contributors
* Maintainers
* Plugin Developers
* Documentation Contributors
* AI Contributors

### 実施内容

* Contribution Guide公開
* Community運営
* レビュー体制整備
* ガバナンス確立

### 成功基準

* 外部Contributorが継続的に参加する。
* Documentation改善が継続する。
* Plugin公開が増加する。

---

# 16.8 Stage 5 – Ecosystem

## 目的

自律的に成長するエコシステムを形成する。

将来的な構成

```text id="4v8sza"
BaseKit

├── Core

├── Official Plugins

├── Community Plugins

├── Industry Plugins

├── SDK

├── Documentation

├── AI Guides

├── Sample Projects

└── Community Knowledge Base
```

### 成功基準

* Coreが安定している。
* Community Pluginが継続的に増える。
* Founderへの依存が減る。

---

# 16.9 Current Position

現時点では、BaseKitは**Stage 1（Foundation）からStage 2（Validation）への移行期**にある。

現在進行中の主な取り組みは以下である。

### 完了・進行中

* Blueprint作成
* Architecture設計
* Plugin設計
* CRM BaseKit
* 個人業務効率化BaseKit
* Python版BaseKit
* JavaScript版BaseKit
* AI共同開発フロー確立

### 計画済み

* 株価分析BaseKit
* 副業者向け複式簿記BaseKit
* SNS BaseKit
* マルチ業務システムBaseKit

これらを通じて共通機能を抽出し、CoreおよびPluginへ反映する。

---

# 16.10 Priority Strategy

優先順位は以下とする。

| 優先度   | 内容               |
| ----- | ---------------- |
| ★★★★★ | Documentation    |
| ★★★★★ | Architecture     |
| ★★★★★ | Specification    |
| ★★★★☆ | SDK              |
| ★★★★☆ | Plugin Framework |
| ★★★☆☆ | Official Plugins |
| ★★☆☆☆ | Sample Projects  |
| ★☆☆☆☆ | Marketplace      |

まずは設計資産を完成させ、その後に実装を拡充する。

---

# 16.11 Success Metrics

Roadmapの進捗は以下で評価する。

### Documentation

* Blueprint完成率
* Specification数
* ADR数

### Core

* Core変更回数
* Core安定性
* 後方互換性

### Plugin

* Plugin数
* Plugin再利用率
* Foundation Plugin数

### Community

* Contributors数
* Pull Request数
* Documentation改善数

### AI

* AIレビュー数
* AI Guide更新数
* AI開発成功事例数

---

# 16.12 Long-term Milestones

長期的な目標として、以下を設定する。

### Milestone 1

BaseKit Core Version 1.0

---

### Milestone 2

Official Plugin Suite公開

---

### Milestone 3

Plugin SDK完成

---

### Milestone 4

Documentation Suite完成

---

### Milestone 5

Community Contributors参加

---

### Milestone 6

100以上のCommunity Plugin公開

※数値自体が目的ではなく、多様な活用事例が生まれている状態を示す目安とする。

---

### Milestone 7

Founderに依存しないOSS運営体制

---

# 16.13 Adaptive Roadmap

Roadmapは固定ではない。

新しい技術やAIの進化、コミュニティからの提案、実証プロジェクトの成果に応じて見直しを行う。

変更を行う場合は、Vision・Mission・Constitutionとの整合性を維持する。

---

# 16.14 Project Statement

BaseKitのRoadmapは、「機能を増やす計画」ではない。

設計思想を成熟させ、共通基盤を育て、人とAIとコミュニティが協力して価値を積み重ねられる環境を構築するための長期戦略である。

短期的な成果よりも、10年後も利用される設計資産を残すことを重視する。

---

# 第16章まとめ

BaseKitは、Foundation・Validation・Expansion・Community・Ecosystemという5つの段階を経て発展する。

まずは設計・Documentation・Coreを完成させ、実証プロジェクトから共通化を進め、PluginエコシステムとOSSコミュニティを育てる。

最終的には、創設者一人ではなく、多くの利用者・開発者・AIが協力しながら進化し続ける、持続可能なAIネイティブOSS基盤を実現することを目標とする。
