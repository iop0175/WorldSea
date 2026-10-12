/**
 * 입질·특별 맵 가로 게이지 화면 규칙 (기획 79·80번). 화면 표시 전용이며 판정은 서버가 한다.
 * 위치 x는 -1(왼쪽 끝)~0(가운데)~1(오른쪽 끝)이고, 서버에 보내는 값은 가운데로부터의 거리 |x| (0~1)다.
 */

/** 바늘 속도(게이지 전체 폭/초). 가운데에서 가장 빠르고 가장자리에서 가장 느리다 (79번). */
export const NEEDLE_SPEED = { center: 2.4, edge: 0.7 } as const;

/** 서버 최대 확률(HUNT_TEMP.maxChance). 장비 보정을 더한 표시값을 이 값에서 자른다. */
export const DISPLAY_MAX_CHANCE = 0.95;

export interface Needle { x: number; dir: 1 | -1 }

export function needleSpeed(x: number): number {
  return NEEDLE_SPEED.edge + (NEEDLE_SPEED.center - NEEDLE_SPEED.edge) * (1 - Math.min(1, Math.abs(x)));
}

/** dt초 동안 바늘을 움직인다. 끝에 닿으면 반대로 튕기고, 큰 dt(탭 전환 후 복귀 등)도 안전하게 나눠 처리한다. */
export function stepNeedle(n: Needle, dt: number): Needle {
  let { x, dir } = n;
  let left = Math.max(0, Math.min(dt, 1));
  while (left > 0) {
    const step = Math.min(left, 1 / 60);
    x += dir * needleSpeed(x) * step;
    if (x >= 1) { x = 1; dir = -1; } else if (x <= -1) { x = -1; dir = 1; }
    left -= step;
  }
  return { x, dir };
}

/** 위치별 확률 표(길이 11 등, 가운데부터 가장자리까지)에서 거리 d의 확률을 직선으로 보간한다. */
export function chanceAt(table: readonly number[], distance: number): number {
  if (!table.length) return 0;
  const d = Math.max(0, Math.min(1, distance)) * (table.length - 1);
  const i = Math.floor(d);
  const next = Math.min(table.length - 1, i + 1);
  return table[i]! + (table[next]! - table[i]!) * (d - i);
}

/** 장비 보정을 더한 표시 확률. 서버 공식과 같은 방식(더한 뒤 최대 확률에서 자름). 실제 판정 확률은 시도 응답의 chance다. */
export function displayChance(table: readonly number[], distance: number, bonus = 0): number {
  return Math.max(0, Math.min(DISPLAY_MAX_CHANCE, chanceAt(table, distance) + bonus));
}

export const RELEASE_REASON_KO = {
  protected: '보호종이 되어 잡을 수 없게 됐어요',
  daily_limit: '오늘 잡을 수 있는 수를 넘었어요',
  depleted: '바다에 남은 개체가 없어요',
} as const;
