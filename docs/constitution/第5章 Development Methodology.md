# 第5章 Development Methodology

## AI Native Development Workflow

---

# 5.1 Purpose

BaseKitは、AIとの共同開発を前提とした開発基盤である。

従来の「人が設計し、人が実装する」という開発モデルではなく、「人が設計し、AIが実装を支援し、人がレビューと意思決定を行う」という新しい開発モデルを採用する。

本章では、BaseKitにおける標準的な開発フローと、その判断基準を定義する。

---

# 5.2 基本方針

BaseKitでは、実装よりも設計を優先する。

すべての開発は以下の順序で進める。

1. 課題の整理
2. アイデアの検討
3. 要件定義
4. Blueprintへの反映（必要な場合）
5. Architecture設計
6. Specification作成
7. AIによる実装
8. AIによるレビュー
9. 人によるレビュー
10. 実証プロジェクトへの適用
11. 共通化の判断
12. CoreまたはPluginへの反映

実装は設計の結果であり、設計の代替ではない。

---

# 5.3 Development Lifecycle

BaseKitでは、以下のライフサイクルを標準とする。

```text
課題

↓

壁打ち・アイデア整理

↓

要件定義

↓

Blueprint

↓

Architecture

↓

Specification

↓

AI実装

↓

レビュー

↓

テスト

↓

実証運用

↓

改善

↓

共通化

↓

BaseKit更新
```

この流れをすべてのプロジェクトで繰り返す。

---

# 5.4 Human Responsibilities

人が担当する役割は以下とする。

・課題の発見

・目的の明確化

・設計方針の決定

・要件定義

・仕様書作成

・レビュー

・品質判断

・共通化判断

・公開判断

BaseKitでは、人が最終的な設計責任を持つ。

---

# 5.5 AI Responsibilities

AIは以下を担当する。

・アイデア整理

・仕様書レビュー

・コード生成

・リファクタリング提案

・テストコード作成

・ドキュメント生成

・コードレビュー

・改善提案

AIは設計者ではなく、設計を支援するパートナーとして位置付ける。

---

# 5.6 Specification First Development

BaseKitでは、仕様書を唯一の設計基準とする。

コードが仕様書と一致しない場合は、コードではなく仕様書を基準として修正する。

仕様変更は以下の順序で行う。

1. Blueprint更新（必要な場合）
2. Architecture更新
3. Specification更新
4. 実装更新
5. テスト更新
6. ドキュメント更新

仕様書を経由しない設計変更は禁止する。

---

# 5.7 Verification Driven Development

共通化は設計者の予測ではなく、実証結果によって判断する。

新しい機能はまずPluginとして実装する。

複数の実証プロジェクトで利用され、再利用性が確認された場合のみ、Coreへの取り込みを検討する。

共通化は目的ではなく、結果である。

---

# 5.8 Rule of Three

BaseKitでは「Rule of Three」を採用する。

初回利用では共通化しない。

二回目の利用でも共通化しない。

三回以上利用され、共通化の価値が明確になった場合のみ、Coreへの統合候補とする。

この原則により、不要な抽象化やCoreの肥大化を防ぐ。

---

# 5.9 Proven Reusability Principle

BaseKitでは、再利用性は実証によって証明されるものと考える。

設計段階で「将来使うかもしれない」と判断した機能はCoreへ追加しない。

実際の利用実績を基に判断する。

この原則を「Proven Reusability Principle」と呼ぶ。

---

# 5.10 AI Review Workflow

AIレビューは以下の観点で実施する。

・仕様との整合性

・命名規則

・責務分離

・Plugin境界

・Unit分割

・イベント設計

・保守性

・テスト容易性

AIレビューの結果は、人が最終確認を行う。

---

# 5.11 Change Management

変更要求が発生した場合は、以下の優先順位で影響範囲を確認する。

1. Blueprint
2. Constitution
3. ADR
4. Architecture
5. Specification
6. SDK
7. Plugin
8. Unit

影響範囲を明確にしたうえで変更を実施する。

---

# 5.12 Continuous Improvement

BaseKitは完成を目指すプロジェクトではない。

実証プロジェクトを通じて継続的に改善し、共通化を進める。

改善は小さな単位で繰り返し実施し、大規模な設計変更は十分な検証を経て行う。

---

# 5.13 Deliverables

各プロジェクトでは、最低限以下の成果物を作成する。

* 要件定義書
* Architecture
* Specification
* ADR（必要な場合）
* 実装
* テスト
* README
* 変更履歴

これらをプロジェクト資産として管理する。

---

# 第5章まとめ

BaseKitは、設計を起点とし、AIと人が役割を分担して開発を進めることを基本とする。

仕様書を中心に設計・実装・レビューを循環させ、実証された共通機能のみをCoreへ取り込むことで、長期的に保守可能なOSS開発基盤を構築する。
