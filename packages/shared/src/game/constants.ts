/** 게임 공용 상수. 숫자 밸런싱은 아직 미정이라 확정된 규칙만 둔다. */

export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
export type Rarity = (typeof RARITIES)[number];

export const RARITY_LABEL_KO: Record<Rarity, string> = {
  common: '일반',
  uncommon: '고급',
  rare: '희귀',
  epic: '영웅',
  legendary: '전설',
};

/** 하단 탭 (확정: 샵/사육/원정/도감/상점) */
export const BOTTOM_TABS = ['shop', 'farm', 'expedition', 'dex', 'store'] as const;
export type BottomTab = (typeof BOTTOM_TABS)[number];

export const BOTTOM_TAB_LABEL_KO: Record<BottomTab, string> = {
  shop: '샵',
  farm: '사육',
  expedition: '원정',
  dex: '도감',
  store: '상점',
};

/** 헌터 슬롯: 기본 1, 레벨 10 무렵 +1, 구독 +1, 높은 VIP +1, 최대 4 */
export const HUNTER_SLOT_MAX = 4;
/** 반복 수색 최대 횟수: 기본 100, 구독 또는 높은 VIP 200 */
export const REPEAT_MAX_BASE = 100;
export const REPEAT_MAX_PREMIUM = 200;
/** 상점에서 살 수 있는 장비 최고 등급 */
export const SHOP_MAX_ITEM_GRADE: Rarity = 'rare';
/** 입질 미니게임 기본 제한 시간(초) */
export const RARE_BITE_TIMEOUT_SEC = 30 * 60;

/** 등급 순서 비교: a가 b 이상이면 true */
export const rarityAtLeast = (a: Rarity, b: Rarity): boolean => RARITIES.indexOf(a) >= RARITIES.indexOf(b);

/** 입질 미니게임 기준 등급 기본값 (기획 69번: 플레이어가 바꿀 수 있음). 미만 등급은 바로 포획 */
export const DEFAULT_MINIGAME_THRESHOLD: Rarity = 'rare';
/** 수색에서 걸린 물고기가 입질 미니게임 대상인지 */
export const needsMinigame = (fishRarity: Rarity, threshold: Rarity = DEFAULT_MINIGAME_THRESHOLD): boolean =>
  rarityAtLeast(fishRarity, threshold);

/**
 * "놓아줌" 보상 (기획 71·72번): 잡을 수 없는 어종(쿼터 소진·보호종·0마리)이 걸렸을 때.
 * 골드는 소액(어종 기준 가격 비율), 보전 포인트와 샵 평판은 등급별 고정. 수치는 밸런싱 전 임시값.
 */
export const RELEASE_REWARD_TEMP = {
  goldRate: 0.1,
  conservationPoints: { common: 1, uncommon: 2, rare: 4, epic: 8, legendary: 16 } as Record<Rarity, number>,
  shopExp: { common: 1, uncommon: 2, rare: 3, epic: 5, legendary: 8 } as Record<Rarity, number>,
};

export interface ReleaseReward {
  gold: number;
  conservationPoints: number;
  shopExp: number;
}

export function releaseReward(rarity: Rarity, basePrice: number): ReleaseReward {
  const T = RELEASE_REWARD_TEMP;
  return {
    gold: Math.max(1, Math.floor(basePrice * T.goldRate)),
    conservationPoints: T.conservationPoints[rarity],
    shopExp: T.shopExp[rarity],
  };
}

/**
 * 하루 기준 (기획 75번): 세계 표준시(UTC) 자정에 초기화 = 한국 시간 오전 9시.
 * 일일 한도·출석·광고·무료 시간 티켓·스태미너 구매 횟수가 모두 이 날짜를 쓴다. 서버 시각으로만 계산한다.
 */
export const DAILY_RESET_UTC_HOUR = 0;
/** 게임 날짜 'YYYY-MM-DD' (UTC) */
export const gameDay = (at: Date): string => at.toISOString().slice(0, 10);
/** 다음 초기화 시각 */
export const nextDailyReset = (at: Date): Date =>
  new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate() + 1, DAILY_RESET_UTC_HOUR));
