# 第8章 Project Principles

## BaseKit設計原則

---

# 8.1 Purpose

本章では、BaseKitを設計・開発・保守・運用する上で、すべての判断の基準となる設計原則（Project Principles）を定義する。

Architecture、Specification、Plugin、SDK、Documentationのすべては、本章で定義する原則に従う。

新しい機能や設計を採用する場合は、「実装できるか」ではなく、「本章の原則に適合するか」を最優先の判断基準とする。

---

# 8.2 Principle 1 – Minimal Core

Coreは必要最小限でなければならない。

Coreの役割は、業務機能を提供することではなく、Pluginが動作するための共通基盤を提供することである。

Coreへの新機能追加は慎重に判断し、実証プロジェクトを通じて十分な再利用性が確認されたもののみ採用する。

Coreは「大きくするもの」ではなく、「守るもの」である。

---

# 8.3 Principle 2 – Plugin First

業務ロジックはCoreへ実装しない。

すべての業務機能はPluginとして実装する。

Pluginは独立して開発・更新・配布・削除できる構造とし、Coreへの依存を最小限に抑える。

BaseKitはPluginを中心としたエコシステムを目指す。

---

# 8.4 Principle 3 – Specification First

仕様書はすべての実装より優先される。

実装は仕様書を忠実に反映するものであり、仕様書に存在しない設計を独自に追加してはならない。

設計変更が必要な場合は、最初にBlueprint、Architecture、Specificationを更新し、その後に実装を行う。

仕様書はプロジェクト全体の唯一の設計基準である。

---

# 8.5 Principle 4 – AI Native

BaseKitはAIとの共同開発を前提とする。

AIはコード生成ツールではなく、設計・実装・レビュー・改善を支援する開発パートナーである。

ArchitectureおよびSpecificationは、人だけではなくAIが理解できる構造で記述する。

---

# 8.6 Principle 5 – Unit Based Design

すべての機能は可能な限り小さな責務へ分割する。

一つのUnitは、一つの責務のみを持つ。

Unit単位で開発・レビュー・テスト・修正が行える構造を維持する。

AIによる変更も、原則としてUnit単位で実施する。

---

# 8.7 Principle 6 – Event Driven

Plugin間は直接依存しない。

機能連携はEvent Busを介して行う。

イベントを利用することで、Plugin間の結合度を下げ、保守性・拡張性・再利用性を向上させる。

---

# 8.8 Principle 7 – Proven Reusability

共通化は予測ではなく実証によって判断する。

実際の利用実績が確認された機能のみをCore候補とする。

「将来使うかもしれない」という理由だけで共通化を行ってはならない。

---

# 8.9 Principle 8 – Rule of Three

共通化は三回以上の利用実績を基準とする。

一回目は学習。

二回目は確認。

三回目で初めて共通化を検討する。

不要な抽象化を避け、Coreを長期的に保守可能な状態に保つ。

---

# 8.10 Principle 9 – Documentation as Code

ドキュメントは実装の付属資料ではない。

Blueprint、Architecture、Specification、ADR、Guideは、コードと同じ重要度を持つ開発資産である。

ドキュメントはコードと同様にレビュー・更新・バージョン管理を行う。

---

# 8.11 Principle 10 – Backward Compatibility

後方互換性を可能な限り維持する。

Coreの変更はPluginへ影響を与えないよう設計する。

互換性を失う変更を行う場合は、十分な検証と移行手順を用意する。

---

# 8.12 Principle 11 – Language Independence

BaseKitは特定のプログラミング言語に依存しない。

Blueprint、Architecture、Specificationは、Python版・JavaScript版をはじめ、他言語への展開を前提として設計する。

実装は異なっても、設計思想は共通である。

---

# 8.13 Principle 12 – Automation First

人が繰り返し行う作業は、可能な限り自動化する。

コード生成、テスト、レビュー、ドキュメント更新など、自動化可能な工程は積極的にAIおよびツールへ委譲する。

人は設計・判断・品質保証に集中する。

---

# 8.14 Principle 13 – Open by Design

BaseKitはOSSとしての発展を前提とする。

設計・仕様・Plugin開発方法は可能な限り公開し、第三者が参加しやすい環境を整備する。

プロジェクトは特定の個人ではなく、コミュニティによって継続的に成長することを目指す。

---

# 8.15 Principle 14 – Simplicity Over Complexity

複雑な設計より、理解しやすい設計を優先する。

新しい概念や仕組みを追加する前に、既存の構造で解決できないかを検討する。

シンプルさは長期保守性の基盤である。

---

# 8.16 Principle 15 – Evolution Through Verification

BaseKitは完成を目指さない。

実証プロジェクト、利用者からのフィードバック、AIレビューを通じて継続的に改善し、少しずつ成熟していく。

進化は大規模な刷新ではなく、小さな改善の積み重ねによって実現する。

---

# 8.17 Decision Checklist

新しい機能や設計を採用する前に、以下を確認する。

* Coreへ追加する必要があるか。
* Pluginで実現できないか。
* Rule of Threeを満たしているか。
* Proven Reusability Principleを満たしているか。
* Architectureと整合しているか。
* Specificationは更新されているか。
* AIが理解しやすい構造か。
* 後方互換性を維持できるか。
* Unit単位で保守できるか。
* Documentationは更新されているか。

一つでも満たさない項目がある場合は、採用を再検討する。

---

# 第8章まとめ

Project Principlesは、BaseKitにおけるすべての設計判断の基準である。

Coreを最小限に保ち、Pluginを中心とした拡張性を維持し、仕様書を軸にAIと人が協調して開発を進める。

実証によって価値が証明されたものだけを共通資産として育て、シンプルで持続可能なOSSプラットフォームを構築することが、BaseKitの基本理念である。
