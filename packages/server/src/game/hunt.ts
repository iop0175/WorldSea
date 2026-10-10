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
} as const;

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
