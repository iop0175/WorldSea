/**
 * 실제 야생 현황(IUCN 등급·규모) → 게임 야생 개체수 변환 규칙.
 * 원칙: 절대 숫자는 실제를 따르지 않고(대부분 알 수 없고, 동시 접속자에 맞춰야 함) 비율만 실제를 따른다.
 * 전체 크기는 POPULATION_TEMP.scale 하나로 조절한다. 수치는 밸런싱 전 임시. (docs/species-population.md)
 */
export const IUCN_CATEGORIES = ['LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'DD', 'NE'] as const;
export type IucnCategory = (typeof IUCN_CATEGORIES)[number];
/** 실제가 아닌 어종: 고대(화석), 게임 오리지널 */
export type SpeciesOrigin = 'extant' | 'fossil' | 'original' | 'original_legend';

export const POPULATION_TIERS = ['very_common', 'common', 'uncommon', 'scarce', 'very_scarce'] as const;
export type PopulationTier = (typeof POPULATION_TIERS)[number];

export type PopulationTrend = 'increasing' | 'stable' | 'decreasing' | 'unknown';
export type GameRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ConservationStatusValue = 'stable' | 'vulnerable' | 'protected' | 'extinct_wild';

export const POPULATION_TEMP = {
  /** 전체 배율: 서버 규모(동시 접속자)에 맞춰 이 값 하나로 조절 */
  scale: 1,
  /** 실제 규모별 수용량(100% 기준 개체수) */
  tierBase: { very_common: 50_000, common: 20_000, uncommon: 6_000, scarce: 1_500, very_scarce: 400 } as Record<PopulationTier, number>,
  /** 게임 희귀도별 수용량 상한 (희귀도가 높을수록 적게) */
  rarityMax: { common: 50_000, uncommon: 20_000, rare: 6_000, epic: 1_500, legendary: 400 } as Record<GameRarity, number>,
  /**
   * 시작 비율(수용량 대비 %): 실제로 위협받는 종은 게임에서도 처음부터 줄어든 상태.
   * 위급(CR)도 '보호종(포획 금지)'이 아닌 '취약(일일 쿼터)'으로 시작한다. 보호종에서 시작하면 아무도 잡을 수 없어 복원도 불가능하기 때문.
   */
  startPercent: { LC: 100, NE: 100, DD: 100, NT: 75, VU: 45, EN: 25, CR: 12, EW: 12 } as Record<IucnCategory, number>,
  /** 자연 회복률 r (로지스틱, 1일 기준) */
  regen: { LC: 0.05, NE: 0.05, DD: 0.04, NT: 0.035, VU: 0.025, EN: 0.015, CR: 0.008, EW: 0.005 } as Record<IucnCategory, number>,
  decreasingRegenFactor: 0.7,
  legendaryRegenFactor: 0.5,
  /** 숨은 보유량(전설 목격 씨앗) 비율 */
  hiddenShare: { epic: 0.03, legendary: 0.05 } as Partial<Record<GameRarity, number>>,
  /** 고대 어종: 실제 데이터가 없으므로 희귀도로 규모를 정한다 */
  fossilTier: { common: 'common', uncommon: 'uncommon', rare: 'scarce', epic: 'very_scarce', legendary: 'very_scarce' } as Record<GameRarity, PopulationTier>,
  /** 오리지널: 특별 맵 개체는 소수, 오리지널 전설급은 서버 전체에 몇 마리만 */
  originalCapacity: 60,
  originalLegendCapacity: 5,
} as const;

/** 보전 상태 기준: 안정 ≥30%, 취약 <30%(일일 쿼터), 보호종 <10%(포획 금지). 야생 멸종은 이벤트로만 들어가고 방류로만 나온다 */
export function statusFromPercent(percent: number, current: ConservationStatusValue = 'stable'): ConservationStatusValue {
  if (current === 'extinct_wild') return 'extinct_wild';
  if (percent < 10) return 'protected';
  if (percent < 30) return 'vulnerable';
  return 'stable';
}

export interface PopulationInput {
  origin: SpeciesOrigin;
  rarity: GameRarity;
  iucn?: IucnCategory | null;
  tier?: PopulationTier | null;
  trend?: PopulationTrend | null;
}

export interface GamePopulation {
  /** 수용량 = species.initial_population (비율 100%의 기준) */
  capacity: number;
  /** 서버 오픈 시 야생 개체수 = wild_populations.count */
  startCount: number;
  startStatus: ConservationStatusValue;
  hiddenReserve: number;
  regenRatePerDay: number;
}

export function gamePopulation(input: PopulationInput, scale: number = POPULATION_TEMP.scale): GamePopulation {
  const T = POPULATION_TEMP;
  if (input.origin === 'original_legend') {
    const cap = T.originalLegendCapacity;
    return { capacity: cap, startCount: cap, startStatus: 'stable', hiddenReserve: 0, regenRatePerDay: 0 };
  }
  if (input.origin === 'original') {
    const cap = Math.max(1, Math.round(T.originalCapacity * scale));
    return { capacity: cap, startCount: cap, startStatus: 'stable', hiddenReserve: 0, regenRatePerDay: 0.01 };
  }
  const iucn: IucnCategory = input.origin === 'fossil' ? 'NE' : (input.iucn ?? 'NE');
  const tier: PopulationTier = input.origin === 'fossil' ? T.fossilTier[input.rarity] : (input.tier ?? 'common');
  const capacity = Math.max(1, Math.round(Math.min(T.tierBase[tier], T.rarityMax[input.rarity]) * scale));
  const percent = input.origin === 'fossil' ? 100 : T.startPercent[iucn];
  const startCount = Math.max(1, Math.round((capacity * percent) / 100));
  let r = input.origin === 'fossil' ? 0.02 : T.regen[iucn];
  if (input.trend === 'decreasing') r *= T.decreasingRegenFactor;
  if (input.rarity === 'legendary') r *= T.legendaryRegenFactor;
  const share = T.hiddenShare[input.rarity] ?? 0;
  return {
    capacity,
    startCount,
    startStatus: statusFromPercent(percent),
    hiddenReserve: share ? Math.max(1, Math.round(capacity * share)) : 0,
    regenRatePerDay: Math.round(r * 10000) / 10000,
  };
}

/**
 * 취약 어종의 플레이어별 하루 포획 한도 (기획 74번). 보호종 기준(10%)에 가까울수록 줄어든다.
 * 안정(30% 이상)은 한도 없음(null), 보호종(10% 미만)은 0. 수치는 밸런싱 전 임시값.
 */
export const VULNERABLE_LIMIT_TEMP: { minPercent: number; limit: number }[] = [
  { minPercent: 20, limit: 3 },
  { minPercent: 15, limit: 2 },
  { minPercent: 10, limit: 1 },
];

export function vulnerableDailyLimit(percent: number): number | null {
  if (percent >= 30) return null;
  for (const step of VULNERABLE_LIMIT_TEMP) if (percent >= step.minPercent) return step.limit;
  return 0;
}
