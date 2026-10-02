import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Auth 클라이언트. 로그인/토큰 관리만 쓴다.
 * DB에는 직접 접근하지 않는다 (설계 원칙 1: 모든 읽기·쓰기는 Workers API).
 * 환경 변수가 없으면 null → 미리보기 모드.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;

export const authConfigured = supabase !== null;

export async function accessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

const redirectTo = () => window.location.origin + window.location.pathname;

export function signInWithProvider(provider: 'google' | 'apple') {
  return supabase!.auth.signInWithOAuth({ provider, options: { redirectTo: redirectTo() } });
}

export function signInWithEmail(email: string) {
  return supabase!.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
}

export function signOut() {
  return supabase?.auth.signOut();
}
