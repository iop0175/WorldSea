import { HUNTER_SLOT_MAX } from './constants';

/** 헌터 슬롯: 기본 1, 레벨 10 무렵 +1, 월 구독 +1, 높은 VIP +1, 최대 4 (정확한 레벨·VIP 등급은 밸런싱에서 확정) */
export const HUNTER_SLOT_TEMP = { secondSlotLevel: 10, vipTierForBonus: 5 } as const;

export function hunterSlots(level: number, subscribed: boolean, vipTier: number): number {
  let n = 1;
  if (level >= HUNTER_SLOT_TEMP.secondSlotLevel) n++;
  if (subscribed) n++;
  if (vipTier >= HUNTER_SLOT_TEMP.vipTierForBonus) n++;
  return Math.min(HUNTER_SLOT_MAX, n);
}
