'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

const MOCK_USERNAME = 'VOIQ-2025';
const MOCK_PASSWORD = 'VOIQ-2025';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const isAuthorized = username === MOCK_USERNAME && password === MOCK_PASSWORD;

    if (!isAuthorized) {
      setError('ユーザー名またはパスワードが正しくありません。');
      setIsSubmitting(false);
      return;
    }

    document.cookie = `apotto_auth=1; path=/; max-age=${60 * 60 * 24 * 7}`;
    router.push('/ai-custom');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">ログイン</h1>
        <p className="mt-2 text-sm text-slate-600">
          モックユーザーでサインインしてください。
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            ユーザー名
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="ユーザー名を入力"
              autoComplete="username"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            パスワード
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="パスワードを入力"
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <p className="text-sm text-rose-500" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? '確認中…' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}

