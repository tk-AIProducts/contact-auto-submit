import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function ensurePublicEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase の公開環境変数 (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) が設定されていません。'
    );
  }
  return { supabaseUrl, supabaseAnonKey };
}

export function createSupabaseBrowserClient() {
  if (typeof window === 'undefined') {
    throw new Error('ブラウザクライアントはクライアントコンポーネント内でのみ使用してください。');
  }
  const { supabaseUrl: url, supabaseAnonKey: anonKey } = ensurePublicEnv();
  return createBrowserClient(url, anonKey);
}

