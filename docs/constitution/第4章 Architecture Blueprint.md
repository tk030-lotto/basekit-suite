# 第4章 Architecture Blueprint

---

# 4.1 Architecture Vision

BaseKitのアーキテクチャは、「完成された業務システム」を構築するためのものではない。

本アーキテクチャは、多様な業務システムを構築するための共通基盤として設計されている。

そのため、本章では特定のプログラミング言語やフレームワークには依存しない抽象アーキテクチャを定義する。

Python版、JavaScript版、将来的な他言語版においても、基本構造は共通である。

---

# 4.2 Architecture Goals

BaseKit Architectureは、以下の設計目標を持つ。

## 1. Minimal Core

Coreは必要最小限に保つ。

Coreには業務ロジックを含めない。

---

## 2. Plugin First

業務機能はPluginとして追加する。

CoreはPluginの実行基盤のみを提供する。

---

## 3. AI Friendly

AIが理解しやすく、変更範囲を限定しやすい構造とする。

---

## 4. Unit Based

可能な限り小さな責務へ分割する。

---

## 5. Event Driven

機能同士は直接依存せず、イベントを介して連携する。

---

## 6. Language Independent

Python版・JavaScript版など実装言語に依存しない。

---

# 4.3 Overall Architecture

BaseKitは以下の階層構造を採用する。

```text
Applications
        │
        ▼
Plugins
        │
        ▼
Plugin SDK
        │
        ▼
Core Services
        │
        ▼
Infrastructure
```

各層は明確な責務を持ち、上位層から下位層への依存のみを許可する。

逆方向の依存は禁止する。

---

# 4.4 Core Architecture

CoreはBaseKit全体の基盤である。

Coreが提供するものは以下に限定する。

・Plugin Manager

・Authentication

・Authorization

・Configuration

・Event Bus

・Logging

・Storage Interface

・Common Utilities

Coreへ業務機能を追加してはならない。

Coreは「再利用可能な基盤」であり続ける。

---

# 4.5 Plugin Architecture

Pluginは独立したアプリケーション単位である。

Pluginは以下の特徴を持つ。

・自己完結する

・独自データを保持できる

・独自APIを持てる

・イベント購読ができる

・イベント発行ができる

Plugin同士は直接依存せず、Coreを介して連携する。

---

# 4.6 Unit Architecture

Plugin内部も可能な限りUnitへ分割する。

一つのUnitは一つの責務だけを持つ。

例

・Customer Unit

・Invoice Unit

・Stock Unit

・User Unit

AIによる修正はUnit単位で行うことを基本とする。

これにより変更範囲を限定し、安全性を向上させる。

---

# 4.7 Event Architecture

BaseKitではイベント駆動設計を基本とする。

例

User Created

↓

CRM Plugin

↓

Notification Plugin

↓

Logging Plugin

このようにイベントを介して連携する。

Plugin同士は互いの内部構造を知らない。

---

# 4.8 SDK Layer

SDKはPlugin開発者向けAPIを提供する。

SDKの役割

・Plugin作成

・Event登録

・Configuration取得

・Storage利用

・Permission確認

・Logging

PluginはSDKを通じてCoreを利用する。

---

# 4.9 AI Collaboration Layer

BaseKitではAIを設計に組み込む。

AIは

・設計

・仕様作成

・実装

・レビュー

・テスト

を担当する。

そのためArchitectureはAIが理解しやすい構造を維持する。

特に

・責務分離

・Unit化

・明確な命名

・仕様書中心

を重視する。

---

# 4.10 Architecture Principles

本アーキテクチャでは以下を設計原則とする。

・Minimal Core

・Plugin First

・Specification First

・AI Native

・Automation First

・Event Driven

・Unit Based

・Language Independent

・Proven Reusability Principle

・Rule of Three

---

# 第4章まとめ

BaseKit Architectureは、業務システムそのものを実装するためではなく、多様なシステムを効率よく構築するための共通基盤である。

Coreは最小限に保ち、業務ロジックはPluginへ委譲する。

PluginはUnit単位で構成され、イベントを介して疎結合に連携する。

本アーキテクチャはAIとの共同開発を前提とし、仕様書を中心とした長期的なOSS開発を支える基盤となる。
