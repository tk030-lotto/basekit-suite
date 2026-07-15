# 個人業務効率化プラグイン要件仕様書 (SPEC.md)

本仕様書は、`@basekit/plugin-personal-ops` における業務要件、データモデル、およびSQL操作について定義します。

---

## 1. 業務要件

### 1.1. タスク管理
*   個人用のTODOタスクを登録・編集・削除・一覧表示できること。
*   タスクは `TODO`（未着手）、`IN_PROGRESS`（進行中）、`DONE`（完了）の3状態を持ち、簡単に切り替えられること。
*   優先度（`LOW`、`MEDIUM`、`HIGH`）を設定し、それに基づき並べ替えや色分けバッジ表示ができること。
*   タスクカードには **締切日 (`due_date`)** および **Gmail等の関連メールURL (`mail_url`)** を保持し、ワンクリックでメールへワープ（別タブで開く）できること。
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

### 1.3. 売上管理
*   案件名、金額（円）、発生日（日付）を入力して、個人ビジネスの売上実績を登録・管理できること。
*   今月度の総売上を集計し、目標売上（初期値: 100,000円）に対する進捗率プログレスバーを表示すること。
*   売上実績は一覧で履歴表示し、個別に論理削除（`deleted_at` 記録）できること。

### 1.4. 月間カレンダー
*   当月・前月・次月を含む対話的なカレンダーグリッドを表示すること。
*   各日付セルには、その日が締切となっているタスクの件数バッジを重ねて表示すること。
*   日付をクリックすると、その日を選択状態にし、「日報作成」タブの対象日と連動すること。

### 1.5. ハイブリッド日報出力
*   指定日について、`audit_logs`（システム全体の操作変更履歴）、完了したタスク、進行中のタスク、本日の工数記録、本日の売上実績をアトミックに検索・集計。
*   時刻順の操作タイムラインと業務サマリーから構成される Markdown 形式の日報を自動生成すること。
*   ワンクリックでのクリップボードコピー、および Markdown ファイル（`daily-report-YYYY-MM-DD.md`）のローカルダウンロード保存に対応すること。

### 1.6. データバックアップ ＆ 復旧
*   コックピット内のすべてのデータベースデータ（タスク、工数ログ、売上）を1ファイルにシリアライズしたJSONバックアップファイルをエクスポートできること。
*   JSONファイルを読み込むことでデータを復旧可能とし、以下の2つの取り込み方法から選べること：
    *   **上書き復元**: 現在のデータをすべて削除し、バックアップファイルの内容で完全に置き換える。
    *   **マージ追加**: 現在のデータを保持し、バックアップファイルから新しいデータのみを追加する。
*   データ損失を防ぐため、最終バックアップ（エクスポート）から7日以上が経過している場合、目立つ警告バナーを表示すること。

---

## 2. データベース・スキーマ設計

### 2.1. タスクテーブル (`personal_tasks`)

| カラム名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | プライマリキー (UUID) |
| `title` | `VARCHAR(255)` | タスクタイトル (必須) |
| `description` | `TEXT` | タスク詳細内容（メモ） |
| `status` | `VARCHAR(50)` | ステータス (`TODO`, `IN_PROGRESS`, `DONE`) |
| `priority` | `VARCHAR(50)` | 優先度 (`LOW`, `MEDIUM`, `HIGH`) |
| `due_date` | `VARCHAR(10)` | 締切日 (YYYY-MM-DD, 任意) |
| `mail_url` | `VARCHAR(255)` | メール等参照URL (任意) |
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

### 2.3. 売上テーブル (`personal_revenues`)

| カラム名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | プライマリキー (UUID) |
| `project` | `VARCHAR(255)` | 案件名 (必須) |
| `amount` | `INTEGER` | 売上金額 (必須) |
| `accrued_date` | `VARCHAR(10)` | 売上発生日 (`YYYY-MM-DD`) |
| `created_at` | `VARCHAR(50)` | 登録日時 (ISO 8601 文字列) |
| `deleted_at` | `VARCHAR(50)` | 論理削除日時 (通常は NULL) |

---

## 3. SQL クエリ定義

### 3.1. タスク操作
*   **一覧取得**:
    ```sql
    SELECT * FROM personal_tasks WHERE deleted_at IS NULL ORDER BY created_at DESC
    ```
*   **新規登録**:
    ```sql
    INSERT INTO personal_tasks (id, title, description, status, priority, due_date, mail_url, created_at, updated_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ```
*   **更新**:
    ```sql
    UPDATE personal_tasks SET title = $1, description = $2, status = $3, priority = $4, due_date = $5, mail_url = $6, updated_at = $7 WHERE id = $8
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

### 3.3. 売上操作
*   **一覧取得**:
    ```sql
    SELECT * FROM personal_revenues WHERE deleted_at IS NULL ORDER BY accrued_date DESC, created_at DESC
    ```
*   **新規登録**:
    ```sql
    INSERT INTO personal_revenues (id, project, amount, accrued_date, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6)
    ```
*   **論理削除**:
    ```sql
    UPDATE personal_revenues SET deleted_at = $1 WHERE id = $2
    ```
