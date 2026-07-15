# BaseKit Core 定義設計書 (V3.0 - Suite版)

本ドキュメントは、プラグイン型業務システムにおける共通基盤（以下、BaseKit Core）の機能、システム境界、アーキテクチャ構成、データベースおよび認証の抽象化設計、ならびにライセンス条項について定義するものである。

---

## 1. 開発目的と対象スコープ

### 1.1. 開発の背景と目的
個人開発者、フリーランス、および中小規模の開発会社が、個人事業主や中小企業から業務システム開発の依頼を受けた際、限られた開発期間とリソースの中で、安全かつ保守性の高いシステムを効率的に構築・提供することを目的とする。

認証、データベース接続、ログ管理といった共通機能の実装重複を排除し、受託開発における品質の安定化と開発コストの低減を実現する。

### 1.2. システムの設計方針と境界
本フレームワークは「薄い共通コア（Core）」と「着脱可能な機能モジュール（プラグイン）」によって構成される。Coreは特定の業態や個別のビジネスルールに依存する業務ロジックを持たず、システム全体の安全性・データ永続性・通信制御を担保するためのインフラストラクチャとしての役割に専念する。

```mermaid
graph TD
    subgraph Core (ベースキット・共通インフラ層)
        UI["共通UI・動的ルーティング"]
        Auth["抽象化認証・認可・免責ゲート"]
        DB["抽象化DB管理・自動監査ログ"]
        API["APIゲートウェイ・冪等性検証"]
        Bus["PluginBus (非同期イベントバス)"]
        AI["AI Provider (共通LLM接続)"]
    end

    subgraph Plugins (業務ロジック層)
        P1["個人業務効率化プラグイン"]
        P2["複式簿記プラグイン"]
        P3["業務用SNSプラグイン"]
    end

    UI --> P1
    API --> P1
    Bus <--> P1
    Bus <--> P2
    Bus <--> P3
```

### 1.3. 設計原則
1.  **業務ロジックの排除**: Coreには特定の帳票定義、計算ロジック、ワークフローなどの個別業務ロジックを含めない。これらはすべてプラグインの境界内に隔離する。
2.  **依存方向の一方向性**: プラグインはCoreが提供するAPIやコンポーネントに依存できるが、Coreは特定のプラグインの存在に依存してはならない。
3.  **障害の局所化**: プラグイン内部で発生した実行時例外や処理遅延が、Coreまたは他のプラグインの動作を停止させない設計を維持する。

### 1.4. 拡張性（コンポーザビリティ）設計原則
*   **動的マウント制御**: Coreはプラグインの具体的なコードを静的にビルドせず、マニフェスト（`meta.ts`）に基づいてルーティングとサイドバーを動的生成する。これにより、コードの変更なしにモジュールの追加・削除（トグル）を可能とする。
*   **インターフェースによる結合**: Coreとプラグイン間の機能接続、およびプラグイン同士のデータ連携は、抽象インターフェースとメッセージイベント（PluginBus）のみを経由する。

---

## 2. 7つの共通機能の論理定義

### 2.1. 共通UIレイアウトとルーティング
システム全体の整合性を保つための「外枠」UIを提供する。
*   共通のヘッダー、ナビゲーションサイドバー、通知領域のレンダリング。
*   動的ルーティング (`/plugins/[pluginId]`) を介した、プラグイン画面の動的マウント制御。

### 2.2. データベースアクセス基盤
すべてのモジュールで安全にデータを読み書きするための接続管理、および複数データベースエンジンへの抽象アクセスを提供する。
*   接続プーリング管理、各種DBエンジン（外部RDB、ローカルRDB、ブラウザストレージ等）へのアクセス仲介。
*   プラグインが独自に定義するテーブル群とCoreテーブル群の接続・実行の抽象化。

### 2.3. プラグイン接続および動的マウント
プラグインマニフェスト（`meta.ts`）をロードし、システム内へ機能を動的にマウントする。
*   プラグインの有効化/無効化のステータス管理。
*   ユーザー権限（ロール）に基づいたナビゲーションメニューの表示/非表示制御。

### 2.4. イベント中継器 (PluginBus)
プラグイン間で相互にメッセージやデータを伝達するための非同期イベント中継器を提供する。
*   送信側プラグインは受信側プラグインの具体的な実装を知る必要がない（出版-購読型モデル）。
*   `Promise.allSettled` による並列実行により、特定リスナーの失敗が他へ影響を与えない構造とする。

### 2.5. ユーザー認証およびアクセス制御 (Auth & Roles)
セキュアなシステムアクセスのための基本インフラを提供する。また、個人利用・スタンドアロン時の簡便さのために、環境変数による認証バイパス機能をサポートする。

### 2.6. 法的・技術的自己防衛ゲート (免責ゲート & 自動監査ログ)
システム運用に伴う賠償リスクや操作ミスによるデータ不整合を、システム的に防ぐための防御策。
*   **免責ライセンスゲート**: 起動時または未同意ユーザーに対して利用規約・承諾書への同意を強制し、同意Cookieがないすべてのアクセス（画面・API）をMiddleware層で一括遮断する。
*   **自動監査ログ機能**: データベースのレイヤーにおいて、データ変更（INSERT, UPDATE, DELETE等）の履歴を強制的に記録する。

### 2.7. 共通AI Provider
プラグインからLLMを呼び出すためのAPI中継器。APIキーなどの認証情報をCoreサーバーサイドで一括管理し、プラグイン側にはキーを露出させない。

