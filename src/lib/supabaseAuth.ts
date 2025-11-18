import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { Session, User } from '@supabase/supabase-js';

import { createSupabaseServerClient } from './supabaseServer';

export const getCachedServerSupabase = cache(() => createSupabaseServerClient());

export async function getServerSession(): Promise<Session | null> {
  const supabase = getCachedServerSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('[supabase] getSession failed', error);
    throw error;
  }
  return data.session ?? null;
}

export async function requireServerUser(options?: { redirectTo?: string }): Promise<User> {
  const session = await getServerSession();
  if (!session?.user) {
    if (options?.redirectTo) {
      redirect(options.redirectTo);
    }
    throw new Error('認証が必要です。');
  }
  return session.user;
}

export async function getServerAccessToken(): Promise<string | null> {
  const session = await getServerSession();
  return session?.access_token ?? null;
}

export async function signOutServerAction(redirectTo = '/auth/login') {
  'use server';

  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(redirectTo);
}

