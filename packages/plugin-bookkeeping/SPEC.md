# 複式簿記プラグイン要件仕様書 (SPEC.md)

本仕様書は、`@basekit/plugin-bookkeeping` における業務要件、データモデル、およびSQL操作について定義します。

---

## 1. 業務要件

### 1.1. 仕訳（取引）入力および管理
- ユーザーが複式簿記に基づく簡易仕訳（借方・貸方の1対1対応）を登録できること。
- 仕訳の入力項目は、日付、摘要（取引内容）、借方勘定科目、借方金額、貸方勘定科目、貸方金額とする。
- **整合性バリデーション**:
  - 借方金額と貸方金額が一致していること。
  - 金額は1以上の正の整数であること。
  - 勘定科目が正しく指定されていること。
- 仕訳の一覧を日付降順で表示すること。
- 登録された仕訳は論理削除（`deleted_at` への記録）が可能であること。

### 1.2. 決算書下書き出力
登録された仕訳データ（`deleted_at IS NULL`）を動的に集計し、以下の主要決算書の下書きを生成・表示すること。

#### A. 損益計算書 (P/L: Income Statement)
- **収益の部**: `売上`
- **費用の部**: `労務費`, `旅費交通費`, `通信費`, `消耗品費`, `地代家賃` など
- **当期純利益**: `収益合計 - 費用合計`

#### B. 貸借対照表 (B/S: Balance Sheet)
- **資産の部**: `現金`, `普通預金`, `売掛金`
- **負債の部**: `未払金`, `未払費用`
- **純資産の部**: `元入金`, `当期純利益` (P/Lから動的算出)
- **貸借一致関係**: `資産合計 = 負債合計 + 純資産合計` が成立するように計算・表示すること。

### 1.3. PluginBus 連携（工数仕訳自動下書き生成）
- 個人業務効率化プラグイン（`@basekit/plugin-personal-ops`）における作業ログ登録（`personal-ops:work-log-added`）イベントを購読。
- イベント発生時に、対応する労務費と未払費用（または未払金）の仕訳下書きを自動生成し、仕訳下書きテーブル（`bookkeeping_drafts`）に登録すること。
- 労務費の換算式: `金額 = (作業時間(分) / 60) * 時給単価(デフォルト 3,000円)` (四捨五入して整数値)
- 複式簿記プラグインのUI上で、蓄積された仕訳下書きを一覧表示し、ユーザーが「承認」（正規仕訳として登録）または「却下」（下書き破棄）を選択できること。

---

## 2. データベース・スキーマ設計

### 2.1. 仕訳帳テーブル (`bookkeeping_entries`)

| カラム名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | プライマリキー (UUID) |
| `entry_date` | `VARCHAR(10)` | 取引日 (YYYY-MM-DD) |
| `description` | `VARCHAR(255)` | 取引摘要 (必須) |
| `debit_account` | `VARCHAR(50)` | 借方勘定科目 (必須) |
| `debit_amount` | `INTEGER` | 借方金額 (必須) |
| `credit_account` | `VARCHAR(50)` | 貸方勘定科目 (必須) |
| `credit_amount` | `INTEGER` | 貸方金額 (必須) |
| `created_at` | `VARCHAR(50)` | 登録日時 (ISO 8601 文字列) |
| `deleted_at` | `VARCHAR(50)` | 論理削除日時 (通常は NULL) |

### 2.2. 仕訳下書きテーブル (`bookkeeping_drafts`)

| カラム名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | プライマリキー (UUID) |
| `entry_date` | `VARCHAR(10)` | 取引日 (YYYY-MM-DD) |
| `description` | `VARCHAR(255)` | 取引摘要 (必須) |
| `debit_account` | `VARCHAR(50)` | 借方勘定科目 (必須) |
| `debit_amount` | `INTEGER` | 借方金額 (必須) |
| `credit_account` | `VARCHAR(50)` | 貸方勘定科目 (必須) |
| `credit_amount` | `INTEGER` | 貸方金額 (必須) |
| `created_at` | `VARCHAR(50)` | 登録日時 (ISO 8601 文字列) |
| `deleted_at` | `VARCHAR(50)` | 論理削除日時 (通常は NULL) |

---

## 3. SQL クエリ定義

### 3.1. 正規仕訳操作
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

### 3.2. 仕訳下書き操作
- **一覧取得**:
  ```sql
  SELECT * FROM bookkeeping_drafts WHERE deleted_at IS NULL ORDER BY created_at DESC
  ```
- **新規登録**:
  ```sql
  INSERT INTO bookkeeping_drafts (id, entry_date, description, debit_account, debit_amount, credit_account, credit_amount, created_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  ```
- **物理削除 (承認/却下による消費)**:
  ```sql
  DELETE FROM bookkeeping_drafts WHERE id = $1
  ```
