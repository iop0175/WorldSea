"""Extract the supplied aquarium UI sheet into runtime PNG assets.

The source artwork uses a baked checkerboard rather than an alpha channel.  We
reconstruct that checkerboard from the image corners, remove it, then crop and
downsample the pieces needed by the 360x640 game UI.
"""

from pathlib import Path
from PIL import Image


WORKSPACE = Path(__file__).resolve().parents[4]
REPO = Path(__file__).resolve().parents[3]
SOURCE = WORKSPACE / "images" / "수족관 게임 UI 픽셀 아트 스프라이트 시트.png"
ICON_SOURCE = WORKSPACE / "images" / "상점·수족관·게 픽셀 아이콘 모음.png"
REFERENCE = WORKSPACE / "images" / "e325f3a9-4696-470b-bb50-65705db4a73b.png"
ASSETS = REPO / "packages" / "client" / "src" / "assets"


# Crop coordinates are in the current 595x420 transparent UI sheet.
# name: (folder, box, output size)
PIECES = {
    "avatar_default": ("icon", (17, 14, 73, 68), (24, 24)),
    "res_premium": ("icon", (176, 16, 223, 65), (12, 12)),
    "res_gold": ("icon", (282, 16, 324, 65), (12, 12)),
    "res_stamina": ("icon", (385, 15, 431, 66), (12, 12)),
    "res_ticket": ("icon", (477, 15, 527, 67), (12, 12)),
    "menu": ("icon", (548, 14, 595, 68), (14, 14)),
    "side_attend": ("icon", (30, 94, 72, 135), (22, 22)),
    "side_restore": ("icon", (27, 143, 75, 194), (22, 22)),
    "side_bag": ("icon", (108, 91, 151, 132), (22, 22)),
    "side_friends": ("icon", (104, 142, 154, 194), (22, 22)),
    "asia_fresh": ("ui/region", (17, 272, 172, 340), (84, 52)),
    "card_complete_bg": ("ui", (175, 272, 308, 340), (84, 52)),
    "card_locked_bg": ("ui", (311, 272, 452, 340), (84, 52)),
    "card_locked_red_bg": ("ui", (454, 272, 595, 340), (84, 52)),
}

# The dedicated icon strip has a real alpha channel and cleaner, larger art.
# These five replace the smaller bottom-navigation crops from the UI sheet.
ICON_STRIP_PIECES = {
    "tab_shop": ((35, 170, 390, 530), (32, 32)),
    "tab_farm": ((400, 170, 770, 530), (32, 32)),
    "tab_expedition": ((780, 170, 1130, 530), (32, 32)),
    "tab_dex": ((1490, 170, 1800, 530), (32, 32)),
    "tab_store": ((1810, 170, 2165, 530), (32, 32)),
}


def remove_checker(image: Image.Image) -> Image.Image:
    """Turn the sheet's white/grey checkerboard into transparency."""
    rgba = image.convert("RGBA")
    if rgba.getchannel("A").getextrema()[0] < 255:
        return rgba
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, _ = pixels[x, y]
            # The checker is neutral and very bright. Keeping the threshold
            # narrow preserves white highlights inside the outlined sprites.
            if max(r, g, b) - min(r, g, b) <= 2 and 196 <= r <= 255:
                pixels[x, y] = (r, g, b, 0)
    return rgba


def main() -> None:
    sheet = remove_checker(Image.open(SOURCE))
    for name, (folder, box, size) in PIECES.items():
        target_dir = ASSETS / folder
        target_dir.mkdir(parents=True, exist_ok=True)
        crop = sheet.crop(box)
        crop.thumbnail(size, Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", size)
        canvas.alpha_composite(crop, ((size[0] - crop.width) // 2, (size[1] - crop.height) // 2))
        canvas.save(target_dir / f"{name}.png", optimize=True)

    icon_sheet = Image.open(ICON_SOURCE).convert("RGBA")
    icon_dir = ASSETS / "icon"
    icon_dir.mkdir(parents=True, exist_ok=True)
    for name, (box, size) in ICON_STRIP_PIECES.items():
        crop = icon_sheet.crop(box)
        alpha_box = crop.getchannel("A").getbbox()
        if alpha_box is None:
            raise ValueError(f"No visible pixels found for {name}")
        crop = crop.crop(alpha_box)
        crop.thumbnail(size, Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", size)
        canvas.alpha_composite(crop, ((size[0] - crop.width) // 2, (size[1] - crop.height) // 2))
        canvas.save(icon_dir / f"{name}.png", optimize=True)

    # The supplied mockup is also the art-direction source for the shop room.
    # Keep only the playable scene band; React renders all HUD text and controls.
    reference = Image.open(REFERENCE).convert("RGB")
    scene = reference.crop((0, 98, reference.width, 1336))
    scene = scene.resize((360, 462), Image.Resampling.LANCZOS)
    bg_dir = ASSETS / "bg"
    bg_dir.mkdir(parents=True, exist_ok=True)
    scene.save(bg_dir / "hub_stage1.png", optimize=True)


if __name__ == "__main__":
    main()
