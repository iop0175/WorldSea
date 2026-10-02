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
