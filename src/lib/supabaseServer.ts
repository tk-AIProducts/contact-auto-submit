import { createServerClient } from '@supabase/ssr';
import type { CookieMethodsServerDeprecated } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function getCookieStore(): CookieStore {
  // Next.js の型定義は Promise を返すが、実際には同期的に CookieStore を返すため型変換する
  return cookies() as unknown as CookieStore;
}

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

export function createSupabaseServerClient(cookieStore?: CookieStore) {
  const store = cookieStore ?? getCookieStore();
  const { supabaseUrl: url, supabaseAnonKey: anonKey } = ensurePublicEnv();

  const cookieMethods: CookieMethodsServerDeprecated = {
    get(name) {
      return store.get(name)?.value;
    },
    set() {
      // Next.js の ReadonlyRequestCookies ではサーバー側で set できないため no-op
    },
    remove() {
      // 同上
    },
  };

  return createServerClient(url, anonKey, {
    cookies: cookieMethods,
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

