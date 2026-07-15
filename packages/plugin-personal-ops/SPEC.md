# 個人業務効率化プラグイン要件仕様書 (SPEC.md)

本仕様書は、`@basekit/plugin-personal-ops` における業務要件、データモデル、およびSQL操作について定義します。

---

## 1. 業務要件

### 1.1. タスク管理
*   個人用のTODOタスクを登録・編集・削除・一覧表示できること。
*   タスクは `TODO`（未着手）、`IN_PROGRESS`（進行中）、`DONE`（完了）の3状態を持ち、簡単に切り替えられること。
*   優先度（`LOW`、`MEDIUM`、`HIGH`）を設定し、それに基づき並べ替えや色分けバッジ表示ができること。
*   削除されたタスクは `deleted_at` に削除時刻を記録する論理削除とし、画面からは非表示とする。

### 1.2. 工数（作業時間）記録
*   **タイマー計測**:
    *   特定のタスクを選択し、リアルタイムで作業時間の計測（開始/一時停止/保存）ができること。
    *   秒単位で進むタイマーインジケーターを画面に表示し、計測中は脈動するパルスアニメーションで視覚的に示す。
    *   計測中にページをリロードしたり、他のタブに移動したりしても、計測データが失われずに再開・継続できること（`localStorage` キャッシュとの連携）。
*   **手動入力**:
    *   タイマーでの自動記録以外に、過去の作業実績を手動（日付、所要時間(分)、メモ）で入力できること。
*   **実績分析**:
    *   タスクごとに積算された合計作業時間(分)を表示し、全体の工数配分の可視化バーを表示すること。

---

## 2. データベース・スキーマ設計

本プラグインは論理削除（`deleted_at`）に対応し、外部制約を物理的に持たない設計とします。

### 2.1. タスクテーブル (`personal_tasks`)

| カラム名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | プライマリキー (UUID) |
| `title` | `VARCHAR(255)` | タスクタイトル (必須) |
| `description` | `TEXT` | タスク詳細内容 |
| `status` | `VARCHAR(50)` | ステータス (`TODO`, `IN_PROGRESS`, `DONE`) |
| `priority` | `VARCHAR(50)` | 優先度 (`LOW`, `MEDIUM`, `HIGH`) |
| `created_at` | `VARCHAR(50)` | 作成日時 (ISO 8601 文字列) |
| `updated_at` | `VARCHAR(50)` | 更新日時 (ISO 8601 文字列) |
| `deleted_at` | `VARCHAR(50)` | 論理削除日時 (通常は NULL) |

### 2.2. 作業ログテーブル (`personal_work_logs`)

| カラム名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | プライマリキー (UUID) |
| `task_id` | `VARCHAR(36)` | 対象タスクのID（論理参照） |
| `duration_minutes`| `INTEGER` | 所要時間（分） |
| `memo` | `TEXT` | 作業メモ |
| `work_date` | `VARCHAR(10)` | 作業日 (`YYYY-MM-DD`) |
| `created_at` | `VARCHAR(50)` | 記録日時 (ISO 8601 文字列) |
| `deleted_at` | `VARCHAR(50)` | 論理削除日時 (通常は NULL) |

---

## 3. SQL クエリ定義

プラグインは `IDatabaseConnection` 経由で以下のSQLを発行します。

### 3.1. タスク操作
*   **一覧取得**:
    ```sql
    SELECT * FROM personal_tasks WHERE deleted_at IS NULL ORDER BY created_at DESC
    ```
*   **新規登録**:
    ```sql
    INSERT INTO personal_tasks (id, title, description, status, priority, created_at, updated_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ```
*   **更新**:
    ```sql
    UPDATE personal_tasks SET title = $1, description = $2, status = $3, priority = $4, updated_at = $5 WHERE id = $6
    ```
*   **論理削除**:
    ```sql
    UPDATE personal_tasks SET deleted_at = $1 WHERE id = $2
    ```

### 3.2. 作業ログ操作
*   **一覧取得**:
    ```sql
    SELECT * FROM personal_work_logs WHERE deleted_at IS NULL ORDER BY created_at DESC
    ```
*   **新規登録**:
    ```sql
    INSERT INTO personal_work_logs (id, task_id, duration_minutes, memo, work_date, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7)
    ```
*   **論理削除**:
    ```sql
    UPDATE personal_work_logs SET deleted_at = $1 WHERE id = $2
    ```
