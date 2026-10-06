/**
 * 물고기 겹 합성 (팔레트 교체). 규칙은 @worldsea/shared fishArt.ts, 규격은 docs/fish-art.md.
 * 결과는 가로 2프레임 캔버스(w*2 × h). Phaser에서는 textures.addCanvas 로 그대로 쓴다.
 */
import { FISH_FRAMES, FISH_GRAYS, FISH_SIZES, type FishPlan, type FishSize } from '@worldsea/shared';
import { assetUrl } from './assets';

const GRAY_VALUES = FISH_GRAYS.map((h) => parseInt(h.slice(1, 3), 16));
const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(key: string): Promise<HTMLImageElement> {
  const url = assetUrl(key);
  if (!url) return Promise.reject(new Error(`에셋 없음: ${key}`));
  let p = imageCache.get(key);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`불러오기 실패: ${key}`));
      img.src = url;
    });
    imageCache.set(key, p);
  }
  return p;
}

const hexRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};

/** 회색 값 → 가장 가까운 단계 번호 (0=가장 밝음) */
export function grayIndex(v: number): number {
  let best = 0;
  for (let i = 1; i < GRAY_VALUES.length; i++) if (Math.abs(GRAY_VALUES[i]! - v) < Math.abs(GRAY_VALUES[best]! - v)) best = i;
  return best;
}

export async function composeFish(plan: FishPlan, size: FishSize): Promise<HTMLCanvasElement> {
  const { w, h } = FISH_SIZES[size];
  const W = w * FISH_FRAMES;
  const out = document.createElement('canvas');
  out.width = W;
  out.height = h;
  const ctx = out.getContext('2d')!;
  const tmp = document.createElement('canvas');
  tmp.width = W;
  tmp.height = h;
  const tctx = tmp.getContext('2d', { willReadFrequently: true })!;

  for (const layer of plan.layers) {
    const img = await loadImage(layer.key);
    tctx.clearRect(0, 0, W, h);
    // 1프레임짜리 파일이면 두 칸에 같은 그림을 쓴다
    if (img.width >= W) tctx.drawImage(img, 0, 0, W, h, 0, 0, W, h);
    else for (let f = 0; f < FISH_FRAMES; f++) tctx.drawImage(img, 0, 0, w, h, f * w, 0, w, h);
    if (layer.colors) {
      const colors = layer.colors.map(hexRgb);
      const data = tctx.getImageData(0, 0, W, h);
      const d = data.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3]! < 128) {
          d[i + 3] = 0;
          continue;
        }
        const [r, g, b] = colors[grayIndex(d[i]!)]!;
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
        d[i + 3] = 255;
      }
      tctx.putImageData(data, 0, 0);
    }
    ctx.drawImage(tmp, 0, 0);
  }
  return out;
}

export interface FishFileCheck {
  width: number;
  height: number;
  /** 규격 크기(1프레임 또는 2프레임)와 맞는지 */
  sizeOk: boolean;
  /** 회색 5단계가 아닌 색을 쓴 불투명 픽셀 수 (line 겹은 검사하지 않음) */
  offGray: number;
  /** 반투명 픽셀 수 (도트는 완전 투명/완전 불투명만) */
  semiAlpha: number;
}

/** 겹 파일 규격 검사 (미리보기 페이지용) */
export async function checkFishFile(key: string, size: FishSize, isLine: boolean): Promise<FishFileCheck> {
  const img = await loadImage(key);
  const { w, h } = FISH_SIZES[size];
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, img.width, img.height).data;
  let offGray = 0;
  let semiAlpha = 0;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3]!;
    if (a === 0) continue;
    if (a < 255) semiAlpha++;
    if (!isLine && !(d[i] === d[i + 1] && d[i] === d[i + 2] && GRAY_VALUES.includes(d[i]!))) offGray++;
  }
  return {
    width: img.width,
    height: img.height,
    sizeOk: img.height === h && (img.width === w || img.width === w * FISH_FRAMES),
    offGray,
    semiAlpha,
  };
}
