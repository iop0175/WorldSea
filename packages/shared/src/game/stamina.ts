/**
 * 스태미너 규칙 (설계 원칙 3: 틱 루프 없이 "마지막 갱신 시각"으로 요청 시점에 계산).
 * 레벨별 최대치·회복 속도의 실제 수치는 밸런싱 단계에서 정한다. 아래 값은 임시.
 */
export const STAMINA_TEMP = {
  /** 임시: 기본 최대치 + 레벨당 증가 */
  baseMax: 60,
  maxPerLevel: 1,
  /** 임시: 1 회복에 걸리는 초 */
  regenSec: 300,
} as const;

export function staminaMax(level: number): number {
  return STAMINA_TEMP.baseMax + (Math.max(1, level) - 1) * STAMINA_TEMP.maxPerLevel;
}

export function staminaRegenSec(_level: number): number {
  return STAMINA_TEMP.regenSec;
}

export interface StaminaState {
  stamina: number;
  /** 저장해야 할 새 기준 시각 (회복분을 반영했을 때) */
  updatedAt: Date;
  max: number;
  /** 다음 1 회복까지 남은 초, 가득이면 null */
  nextSec: number | null;
}

/**
 * 저장된 값(stored, updatedAt)에서 now 시점의 스태미너를 계산한다.
 * - 최대치 이상으로는 자연 회복하지 않는다 (구매·보상으로 최대치를 넘긴 값은 그대로 둔다).
 * - 회복 남은 조각 시간은 updatedAt 을 앞당겨 보존한다.
 */
export function computeStamina(stored: number, updatedAt: Date, now: Date, level: number): StaminaState {
  const max = staminaMax(level);
  const regen = staminaRegenSec(level);
  if (stored >= max) return { stamina: stored, updatedAt: now, max, nextSec: null };
  const elapsed = Math.max(0, Math.floor((now.getTime() - updatedAt.getTime()) / 1000));
  const gained = Math.floor(elapsed / regen);
  const stamina = Math.min(max, stored + gained);
  if (stamina >= max) return { stamina, updatedAt: now, max, nextSec: null };
  const base = new Date(updatedAt.getTime() + gained * regen * 1000);
  const nextSec = regen - (elapsed - gained * regen);
  return { stamina, updatedAt: base, max, nextSec };
}
