/**
 * 메인 화면 영역 (게임 좌표 360x640). docs/ui-main.md 1장 기준.
 * Phaser 장면과 React UI가 같은 값을 써서 위치를 맞춘다.
 */
/** 게임 기준 해상도 (9:16). 2026-10-02 180x320 → 360x640 상향. 에셋은 이 해상도 기준으로 그린다. */
export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;

export const LAYOUT = {
  topBar: { y: 0, h: 38 },
  scene: { y: 38, h: 462 }, // 38 ~ 500
  hunter: { y: 500, h: 76 }, // 500 ~ 576
  tabBar: { y: 576, h: 64 }, // 576 ~ 640
} as const;

/** 1단계 동네 브리딩샵 배치 (기준 이미지 좌표 x 0.3826). 라벨은 React가 같은 좌표로 얹는다. */
export const STAGE1_SPOTS = {
  wallTankA: { x: 92, y: 92, w: 68, h: 30, label: '진열 · 베타' },
  wallTankB: { x: 200, y: 92, w: 68, h: 30, label: '진열 · 구피' },
  longTank: { x: 84, y: 142, w: 112, h: 52, label: '진열 수조' },
  tallTank: { x: 30, y: 146, w: 48, h: 116, label: '진열 수조' },
  counter: { x: 240, y: 134, w: 86, h: 66, label: '카운터 · 판매' },
  mainTank: { x: 92, y: 226, w: 158, h: 136, label: '메인 수조' },
  breeding: { x: 252, y: 226, w: 58, h: 136, label: '교배실', labelTop: true },
  fryA: { x: 24, y: 390, w: 78, h: 80, label: '치어 육성' },
  fryB: { x: 110, y: 390, w: 80, h: 80, label: '치어 육성' },
  market: { x: 240, y: 370, w: 48, h: 62, label: '시장' },
  guild: { x: 290, y: 370, w: 48, h: 62, label: '길드' },
} as const;

export type SpotKey = keyof typeof STAGE1_SPOTS;
