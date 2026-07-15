# プラグイン実装仕様書 (V3.0 - Suite版)

本ドキュメントは、BaseKit Core上に実装される個別機能モジュール（以下、プラグイン）の配置規格、共通インターフェース仕様、データベースアクセス規則、セキュアコーディング基準、および検証テスト基準について定義するものである。

---

## 1. ディレクトリ構造とモノレポ規格

新規プラグインを追加する際、すべてのソースコードおよび仕様書はモノレポ内の以下のディレクトリ構成に従い、独立したパッケージ（ワークスペース）として配置されなければならない。

```text
packages/plugins/[pluginId]/
├── package.json        # 個別パッケージ設定（必須。名前は @basekit/plugin-[pluginId] に統一）
├── meta.ts             # プラグインマニフェスト（必須）
├── index.tsx            # プラグイン画面のエントリーポイント
├── SPEC.md             # 個別プラグインの業務要件・仕様書
├── api/                # APIエンドポイントハンドラー（Webポータル用）
├── db/                 # DBスキーマ定義、クエリ定義（Repository/SQL）
└── components/         # プラグイン内共通UIパーツ
```

### 1.1. プラグインマニフェスト (`meta.ts`)
プラグインの基本属性を定義し、Core側へ接続情報を渡すマニフェストファイル。

```typescript
export type PluginMeta = {
  id: string;              // 英小文字・数字・ハイフンのみ。テーブル名プレフィックスに使用 (例: plugin_a)
  name: string;            // UI表示名
  route: string;           // ルーティングパス (例: '/plugins/a')
  enabled: boolean;        // 有効/無効トグルフラグ
  icon?: string;           // サイドバー用のアイコンキー
  category: 'business' | 'operation' | 'defense' | 'ai';
  requiredRole?: 'admin' | 'member';
  networkRequired?: boolean; // 外部通信が必要かどうかのフラグ
};

export const meta: PluginMeta = {
  id: 'plugin-personal-ops',
  name: '個人業務効率化ツール',
  route: '/plugins/personal-ops',
  enabled: true,
  category: 'business',
  requiredRole: 'member',
  networkRequired: false,
};
```

---

## 2. 認証・認可と認証バイパス（トグル）

本システムは個人（スタンドアロン）利用とチーム利用の双方に対応するため、プラグインは以下のルールに従って認可判定を行わなければならない。

1.  **セッション情報の取得**:
    プラグイン側は直接データベースからセッションを読み取らず、Coreが標準化して提供する `UserSessionContext` を介して認可チェックを行う。
2.  **認証バイパス時の動作**:
    環境変数 `NEXT_PUBLIC_DISABLE_AUTH=true` の場合、Coreからは自動的に管理者権限を持つ仮想セッションが返却される。プラグインは特別な処理をすることなく、通常通り機能を利用できるように設計する。
3.  **プラグイン単位のロール判定**:
    複数人利用時、ユーザーのロールは「MANAGER（該当プラグイン内での全操作が可能）」または「USER（閲覧・作成のみ可能などの制限）」として判定される。

---

## 3. データベースアクセスと統合設計

### 3.1. 物理制約の排除（論理参照）
プラグインが独自に定義するテーブルと、Coreテーブルまたは他プラグインのテーブルとの間に、物理的な外部キー（FOREIGN KEY）制約を設定しないこと。関連付けはレコード内の識別キーの論理的保持に留め、プラグイン削除時にDBレイヤーで不整合エラーが発生するのを防止する。

### 3.2. 論理削除の徹底
データを即時物理削除せず、`deleted_at` タイムスタンプを用いて論理削除とする。また、未削除データの間でのみ一意性を保証するため、部分ユニークインデックスを併用する。

### 3.3. 抽象DBインターフェースを用いたデータアクセス
プラグインは特定のDBエンジン（PostgreSQL等）に密結合するコードを直接記述せず、Coreの提供する抽象接続インターフェース（またはRepositoryクラス）を介してアクセスする。

```typescript
// プラグイン側でのRepository実装例（SQLite、PostgreSQL、ブラウザストレージの差異を吸収）
export class BookkeepingRepository {
  constructor(private dbConnection: IDatabaseConnection) {}

  async getActiveJournals(): Promise<any[]> {
    const sql = 'SELECT * FROM bookkeeping_journals WHERE deleted_at IS NULL';
    return await this.dbConnection.query(sql);
  }
}
```

---

## 4. イベント駆動通信 (PluginBus)

プラグイン間の直接結合を回避するため、プラグイン同士の直接通信・関数インポートを原則禁止し、`PluginBus` による非同期イベント通信に統一する。

```typescript
// （将来の拡張例）複式簿記プラグインが独自にイベントを発行する場合の実装イメージ。
// 現行実装では App.tsx が personal-ops:work-log-added を購読し、
// 直接 bookkeeping_drafts テーブルへ INSERT する構成を採用している。
await pluginBus.emit('bookkeeping:journal_created', journalData);
```

---

## 5. コーディング規約とセーフティ

### 5.1. タイムゾーン一貫性（JST基準）
サーバーのシステムタイムゾーンに依存する不整合を防ぐため、UTCへの変換を避け、常にローカル（JST）ベースのタイムゾーンを指定して日付処理を行う。
```typescript
const localDateStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }); // '2026-07-14'
```

### 5.2. 外部通信の完全遮断（スタンドアロン版の必須ルール）
社用PCでの利用を前提としたスタンドアロン版（およびそれにマウントされるプラグイン）では、セキュリティポリシー抵触を防ぐため、外部通信（非許可の絶対URLや外部通信ライブラリの利用）を一切禁止する。
*   ビルド前に `check-no-network.js` スクリプトによる静的解析スキャンをパスしなければならない。
*   AI機能を利用する場合は、必ずCoreの中継するAI Providerを経由し、APIキーをハードコードしてはならない。

---

## 6. 検証テスト・適合基準

新規プラグインのCore接続適合テスト項目を以下に示す。

| 検証項目 | 確認内容 | 判定基準 |
| :--- | :--- | :--- |
| **ライセンスゲート検証** | Cookieがない状態でプラグイン画面/APIに直接リクエストを送信する。 | 画面は `/login` へリダイレクト、APIは `403` を返却すること。 |
| **二重送信防止検証** | 同一の `Idempotency-Key` ヘッダを使用してAPIリクエストを2回連続で送信する。 | 2回目のリクエストでは処理は実行されず、1回目のレスポンスキャッシュが返却されること。 |
| **自動操作ログ整合性** | プラグイン内のテーブルに変更をかける。 | `audit_logs` テーブルに変更前と変更後のデータが自動格納されていること。 |
| **外部通信完全遮断** | 外部スキャンスクリプトを実行する。 | 無許可の外部通信コードが検出されず、ビルドが成功すること。 |
