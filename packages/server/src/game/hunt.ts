import { RARITIES, type Rarity } from '@worldsea/shared';

/** 밸런싱 전 임시 확률. 공개 확률표와 같은 원본을 사용한다. */
export const HUNT_TEMP = {
  outcomes: { fish: 65, gold: 20, premium: 2, item: 10, miss: 3 },
  rarities: [
    [65, 25, 8, 1.8, 0.2], [55, 30, 11, 3.5, 0.5],
    [45, 32, 17, 5, 1], [35, 35, 22, 6, 2],
  ],
  missPity: 3,
  gold: 20, premium: 1, exp: 10,
  staminaPrice: 10, staminaAmount: 60, staminaDailyMax: 5,
  autoChance: { common: 0.8, uncommon: 0.7, rare: 0.55, epic: 0.3, legendary: 0.15 },
  /** 직접 입질: 게이지 가운데(position 0)의 성공 확률. 가장자리(1)에서는 edgeFactor배, 시도마다 attemptPenalty 감소 */
  manualChance: { common: 0.95, uncommon: 0.9, rare: 0.75, epic: 0.5, legendary: 0.3 },
  /** 특별 맵(99번): 등급과 무관하게 가운데 35%에서 시작. 가장자리 배율·시도당 하락은 입질과 같다 */
  specialCenter: 0.35,
  edgeFactor: 0.4, attemptPenalty: 0.05, maxChance: 0.95,
} as const;

/** 위치 표 해상도: chances[i]는 position i/(길이-1)의 확률 */
export const CHANCE_STEPS = 11;

/** 입질 시도 성공 확률. position이 null이면 자동 진행. 장비 보정은 더하고, 확률 표시값과 판정값이 같도록 이 함수만 쓴다. */
export function biteChance(rarity: Rarity, position: number | null, attemptNo: number, bonus = 0, center: number = HUNT_TEMP.manualChance[rarity]): number {
  const base = position === null
    ? HUNT_TEMP.autoChance[rarity]
    : center * (1 - (1 - HUNT_TEMP.edgeFactor) * position);
  return Math.round(Math.max(0, Math.min(HUNT_TEMP.maxChance, base - HUNT_TEMP.attemptPenalty * (attemptNo - 1) + bonus)) * 1000) / 1000;
}

export const biteChanceTable = (rarity: Rarity, attemptNo: number, bonus = 0, center?: number) =>
  Array.from({ length: CHANCE_STEPS }, (_, i) => biteChance(rarity, i / (CHANCE_STEPS - 1), attemptNo, bonus, center));

/** 입질 시드와 시도 순번에서 0~1(양 끝 제외) 난수를 만든다. 같은 시도는 항상 같은 결과라 재현·검증이 된다. */
export function seededRoll(seed: number, attemptNo: number): number {
  let h = Math.imul(seed ^ Math.imul(attemptNo, 0x9e3779b1), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (((h ^ (h >>> 16)) >>> 0) + 0.5) / 0x100000000; // 0이 나오면 확률과 무관하게 성공하므로 (0,1) 열린 구간으로 둔다
}

/** 서버 난수만 사용한다. 테스트에서는 난수를 주입해 경계값을 검증한다. */
export function random(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]! / 0x100000000;
}

export function weighted<T>(entries: readonly (readonly [T, number])[], roll = random()): T | undefined {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let remaining = roll * total;
  for (const [value, weight] of entries) {
    if (remaining < weight) return value;
    remaining -= weight;
  }
  return entries.at(-1)?.[0];
}

export function huntOutcome(missStreak: number, roll = random()) {
  const entries = Object.entries(HUNT_TEMP.outcomes) as [keyof typeof HUNT_TEMP.outcomes, number][];
  return weighted(entries.filter(([kind]) => kind !== 'miss' || missStreak < HUNT_TEMP.missPity), roll)!;
}

export function chooseSpecies<T extends { rarity: Rarity; isOriginal: boolean; isSpecialMapOnly: boolean }>(
  catalog: readonly T[], stage: number, rarityRoll = random(), speciesRoll = random(),
): T | undefined {
  const eligible = catalog.filter((s) => !s.isSpecialMapOnly && !(s.isOriginal && s.rarity === 'legendary'));
  const weights = HUNT_TEMP.rarities[Math.max(0, Math.min(3, stage - 1))]!;
  const rarity = weighted(RARITIES.flatMap((r, i) => eligible.some((s) => s.rarity === r) ? [[r, weights[i]!] as const] : []), rarityRoll);
  const candidates = eligible.filter((s) => s.rarity === rarity);
  return candidates[Math.floor(speciesRoll * candidates.length)];
}
