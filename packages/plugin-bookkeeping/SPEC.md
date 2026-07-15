# 複式簿記プラグイン要件仕様書 (SPEC.md)

本仕様書は、`@basekit/plugin-bookkeeping` における業務要件、データモデル、およびSQL操作について定義します。

---

## 1. 業務要件

### 1.1. 勘定科目の管理と家事按分比率
- ユーザーは任意の勘定科目（資産・負債・純資産・収益・費用）を登録・管理できること。
- 各勘定科目には、名前、科目分類、および **「事業比率 (家事按分%)」** を保持すること。
- 初回起動時、副業・個人事業主向けの標準勘定科目約40件を自動シードデータとして投入すること。
- ユーザーは各勘定科目の事業比率を 0% 〜 100% の範囲で編集・保存できること。

### 1.2. 仕訳（取引）入力および管理
- ユーザーが複式簿記に基づく簡易仕訳（借方・貸方の1対1対応）を登録できること。
- 仕訳の入力項目は、日付、摘要（取引内容）、借方勘定科目、借方金額、貸方勘定科目、貸方金額とする。
- 借方・貸方の勘定科目は、登録済みの勘定科目（`bookkeeping_accounts`）から選択する。
- **整合性バリデーション**:
  - 借方金額と貸方金額が一致していること。
  - 金額は1以上の正の整数であること。
- 仕訳の一覧を日付降順で表示すること。
- 登録された仕訳は論理削除（`deleted_at` への記録）が可能であること。

### 1.3. 決算書下書き出力
登録された仕訳データを動的に集計し、以下の主要決算書の下書きを生成・表示すること。

#### A. 損益計算書 (P/L: Income Statement)
- **収益の部**: `売上`などの収益科目を集計。
- **費用の部**: 各費用科目の金額に対し、それぞれの科目で設定された「事業比率」を掛け合わせた額（事業経費）を集計。
- **当期純利益**: `収益合計 - 事業経費合計`

#### B. 貸借対照表 (B/S: Balance Sheet)
- **資産の部**: `現金`, `普通預金`, `売掛金` 等の資産科目を集計。さらに、家事按分により経費から除外されたプライベート使用分（`金額 * (100 - 事業比率) / 100`）を **`事業主貸`** 勘定として動的に加算集計する。
- **負債の部**: `未払金`, `未払費用` などの負債科目を集計。
- **純資産の部**: `元入金` に加え、P/Lから算出した `当期純利益` を加算。
- **貸借一致関係**: `資産合計 = 負債合計 + 純資産合計` が成立すること。

### 1.4. PluginBus 連携（工数仕訳自動下書き生成）
- 個人業務効率化プラグインからの `personal-ops:work-log-added` イベント購読時、労務費と未払費用の仕訳下書きを自動生成。
- 労務費の換算式: `金額 = (作業時間(分) / 60) * 時給単価(デフォルト 3,000円)` (四捨五入して整数値)
- 複式簿記プラグインのUI上で下書きを一覧表示し、承認（正規仕訳へ登録 ＆ 下書き削除）または却下（下書き削除）できること。

---

## 2. データベース・スキーマ設計

### 2.1. 勘定科目テーブル (`bookkeeping_accounts`)

| カラム名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | プライマリキー (UUID) |
| `name` | `VARCHAR(50)` | 勘定科目名 (必須、ユニーク) |
| `type` | `VARCHAR(10)` | 科目分類 (`資産` \| `負債` \| `純資産` \| `収益` \| `費用`) |
| `business_ratio` | `INTEGER` | 事業比率 (0〜100、デフォルト 100) |
| `created_at` | `VARCHAR(50)` | 登録日時 (ISO 8601 文字列) |
| `deleted_at` | `VARCHAR(50)` | 論理削除日時 (通常は NULL) |

### 2.2. 仕訳帳テーブル (`bookkeeping_entries`)

| カラム名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | プライマリキー (UUID) |
| `entry_date` | `VARCHAR(10)` | 取引日 (YYYY-MM-DD) |
| `description` | `VARCHAR(255)` | 取引摘要 (必須) |
| `debit_account` | `VARCHAR(50)` | 借方勘定科目名 (必須) |
| `debit_amount` | `INTEGER` | 借方金額 (必須) |
| `credit_account` | `VARCHAR(50)` | 貸方勘定科目名 (必須) |
| `credit_amount` | `INTEGER` | 貸方金額 (必須) |
| `created_at` | `VARCHAR(50)` | 登録日時 (ISO 8601 文字列) |
| `deleted_at` | `VARCHAR(50)` | 論理削除日時 (通常は NULL) |

### 2.3. 仕訳下書きテーブル (`bookkeeping_drafts`)

| カラム名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | プライマリキー (UUID) |
| `entry_date` | `VARCHAR(10)` | 取引日 (YYYY-MM-DD) |
| `description` | `VARCHAR(255)` | 取引摘要 (必須) |
| `debit_account` | `VARCHAR(50)` | 借方勘定科目名 (必須) |
| `debit_amount` | `INTEGER` | 借方金額 (必須) |
| `credit_account` | `VARCHAR(50)` | 貸方勘定科目名 (必須) |
| `credit_amount` | `INTEGER` | 貸方金額 (必須) |
| `created_at` | `VARCHAR(50)` | 登録日時 (ISO 8601 文字列) |
| `deleted_at` | `VARCHAR(50)` | 論理削除日時 (通常は NULL) |

---

## 3. SQL クエリ定義

### 3.1. 勘定科目操作
- **一覧取得**:
  ```sql
  SELECT * FROM bookkeeping_accounts WHERE deleted_at IS NULL ORDER BY type ASC, name ASC
  ```
- **新規登録**:
  ```sql
  INSERT INTO bookkeeping_accounts (id, name, type, business_ratio, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6)
  ```
- **比率更新**:
  ```sql
  UPDATE bookkeeping_accounts SET business_ratio = $1 WHERE id = $2
  ```

### 3.2. 仕訳帳操作
- **一覧取得**:
  ```sql
  SELECT * FROM bookkeeping_entries WHERE deleted_at IS NULL ORDER BY entry_date DESC, created_at DESC
  ```
- **新規登録**:
  ```sql
  INSERT INTO bookkeeping_entries (id, entry_date, description, debit_account, debit_amount, credit_account, credit_amount, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  ```
- **論理削除**:
  ```sql
  UPDATE bookkeeping_entries SET deleted_at = $1 WHERE id = $2
  ```

### 3.3. 仕訳下書き操作
- **一覧取得**:
  ```sql
  SELECT * FROM bookkeeping_drafts WHERE deleted_at IS NULL ORDER BY created_at DESC
  ```
- **新規登録**:
  ```sql
  INSERT INTO bookkeeping_drafts (id, entry_date, description, debit_account, debit_amount, credit_account, credit_amount, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  ```
- **物理削除**:
  ```sql
  DELETE FROM bookkeeping_drafts WHERE id = $1
  ```
