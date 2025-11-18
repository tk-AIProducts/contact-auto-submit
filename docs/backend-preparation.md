# バックエンド実装準備メモ

このメモは `docs/er-diagram.md` のテーブル構成案を実装へ落とし込む際に確認すべきポイントをまとめたものです。DBマイグレーション、認証、セキュリティ設計の初期ガイドとして利用してください。

## データモデル整合メモ

- 使用予定DB: PostgreSQL（`uuid`, `jsonb`, `timestamptz` などを想定）
- マイグレーションツール候補: Prisma Migrate / Drizzle / Kysely 等。いずれの場合も以下の順で整備する
  1. `users`, `tasks`, `task_targets` を最優先で実装（コアとなるジョブ管理）
  2. `ai_runs`, `browser_jobs`, `email_campaigns` を段階的に追加し、外部キー制約を張る
  3. 監査テーブル (`audit_logs`) はトリガーベースかアプリ層からの挿入かを決定
- `tasks.settings`, `templates.metadata` などの `jsonb` はスキーマレスなため、TypeScript側で型定義を行いバリデーションを徹底する
- `browser_jobs` による同時実行枠制御は、`state` + `runner_id` をユニーク制約にすることで取りこぼしを減らす
- `email_events` は外部サービス（SendGrid, AWS SES 等）のWebhook payloadをそのまま保存できるよう `payload` カラム（`jsonb`）を追加検討

## 認証・権限設計の初期方針

- 認証方式は以下から選定
  - メール + パスワード（`users.password_hash`）+ セッションテーブル
  - または外部IdP (Auth0, Clerk など) を利用し、`users` にはIdPのIDを保存
- 権限ロール (`users.role`) は少なくとも `owner`, `member`, `viewer` の3階層を想定
- 同時実行ブラウザ枠は `users.max_concurrency` を用い、実行前に `browser_jobs` をチェックしながら割り当て
- APIアクセスは Next.js Route Handlers でJWT / セッションを検証し、`tasks.user_id` と照合して他ユーザーのジョブにアクセスできないようにする

## セキュリティ検討事項

- 秘密情報（OpenAI APIキー、SMTP認証情報、Playwright起動オプションなど）は `.env` で管理し、デプロイ先のSecret機能で暗号化
- OpenAI関連では少なくとも `OPENAI_API_KEY`（必要に応じて `OPENAI_API_URL`, `OPENAI_SALES_MODEL`）を設定し、開発/本番で適切に切り替える
- Playwright実行サーバーは外部公開せず、Next.jsアプリからの内部API経由でジョブを登録する構成を検討
- CAPTCHA突破の自動化は行わない方針を明示し、遭遇時はUIで手動対応を促す
- メールトラッキング用のリダイレクトURLは署名付きトークンで検証し、不正アクセスで開封数が増えないようにする
- 監査ログ (`audit_logs`) にはリモートIP・UserAgent・操作種別を最低限記録し、削除不能にする（論理削除で歴史を保持）
- AI生成文面は誤送信防止のため、一度ユーザーが確認・修正しない限り送信しないUIフローとする

## 次のアクション

- マイグレーションツールの選定と初期スキーマ作成
- 認証ソリューションの評価（SaaSか自前か）
- Playwright実行環境（Dockerベース or PaaS）の候補比較
- メール送信基盤（SES, SendGrid, Resend など）の比較とトラッキング実装調査


