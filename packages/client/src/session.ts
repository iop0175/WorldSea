import { ApiRequestError, getMe } from './api';
import { authConfigured, signOut, supabase } from './auth/supabase';
import { useGameStore } from './store';

/** 앱 시작 시 한 번: 로그인 상태를 보고 화면 흐름을 정한다 */
export function startSession() {
  const { setPhase } = useGameStore.getState();
  if (!authConfigured || !supabase) {
    setPhase('preview');
    return;
  }
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
      if (session) void refreshMe();
      else setPhase('login');
    } else if (event === 'SIGNED_OUT') {
      setPhase('login');
    }
  });
}

/** 서버에서 내 상태를 다시 받아 온다 */
export async function refreshMe() {
  const { setMe, setPhase } = useGameStore.getState();
  try {
    setMe(await getMe());
  } catch (e) {
    if (e instanceof ApiRequestError && e.code === 'needs_signup') return setPhase('signup');
    if (e instanceof ApiRequestError && e.code === 'unauthorized') {
      await signOut();
      return setPhase('login');
    }
    setPhase('error', e instanceof Error ? e.message : '알 수 없는 오류');
  }
}
