'use client';

import { useState } from 'react';

type PdfTokenPageProps = {
  params: { token: string };
};

export default function PdfTokenPage({ params }: PdfTokenPageProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setError('メールアドレスを入力してください。');
      return;
    }
    setSubmitted(true);
    setError(null);
    // TODO: Supabase へ閲覧ログを保存し、PDF Storage からファイルを取得する。
    // ここではプレースホルダー表示のみ行う。
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-100">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            apotto
          </p>
          <h1 className="mt-2 text-2xl font-semibold">資料閲覧ページ</h1>
          <p className="mt-1 text-sm text-slate-600">
            セキュアなPDF閲覧のため、メールアドレスを入力した方のみ表示します。入力済み情報はSupabase DBで閲覧ログとして記録されます。
          </p>
        </header>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="text-sm font-medium text-slate-700">
              メールアドレス
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </label>
            {error && <p className="text-sm text-rose-500">{error}</p>}
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
            >
              PDFを表示する
            </button>
            <p className="text-xs text-slate-500">
              トークン: <code className="font-mono">{params.token}</code>
            </p>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-900">{email}</span> として閲覧を記録しました。
                本番ではSupabase StorageのPDFを読み込み、PDF.js等で埋め込み表示します。
              </p>
            </div>
            <div className="flex h-[60vh] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-slate-400">
              PDFコンテンツのプレースホルダー
            </div>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setEmail('');
              }}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              別のアドレスで閲覧する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

