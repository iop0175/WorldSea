import type { MeResponse } from '@worldsea/shared';
import { MOCK_HUNTERS, MOCK_PLAYER, REGION_NAME_KO, type HunterCard } from './mock';

/** 화면에 그릴 값. 서버 응답(me)이 있으면 그것으로, 미리보기면 mock으로 만든다 */
export interface MainView {
  nickname: string;
  level: number;
  expRatio: number;
  premium: number;
  gold: number;
  stamina: number;
  staminaMax: number;
  staminaNext: string | null;
  timeTickets: number;
  unread: number;
  shopStageName: string;
  shopStageProgress: number;
  hunters: HunterCard[];
}

const SHOP_STAGE_NAME = ['', '1단계 동네 샵', '2단계 작은 수족관', '3단계 중형 수족관', '4단계 공공 수족관'];

export const mmss = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

export function toView(me: MeResponse | null): MainView {
  if (!me) return { ...MOCK_PLAYER, hunters: MOCK_HUNTERS };
  const p = me.player;
  const now = Date.parse(me.serverTime);
  const cards: HunterCard[] = me.hunters.slice(0, me.hunterSlots).map((h) => {
    const e = h.expedition;
    const region = e ? REGION_NAME_KO[e.regionId] ?? e.regionId : '';
    if (!e) return { kind: 'idle', name: h.name };
    if (e.status === 'completed') return { kind: 'complete', region };
    return { kind: 'hunting', region, regionId: e.regionId, done: e.repeatDone, total: e.repeatTotal, remain: mmss(Math.max(0, Math.round((Date.parse(e.endsAt) - now) / 1000))) };
  });
  // 잠긴 슬롯: 아직 충족하지 못한 조건 순서대로 (레벨 → 구독 → VIP)
  const conditions = [p.level < 10 ? 'LV.10 해금' : null, '구독 해금', 'VIP 해금'].filter(Boolean) as string[];
  while (cards.length < 4) cards.push({ kind: 'locked', condition: conditions.shift() ?? '잠김' });
  return {
    nickname: p.nickname,
    level: p.level,
    expRatio: 0, // 레벨별 필요 경험치는 밸런싱 후
    premium: p.premium,
    gold: p.gold,
    stamina: p.stamina,
    staminaMax: p.staminaMax,
    staminaNext: p.staminaNextSec === null ? null : mmss(p.staminaNextSec),
    timeTickets: p.timeTickets,
    unread: 0,
    shopStageName: SHOP_STAGE_NAME[p.shopStage] ?? `${p.shopStage}단계`,
    shopStageProgress: 0,
    hunters: cards,
  };
}
