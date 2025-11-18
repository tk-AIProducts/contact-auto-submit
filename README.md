# 問い合わせ自動送信ツール

Webサイトのお問い合わせフォームを自動的に見つけて、フォームに入力・送信するためのNext.jsアプリケーションです。

## 機能

- 🌐 指定したWebサイトに自動アクセス
- 🔍 お問い合わせページを自動検出（「お問い合わせ」「Contact」などのリンクを検索）
- 📝 フォームフィールドを自動識別して入力
  - 会社名、担当者名、お名前、メールアドレス、電話番号、件名、本文
- 🚀 フォームの自動送信
- 📊 実行ログのリアルタイム表示
- 🐛 デバッグモード（ブラウザを表示して動作確認可能）

## 技術スタック

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Playwright** (ブラウザ自動操作)
- **Tailwind CSS**

## セットアップ

### 必要な環境

- Node.js 18以上
- yarn または npm
- OpenAI APIキー（GPT-5系モデルが利用可能なプラン）

### インストール

```bash
# 依存関係のインストール
yarn install
# または
npm install

# Playwrightブラウザのインストール
npx playwright install chromium
```

### 環境変数

- `docs/env.example` を `.env.local` にコピーし、Supabase/Playwright/OpenAI などのキーを設定してください。
- 主要な環境変数
  - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_JWT_SECRET`
  - `PLAYWRIGHT_QUEUE_ID`, `PLAYWRIGHT_WORKER_URL`
  - `OPENAI_API_KEY`

### 開発サーバーの起動

```bash
yarn dev
# または
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 使い方

1. 対象サイトのURLを入力
2. 送信したい情報を入力（会社名、名前、メールアドレスなど）
3. 「開始」ボタンをクリック
4. 自動的にブラウザが起動し、フォームを検出・入力・送信します
5. ログで実行状況を確認できます

### デバッグモード

「ブラウザ表示 (デバッグ)」チェックボックスを有効にすると、実際のブラウザウィンドウが表示され、動作を確認できます。

## ビルド

```bash
yarn build
# または
npm run build
```

## 注意事項

- このツールは適切な用途でのみ使用してください
- スパムや迷惑行為に使用しないでください
- 各Webサイトの利用規約を確認してから使用してください
- 一部のWebサイトでは、自動化ツールによる送信が禁止されている場合があります

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
