/**
 * 에셋 자동 인식. src/assets 아래 PNG를 빌드 시점에 모아, 있는 파일만 쓴다.
 * 없는 에셋은 각 화면이 임시 도형/도트로 대신 그린다 (docs/assets-main.md).
 */
const files = import.meta.glob('../assets/**/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

/** 키('obj/tank_main_back') → URL */
export const ASSET_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.replace('../assets/', '').replace(/\.png$/, ''), url]),
);

export const hasAsset = (key: string) => key in ASSET_URLS;
export const assetUrl = (key: string): string | undefined => ASSET_URLS[key];

/** 스프라이트 시트 규격 (가로 3프레임 x 세로 4방향) */
export const SHEETS: Record<string, { frameWidth: number; frameHeight: number }> = {
  'chr/player': { frameWidth: 16, frameHeight: 24 },
  'chr/staff': { frameWidth: 16, frameHeight: 24 },
  'chr/guest_a': { frameWidth: 16, frameHeight: 24 },
  'chr/guest_b': { frameWidth: 16, frameHeight: 24 },
  'chr/guest_c': { frameWidth: 16, frameHeight: 24 },
  'chr/guest_d': { frameWidth: 16, frameHeight: 24 },
  'fx/bubble': { frameWidth: 4, frameHeight: 4 },
  'fx/sparkle': { frameWidth: 8, frameHeight: 8 },
};

/** UI 9-slice 모서리 두께 */
export const SLICES: Record<string, number> = {
  'ui/panel_dark': 6,
  'ui/panel_glow': 10,
  'ui/btn_gold': 5,
  'ui/card_frame': 8,
  'ui/card_frame_gold': 8,
  'ui/card_frame_locked': 8,
  'ui/badge': 3,
};
