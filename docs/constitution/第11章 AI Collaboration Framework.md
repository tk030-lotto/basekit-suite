# 第11章 AI Collaboration Framework

## AIとの共同開発フレームワーク

---

# 11.1 Purpose

BaseKitは、AIを補助ツールとして利用するだけではなく、開発プロセス全体にAIを組み込むことを前提としたプロジェクトである。

本章では、人とAIがそれぞれの役割を分担し、高品質なソフトウェアを継続的に開発するための基本フレームワークを定義する。

---

# 11.2 Basic Philosophy

AIは開発者を置き換える存在ではない。

AIは設計・実装・レビュー・改善を支援する共同開発パートナーである。

最終的な意思決定、設計責任、品質保証は人が担う。

---

# 11.3 Human Responsibilities

人が担当する責務は以下とする。

* ビジョンの策定
* 要件定義
* Blueprint作成
* Architecture設計
* Specification策定
* ADR作成
* 技術選定
* 品質判断
* リリース判断
* OSS運営

AIへ責任を委譲しない。

---

# 11.4 AI Responsibilities

AIは以下を支援する。

* アイデア整理
* 設計レビュー
* コード生成
* テストコード生成
* ドキュメント作成
* リファクタリング提案
* バグ調査
* コードレビュー
* 改善提案
* サンプル実装

AIは作業効率を向上させるための支援者である。

---

# 11.5 AI First, Human Final

BaseKitでは以下の原則を採用する。

AIが提案する。

↓

AIが実装する。

↓

AIがレビューする。

↓

人がレビューする。

↓

人が承認する。

品質責任は常に人が持つ。

---

# 11.6 Specification Driven AI

AIへ実装を依頼する際は、コードではなくSpecificationを渡す。

AIは以下の順番で理解する。

```text
Blueprint

↓

Architecture

↓

Specification

↓

ADR

↓

Implementation
```

コードだけを渡して実装を依頼する運用は推奨しない。

---

# 11.7 AI Context

AIへ渡すコンテキストは可能な限り小さくする。

推奨順序

* 対象Plugin
* 対象Unit
* 関連Specification
* 関連ADR
* 必要最小限のコード

不要なコードまで渡さない。

---

# 11.8 Unit Based AI Development

AIはUnit単位で開発する。

一度に巨大な修正を依頼しない。

例

* 認証Unit
* ログUnit
* Notification Unit
* Search Unit

小さな責務単位で開発を進める。

---

# 11.9 Plugin Based AI Development

AIへの依頼はPlugin単位を基本とする。

Core全体の変更ではなく、

* CRM Plugin
* Accounting Plugin
* SNS Plugin

など独立した単位で開発する。

Plugin境界を越える変更は慎重にレビューする。

---

# 11.10 Multi-AI Review

一つのAIだけに依存しない。

推奨フロー

```text
AI①

↓

AI②

↓

AI③

↓

Human Review
```

異なるAIによるレビューを行うことで、設計上の見落としを減らす。

---

# 11.11 AI Role Separation

AIごとに役割を分担することを推奨する。

例

設計支援

レビュー

コード生成

リファクタリング

ドキュメント

テスト

役割を明確にすることで品質向上を図る。

---

# 11.12 Prompt Standards

AIへの指示は曖昧にしない。

推奨事項

* 対象範囲を明示する。
* Specificationを添付する。
* 変更禁止範囲を示す。
* 出力形式を指定する。
* 完了条件を示す。

AIとの対話も設計資産の一部として管理する。

---

# 11.13 AI Review Checklist

AIレビューでは以下を確認する。

* Specificationとの一致
* Architectureとの一致
* Core境界
* Plugin境界
* Unit責務
* Event設計
* 命名規則
* テスト容易性
* 保守性
* 後方互換性

レビュー結果は記録する。

---

# 11.14 AI Failure Handling

AIは誤った提案を行う可能性がある。

以下の場合は採用しない。

* Specificationと矛盾する
* Coreを肥大化させる
* Plugin責務を壊す
* Architectureへ違反する
* ADRに反する
* 保守性を低下させる

AIの提案は必ず検証する。

---

# 11.15 AI Knowledge Accumulation

AIとの共同開発で得られた知見はDocumentationとして蓄積する。

対象

* 成功したプロンプト
* レビュー方法
* 失敗事例
* ベストプラクティス
* AI比較結果

知見を共有することで、プロジェクト全体の開発効率を向上させる。

---

# 11.16 AI Independence

BaseKitは特定のAIサービスに依存しない。

利用するAIは利用者が自由に選択できる。

新しいAIが登場しても、Blueprint・Architecture・Specificationを共通基盤として利用できる構造を維持する。

---

# 11.17 Future Vision

AIは今後さらに進化する。

BaseKitは個々のAIへ最適化するのではなく、「AIと共同開発できる設計思想」を維持する。

そのため、設計・仕様・ドキュメントを長期的な資産として育て、AIが変わっても継続利用できる開発基盤を目指す。

---

# 第11章まとめ

BaseKitでは、人とAIが明確に役割を分担し、Blueprint・Architecture・Specificationを共通言語として共同開発を行う。

AIは実装やレビューを支援する強力なパートナーである一方、最終的な設計責任と品質保証は人が担う。

このフレームワークにより、AIの進化に左右されない持続可能な開発プロセスを実現し、BaseKitをAIネイティブ時代のOSS基盤として発展させる。
