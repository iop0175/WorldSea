import { ApiRequestError, claimExpedition, getExpeditions, getMe } from './api';
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
  const { setMe, setPhase, setExpeditions } = useGameStore.getState();
  try {
    const [me, expeditions] = await Promise.all([getMe(), getExpeditions()]);
    setMe(me);
    setExpeditions(expeditions.expeditions);
  } catch (e) {
    if (e instanceof ApiRequestError && e.code === 'needs_signup') return setPhase('signup');
    if (e instanceof ApiRequestError && e.code === 'unauthorized') {
      await signOut();
      return setPhase('login');
    }
    setPhase('error', e instanceof Error ? e.message : '알 수 없는 오류');
  }
}

/** 응답 유실 후에도 같은 배치 키로 재시도하고, 큰 수령은 여러 요청으로 나눈다. */
export async function collectResults(target = 'all') {
  const { me, claimStatus, setClaimStatus } = useGameStore.getState();
  if (!me || claimStatus.busy) return;
  setClaimStatus({ busy: true, message: null, error: null });
  const storageKey = `worldsea:expedition-claim:${me.player.id}:${target}`;
  let fish = 0, gold = 0, premium = 0, exp = 0, items = 0;
  let message: string | null = null;
  let error: string | null = null;
  try {
    let hasMore: boolean;
    do {
      const key = sessionStorage.getItem(storageKey) ?? crypto.randomUUID();
      sessionStorage.setItem(storageKey, key);
      const result = await claimExpedition(target, key);
      sessionStorage.removeItem(storageKey);
      fish += result.claimed.fishIds.length; gold += result.claimed.gold; premium += result.claimed.premium;
      exp += result.claimed.exp; items += result.claimed.items.reduce((sum, i) => sum + i.count, 0);
      hasMore = result.hasMore;
    } while (hasMore);
    const rewards = [fish && `물고기 ${fish}마리`, gold && `골드 ${gold}`, premium && `프리미엄 ${premium}`, items && `아이템 ${items}개`, exp && `경험치 ${exp}`].filter(Boolean);
    message = rewards.length ? `수령 완료 · ${rewards.join(' · ')}` : '수령할 결과가 없습니다';
  } catch (e) {
    if (e instanceof ApiRequestError && e.status >= 400 && e.status < 500) sessionStorage.removeItem(storageKey);
    error = e instanceof Error ? e.message : '수령하지 못했습니다. 다시 시도해 주세요';
  } finally {
    await refreshMe();
    setClaimStatus({ busy: false, message, error });
  }
}
