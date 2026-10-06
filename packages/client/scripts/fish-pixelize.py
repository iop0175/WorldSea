#!/usr/bin/env python3
"""
생성 도구로 만든 물고기 그림 → 물고기 겹 규격(docs/fish-art.md)의 도트 한 장.

  python packages/client/scripts/fish-pixelize.py 생성.png 결과.png            # 큰 그림 48x32
  python packages/client/scripts/fish-pixelize.py 생성.png 결과.png --size s   # 작은 그림 16x10 (참고용, 손 정리 필요)

하는 일
1. 배경 제거: 투명 배경이면 그대로, 어두운 배경(빛 번짐 포함)·밝은 배경(가짜 투명 격자 포함)은 자동으로 잘라낸다
2. 물고기만 잘라 목표 크기(1px 여백)에 맞춰 줄인다. 줄이기 전에 살짝 흐리게 해서 잔무늬(지느러미 줄 등)가 점 잡음이 되지 않게 한다
3. 몸 안쪽은 회색 4단계(#fff #ccc #999 #666), 바깥 윤곽 1px은 가장 어두운 회색(#333)으로 칠한다
4. 결과는 한 프레임짜리 통 그림. 이후 Aseprite 등에서 겹(body / fin_back / fin_front / pattern / line)으로 나누고,
   꼬리 2프레임은 fish-strip.py 로 붙인다.

필요: pip install pillow numpy scipy
"""
import argparse
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as nd

SIZES = {'s': (16, 10), 'l': (48, 32)}
FISH_GRAYS = [255, 204, 153, 102, 51]  # packages/shared/src/game/fishArt.ts FISH_GRAYS 와 같아야 한다


def luminance(rgb: np.ndarray) -> np.ndarray:
    return rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114


def keep_large(mask: np.ndarray, min_ratio: float = 0.01) -> np.ndarray:
    """잡티 덩어리를 버리고 큰 덩어리만 남긴다"""
    lab, n = nd.label(mask)
    if n == 0:
        return mask
    sizes = nd.sum(mask, lab, range(1, n + 1))
    keep = [i + 1 for i, s in enumerate(sizes) if s >= sizes.max() * min_ratio]
    return np.isin(lab, keep)


def cut_mask(img: Image.Image, core: float, line: float) -> np.ndarray:
    rgba = np.asarray(img.convert('RGBA')).astype(float)
    alpha = rgba[..., 3]
    if (alpha < 16).mean() > 0.05:  # 이미 투명 배경
        return alpha > 128
    lum = luminance(rgba[..., :3])
    border = np.concatenate([lum[0], lum[-1], lum[:, 0], lum[:, -1]])
    bg = float(np.median(border))
    scale = max(img.size) / 1000
    if bg < 100:
        # 어두운 배경: 밝은 몸·지느러미 + 그 둘레의 진한 윤곽선 (빛 번짐은 버림)
        fish = nd.binary_opening(lum > core, iterations=2)
        fish = keep_large(fish)
        near = nd.binary_dilation(fish, iterations=max(4, int(10 * scale)))
        mask = fish | (near & (lum < line))
    else:
        # 밝은 배경(흰색, 가짜 투명 격자 포함): 테두리에서 이어지는 밝은 칸을 배경으로 채워 나간다.
        # 물고기는 진한 윤곽선으로 둘러싸여 있어 안쪽 밝은 곳까지 번지지 않는다.
        floor = float(np.percentile(border, 1)) - 15
        bright = lum > floor
        lab, _ = nd.label(bright)
        edge_labels = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
        bg_mask = np.isin(lab, edge_labels[edge_labels > 0])
        mask = keep_large(nd.binary_opening(~bg_mask, iterations=2))
    mask = nd.binary_fill_holes(mask)
    return nd.binary_opening(mask, iterations=1)


def main() -> None:
    ap = argparse.ArgumentParser(description='생성 물고기 그림 → 물고기 겹 규격 도트')
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--size', choices=['s', 'l'], default='l', help='l=48x32(기본), s=16x10')
    ap.add_argument('--core', type=float, default=60, help='어두운 배경일 때 몸으로 볼 최소 밝기 (기본 60)')
    ap.add_argument('--line', type=float, default=34, help='어두운 배경일 때 윤곽선으로 볼 최대 밝기 (기본 34)')
    ap.add_argument('--smooth', type=float, default=0.3, help='줄이기 전 흐림 정도 (0=안 함, 기본 0.3)')
    ap.add_argument('--cutout', help='배경을 뺀 원본 크기 그림도 저장 (겹 나누기 참고용)')
    args = ap.parse_args()

    W, H = SIZES[args.size]
    img = Image.open(args.src).convert('RGBA')
    mask = cut_mask(img, args.core, args.line)
    if not mask.any():
        sys.exit('물고기를 찾지 못했습니다. --core / --line 값을 바꿔 보세요.')
    if args.cutout:
        cut = np.asarray(img).copy()
        cut[..., 3] = mask * 255
        Image.fromarray(cut, 'RGBA').save(args.cutout)

    ys, xs = np.where(mask)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    scale = min((W - 2) / (x1 - x0), (H - 2) / (y1 - y0))
    nw, nh = max(1, round((x1 - x0) * scale)), max(1, round((y1 - y0) * scale))
    ox, oy = (W - nw) // 2, (H - nh) // 2

    rgb = img.convert('RGB').crop((x0, y0, x1, y1))
    if args.smooth > 0:
        rgb = rgb.filter(ImageFilter.GaussianBlur(args.smooth / scale))
    small = np.asarray(rgb.resize((nw, nh), Image.Resampling.BOX)).astype(float)
    m_small = np.asarray(Image.fromarray((mask[y0:y1, x0:x1] * 255).astype(np.uint8)).resize((nw, nh), Image.Resampling.BOX)) > 110

    lum = luminance(small)
    v = lum[m_small] if m_small.any() else lum.ravel()
    lo, hi = np.percentile(v, 3), np.percentile(v, 99)
    t = np.clip((lum - lo) / max(1.0, hi - lo), 0, 1)
    idx = np.clip(np.round((1 - t) * 3), 0, 3).astype(int)  # 0~3 = 밝음~그늘, 4(#333)는 윤곽선

    m = np.zeros((H, W), bool)
    m[oy:oy + nh, ox:ox + nw] = m_small
    gray = np.zeros((H, W), np.uint8)
    gray[oy:oy + nh, ox:ox + nw] = np.array(FISH_GRAYS)[idx]
    edge = m & ~nd.binary_erosion(m, border_value=0)
    gray[edge] = FISH_GRAYS[4]

    out = np.zeros((H, W, 4), np.uint8)
    out[..., 0] = out[..., 1] = out[..., 2] = np.where(m, gray, 0)
    out[..., 3] = m * 255
    Image.fromarray(out, 'RGBA').save(args.dst)
    print(f'{args.dst}: {W}x{H}, 물고기 {nw}x{nh}, 회색 5단계 (윤곽 #333)')


if __name__ == '__main__':
    main()
