import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type CookieStore = ReturnType<typeof cookies>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

export function createSupabaseServerClient(cookieStore?: CookieStore) {
  const store = cookieStore ?? cookies();
  const { supabaseUrl: url, supabaseAnonKey: anonKey } = ensurePublicEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value;
      },
      set(name: string, value: string, options?: Parameters<CookieStore['set']>[2]) {
        store.set(name, value, options);
      },
      remove(name: string, options?: Parameters<CookieStore['delete']>[1]) {
        store.delete(name, options);
      },
    },
  });
}

export const createSupabaseServiceClient = cache(() => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Supabase のサービスロールキー (SUPABASE_SERVICE_ROLE_KEY) が設定されていません。'
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  }) as SupabaseClient;
});

