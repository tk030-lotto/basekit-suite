# 業務用SNSプラグイン要件仕様書 (SPEC.md)

本仕様書は、`@basekit/plugin-sns` における業務要件、データモデル、およびSQL操作について定義します。

---

## 1. 業務要件

### 1.1. スレッド（トピック）管理
*   ユーザーが新しいディスカッショントピック（スレッド）を作成できること。
*   スレッドの一覧を表示し、最終更新日時などで並び替えができること。
*   削除されたスレッドは `deleted_at` に削除時刻を記録する論理削除とし、一覧には表示しない。

### 1.2. チャット（メッセージ投稿）機能
*   特定のスレッドを選択した際、そのスレッドに属するメッセージの履歴をタイムライン形式で表示できること。
*   ユーザーが新しいメッセージを投稿できること（投稿内容、投稿者名、送信日時）。
*   投稿内容は最大2000文字のバリデーションを設けること。
*   削除されたメッセージは `deleted_at` に削除時刻を記録する論理削除とする。

### 1.3. PluginBus 連携（アクティビティ自動フィード）
*   他プラグイン（例: 個人業務効率化）で発生する業務イベントを `PluginBus` 経由で受信し、「📢 システム通知・アクティビティフィード」スレッドへ自動的にメッセージを投稿・記録すること。
*   自動投稿される発言の送信者は「システム」とする。

---

## 2. データベース・スキーマ設計

本プラグインは論理削除（`deleted_at`）に対応し、外部制約を物理的に持たない設計とします。

### 2.1. スレッドテーブル (`sns_threads`)

| カラム名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | プライマリキー (UUID) |
| `title` | `VARCHAR(255)` | スレッドタイトル (必須) |
| `created_by` | `VARCHAR(50)` | 作成者名 (必須) |
| `created_at` | `VARCHAR(50)` | 作成日時 (ISO 8601 文字列) |
| `updated_at` | `VARCHAR(50)` | 更新日時 (ISO 8601 文字列) |
| `deleted_at` | `VARCHAR(50)` | 論理削除日時 (通常は NULL) |

### 2.2. メッセージテーブル (`sns_messages`)

| カラム名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | プライマリキー (UUID) |
| `thread_id` | `VARCHAR(36)` | 対象スレッドのID（論理参照） |
| `content` | `TEXT` | 投稿本文 (必須) |
| `sender` | `VARCHAR(50)` | 投稿者名 (必須) |
| `created_at` | `VARCHAR(50)` | 投稿日時 (ISO 8601 文字列) |
| `deleted_at` | `VARCHAR(50)` | 論理削除日時 (通常は NULL) |

---

## 3. SQL クエリ定義

### 3.1. スレッド操作
*   **一覧取得**:
    ```sql
    SELECT * FROM sns_threads WHERE deleted_at IS NULL ORDER BY created_at DESC
    ```
*   **新規登録**:
    ```sql
    INSERT INTO sns_threads (id, title, created_by, created_at, updated_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6)
    ```
*   **更新**:
    ```sql
    UPDATE sns_threads SET title = $1, updated_at = $2 WHERE id = $3
    ```
*   **論理削除**:
    ```sql
    UPDATE sns_threads SET deleted_at = $1 WHERE id = $2
    ```

### 3.2. メッセージ操作
*   **特定スレッド의 メッセージ取得**:
    ```sql
    SELECT * FROM sns_messages WHERE thread_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC
    ```
*   **新規登録**:
    ```sql
    INSERT INTO sns_messages (id, thread_id, content, sender, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6)
    ```
*   **論理削除**:
    ```sql
    UPDATE sns_messages SET deleted_at = $1 WHERE id = $2
    ```
