#!/usr/bin/env python3
"""
물고기 겹 두 프레임(꼬리 왼쪽/오른쪽)을 가로로 붙여 겹 파일 하나로 만든다 (docs/fish-art.md).

  python packages/client/scripts/fish-strip.py 프레임0.png 프레임1.png 결과.png
  python packages/client/scripts/fish-strip.py 한장.png 결과.png          # 안 움직이는 겹: 같은 그림 두 번

두 프레임은 크기가 같아야 하고(16x10 또는 48x32), 몸통 위치가 같아야 한다(꼬리만 다르게).
필요: pip install pillow
"""
import sys
from PIL import Image

SIZES = {(16, 10), (48, 32)}


def main() -> None:
    args = sys.argv[1:]
    if len(args) not in (2, 3):
        print(__doc__)
        sys.exit(1)
    *srcs, dst = args
    frames = [Image.open(p).convert('RGBA') for p in srcs]
    if len(frames) == 1:
        frames = frames * 2
    w, h = frames[0].size
    if frames[1].size != (w, h):
        sys.exit(f'두 프레임 크기가 다릅니다: {frames[0].size} / {frames[1].size}')
    if (w, h) not in SIZES:
        print(f'주의: 규격 크기(16x10, 48x32)가 아닙니다: {w}x{h}')
    out = Image.new('RGBA', (w * 2, h), (0, 0, 0, 0))
    out.paste(frames[0], (0, 0))
    out.paste(frames[1], (w, 0))
    out.save(dst)
    print(f'{dst}: {w * 2}x{h} (2프레임)')


if __name__ == '__main__':
    main()
