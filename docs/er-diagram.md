# ER図ドキュメント

このファイルは問い合わせ自動送信ツールの拡張要件に対応するデータベース構成のたたき台です。実装時はここを基にテーブル定義やマイグレーションを設計してください。

## テーブル構成サマリー

- `users`: アカウント・権限・同時実行枠などの管理
- `contacts`: 送信先企業情報のマスタ
- `templates`: 営業文面テンプレート、AI生成結果の保存
- `tasks`: 送信ジョブ（タブやモード単位）
- `task_targets`: ジョブ内の個別URL処理
- `ai_runs`: GPT-5呼び出し履歴
- `browser_jobs`: Playwright実行の同時枠管理
- `email_campaigns` / `email_messages` / `email_events`: 資料送付タブのメール配信・トラッキング
- `audit_logs`: 操作履歴・監査ログ

## ER図（Mermaid）

```mermaid
erDiagram
  USERS ||--o{ TASKS : "runs"
  USERS ||--o{ CONTACTS : "owns"
  USERS ||--o{ TEMPLATES : "creates"
  USERS ||--o{ EMAIL_CAMPAIGNS : "launches"

  TASKS ||--o{ TASK_TARGETS : "includes"
  TASKS ||--o{ BROWSER_JOBS : "spawn"
  TASKS ||--o{ EMAIL_CAMPAIGNS : "may link"

  TASK_TARGETS ||--o{ AI_RUNS : "invokes"
  TASK_TARGETS ||--o{ BROWSER_JOBS : "processed by"
  TASK_TARGETS }o--|| CONTACTS : "optional reference"

  EMAIL_CAMPAIGNS ||--o{ EMAIL_MESSAGES : "sends"
  EMAIL_MESSAGES ||--o{ EMAIL_EVENTS : "generates"

  USERS ||--o{ AUDIT_LOGS : "records"

  USERS {
    uuid id PK
    text email
    text password_hash
    text role
    smallint max_concurrency
    timestamptz created_at
  }

  CONTACTS {
    uuid id PK
    uuid user_id FK
    text company_name
    text default_url
    text default_contact_person
    text industry
    jsonb metadata
    timestamptz created_at
  }

  TASKS {
    uuid id PK
    uuid user_id FK
    text mode
    text status
    jsonb settings
    timestamptz started_at
    timestamptz finished_at
  }

  TASK_TARGETS {
    uuid id PK
    uuid task_id FK
    uuid contact_id FK
    text target_url
    text subject
    text message
    text status
    smallint retry_count
    text result_summary
    timestamptz last_attempt_at
  }

  AI_RUNS {
    uuid id PK
    uuid task_target_id FK
    text step
    integer prompt_tokens
    integer completion_tokens
    numeric cost_estimate
    jsonb response_json
    timestamptz created_at
  }

  BROWSER_JOBS {
    uuid id PK
    uuid task_target_id FK
    text state
    uuid runner_id
    boolean debug_mode
    text error
    timestamptz started_at
    timestamptz ended_at
  }

  EMAIL_CAMPAIGNS {
    uuid id PK
    uuid user_id FK
    uuid task_id FK
    text subject
    text reminder_strategy
    jsonb attachment_urls
    uuid smtp_profile_id
    timestamptz created_at
  }

  EMAIL_MESSAGES {
    uuid id PK
    uuid campaign_id FK
    uuid contact_id FK
    text status
    integer reminder_sent
    text tracking_token
    timestamptz sent_at
    timestamptz next_reminder_at
  }

  EMAIL_EVENTS {
    uuid id PK
    uuid email_message_id FK
    text type
    text user_agent
    text ip
    timestamptz occurred_at
  }

  TEMPLATES {
    uuid id PK
    uuid user_id FK
    text type
    text title
    text body
    jsonb metadata
    boolean is_active
    timestamptz created_at
  }

  AUDIT_LOGS {
    uuid id PK
    uuid user_id FK
    text action
    jsonb payload
    timestamptz created_at
  }
```

> 補足: `uuid`型と`jsonb`型はPostgreSQL想定です。他のRDBMSを利用する場合は適宜置き換えてください。

## 関連ドキュメント

- `docs/backend-preparation.md`: マイグレーション・認証・セキュリティ検討の初期メモ