---

## 3. 0円運用の原則（コスト防衛設計）

本システムは、制作者および利用者の金銭的コスト負担を「完全ゼロ」にすることを基本原則とする。

1.  **外部有料APIの徹底排除**:
    *   OpenAIなどの従量課金APIの利用を前提としない。
    *   AI連携を行う場合は、無料枠（Free Tier）が提供されている Google Gemini API（利用者が自分で取得したキーを割り当てる）や、PCローカルで動く無料のLLMサーバー（Ollamaなど）への接続をサポートする。
2.  **無料インフラの適合**:
    *   クラウドDBを使用する場合は、無料枠が提供されている Supabase や Neon 等のみを利用し、制限容量（例：500MB）を超えないよう無駄なログの定期クリーンアップを徹底する。
3.  **クライアントサイド完結ライブラリの採用**:
    *   PDF生成、CSVエクスポートなどの機能は、外部の有料Web APIを一切使用せず、ブラウザ（JavaScript）のみで完結するライブラリ（`jsPDF`等）を採用する。

---

## 4. 将来の拡張性を担保する3大インターフェース

将来的な機能差し替えや拡張に対応するため、Coreは以下の3つのインターフェースを抽象化して提供する。

### 4.1. AI Provider の抽象化 (`ILLMProvider`)
プラグインは特定のLLM SDK（OpenAI等）を直接呼ばず、Coreの共通インターフェースを経由してプロンプトを送受信する。
```typescript
export interface ILLMProvider {
  generateText(prompt: string, options?: any): Promise<string>;
  generateJSON<T>(prompt: string, schema: any): Promise<T>;
}
```
これにより、環境変数や設定の変更だけで、裏側のAIを「Gemini (無料枠)」「Ollama (ローカル無料)」「OpenAI (有料)」等に瞬時に切り替え可能とする。

### 4.2. データ入出力の抽象化 (`IDataExporter` / `IDataImporter`)
プラグインは自らCSVやPDFのフォーマットロジックを持たず、データをCoreの抽象インターフェースへ引き渡す。
```typescript
export interface IDataExporter {
  exportCSV<T>(data: T[], columns: string[], filename: string): Promise<void>;
  exportPDF(htmlElementId: string, filename: string): Promise<void>;
}
```
これにより、将来的に「PDF帳票のレイアウト追加」や「特定の会計ソフト用フォーマットでの出力」が必要になった際、Coreまたはコンバーターの差し替えのみで対応できるようにする。

### 4.3. 通知機能の抽象化 (`INotificationProvider`)
システム内で発生したイベント（仕訳作成、タスク期限など）をユーザーに通知するための共通インターフェース。
```typescript
export interface INotificationProvider {
  send(title: string, body: string, recipient?: string): Promise<void>;
}
```
初期状態では「画面内通知トレイ」のみに送信するが、将来的に「Eメール」「LINE通知」「Slack通知」などの外部プラグインを容易に組み込めるようにする。

---

## 5. マルチデータベース（各種・複数対応）抽象化設計

本システムは、ポータル（Web版）とスタンドアロン版の切り替えに対応するため、接続先データベースを完全に隠蔽する。

```typescript
export interface IDatabaseConnection {
  query<T = any>(sql: string, params?: any[]): Promise<T>;
  execute(sql: string, params?: any[]): Promise<void>;
  close(): Promise<void>;
}

export interface IDatabaseManager {
  getConnection(dbId?: string): Promise<IDatabaseConnection>;
  registerConnection(dbId: string, connection: IDatabaseConnection): void;
}
```

*   **通常Web版**: `IDatabaseConnection` は PostgreSQL 接続（Prisma/pgプール）となる。
*   **スタンドアロン版**: `IDatabaseConnection` はブラウザの `localStorage` または `IndexedDB`（およびローカルの SQLite）への読み書きを行うローカルドライバーとなる。

---

## 6. 認証プロバイダ抽象化設計 ＆ 認証トグル

### 6.1. 認証トグル設計
個人利用（スタンドアロンや本業の社用PCでの自分専用ツール）における利便性を最大化するため、ログイン画面をスキップできる機能を設ける。

*   環境変数 `NEXT_PUBLIC_DISABLE_AUTH=true` の場合:
    *   ログイン画面（認証ゲート）は自動的にバイパスされる。
    *   システムは常に、最高管理者（ADMIN）としてのモックセッション（`UserSessionContext`）を自動的に返却する。
*   環境変数 `NEXT_PUBLIC_DISABLE_AUTH=false` の場合:
    *   ID/パスワードによるセキュアなログイン認証を実行する（複数人利用時）。

### 6.2. 認証プロバイダインターフェース (`IAuthProvider`)
```typescript
export interface UserSessionContext {
  userId: string;
  email: string;
  isSystemAdmin: boolean;
  pluginRoles: Record<string, 'MANAGER' | 'USER' | 'NONE'>;
  expiresAt: Date | null;
}

export interface IAuthProvider {
  validateCredentials(credentials: any): Promise<UserSessionContext>;
  verifyPluginAccess(context: UserSessionContext, pluginId: string): boolean;
}
```

---

## 7. ライセンスおよび免責条項 (MIT License)

本フレームワークは、オープンソースソフトウェア（MITライセンス）として公開・提供される。

```text
Copyright (c) 2026 BaseKit Project Authors
... (MIT License 条項)
```
