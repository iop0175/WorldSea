#!/usr/bin/env python3
"""
생성 도구로 만든 '픽셀 느낌' 이미지를 게임용 진짜 픽셀아트로 정리한다.

  python packages/client/scripts/pixelize.py 원본.png 결과.png --size 158x136 [--colors 32] [--align bottom]

하는 일
1. 투명 영역(또는 --bg 로 지정한 배경색)을 잘라낸다
2. 비율을 유지한 채 목표 크기 안에 맞게 줄인다 (면적 평균 → 점 크기가 고르게)
3. 색 수를 줄인다 (기본 32색)
4. 반투명 가장자리를 완전 투명/완전 불투명으로 정리한다
5. 목표 크기 캔버스에 놓는다 (기본: 아래 가운데. 바닥에 서는 객체 기준)

필요: pip install pillow
"""
import argparse
from PIL import Image


def parse_size(text: str) -> tuple[int, int]:
    w, h = text.lower().split('x')
    return int(w), int(h)


def remove_bg(img: Image.Image, color: tuple[int, int, int], tol: int) -> Image.Image:
    """배경이 투명이 아닌 이미지(흰 배경 등)에서 배경색을 투명으로"""
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if abs(r - color[0]) <= tol and abs(g - color[1]) <= tol and abs(b - color[2]) <= tol:
                px[x, y] = (0, 0, 0, 0)
    return img


def main() -> None:
    ap = argparse.ArgumentParser(description='생성 이미지를 게임용 픽셀아트로 정리')
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--size', required=True, help='목표 크기 (게임 해상도 360x640 기준), 예: 158x136')
    ap.add_argument('--colors', type=int, default=32, help='최대 색 수 (기본 32)')
    ap.add_argument('--align', choices=['bottom', 'center', 'top', 'stretch'], default='bottom',
                    help='캔버스 안 위치. stretch는 비율 무시하고 꽉 채움 (배경·UI 틀)')
    ap.add_argument('--bg', help='투명으로 바꿀 배경색 (예: ffffff)')
    ap.add_argument('--tol', type=int, default=24, help='--bg 허용 오차')
    ap.add_argument('--opaque', action='store_true', help='투명 처리 없이 불투명 이미지로 (배경 이미지용)')
    args = ap.parse_args()

    tw, th = parse_size(args.size)
    img = Image.open(args.src).convert('RGBA')

    if args.bg:
        c = args.bg.lstrip('#')
        img = remove_bg(img, (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16)), args.tol)

    if not args.opaque:
        bbox = img.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox()
        if bbox:
            img = img.crop(bbox)

    if args.align == 'stretch' or args.opaque:
        nw, nh = tw, th
    else:
        scale = min(tw / img.width, th / img.height)
        nw, nh = max(1, round(img.width * scale)), max(1, round(img.height * scale))
    small = img.resize((nw, nh), Image.Resampling.BOX)

    # 알파 정리 + 색 수 줄이기 (투명 픽셀은 색 계산에서 제외)
    alpha = small.getchannel('A').point(lambda a: 255 if (args.opaque or a >= 128) else 0)
    rgb = small.convert('RGB')
    quant = rgb.quantize(colors=args.colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    out_obj = quant.convert('RGBA')
    out_obj.putalpha(alpha)

    canvas = Image.new('RGBA', (tw, th), (0, 0, 0, 0))
    x = (tw - nw) // 2
    y = {'bottom': th - nh, 'center': (th - nh) // 2, 'top': 0, 'stretch': 0}[args.align]
    canvas.paste(out_obj, (x, y), out_obj)
    canvas.save(args.dst)
    data = canvas.get_flattened_data() if hasattr(canvas, 'get_flattened_data') else canvas.getdata()
    colors = len(set(p for p in data if p[3] > 0))
    print(f'{args.dst}: {tw}x{th}, 객체 {nw}x{nh}, 색 {colors}개')


if __name__ == '__main__':
    main()
