"""Legacy chunky logo experiment; current intro uses tools/art/prepare-studio-logo.py.

Builds the old studio logo assets from the white master in docs/brand/.

Run with: python3 tools/make-logo.py   (needs Pillow: python3 -m pip install pillow)

Writes:
  docs/brand/logo-chain-shift-purple.png  full-size purple version of the master
  apps/game/public/assets/logo.png        the in-game pixel-art logo

The in-game logo is redrawn in the style of the game's title text: the master is reduced to
CHUNK_WIDTH blocks, each block drawn as CHUNK x CHUNK native pixels (like the title's scaled pixel
font), with a light top edge, a darker bottom edge, a drop shadow one block down-right and a 1 px
ink outline. Every pixel is a solid palette colour or fully transparent, so it scales up sharp.
"""

from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
MASTER = ROOT / "docs/brand/logo-chain-shift-white.png"
PURPLE_OUT = ROOT / "docs/brand/logo-chain-shift-purple.png"
GAME_OUT = ROOT / "apps/game/public/assets/logo.png"

# Violet #A35BFF: 5.3:1 contrast on the intro background (palette.black #07040F), above the
# WCAG AA 4.5:1 for text, while still reading clearly as purple.
PURPLE = 0xA35BFF
HIGHLIGHT = 0xD9C2FF  # top edge of each shape
LOWLIGHT = 0x7D3AD6  # bottom edge of each shape
SHADOW = 0x5A0B4A  # palette.shadow, the drop shadow under the game's title
INK = 0x1A0F2E  # palette.ink, outline
CHUNK_WIDTH = 94  # logo width in blocks
CHUNK = 2  # native pixels per block; 94 x 2 = 188 of the monitor's 216
THRESHOLD = 90  # a block is filled from this much coverage; below 128 keeps thin strokes (the S) readable


def rgb(c: int) -> tuple[int, int, int]:
    return (c >> 16) & 255, (c >> 8) & 255, c & 255


def shift(mask: Image.Image, dx: int, dy: int) -> Image.Image:
    # Masks carry enough empty border that offset's wrap-around never brings pixels back in.
    return ImageChops.offset(mask, dx, dy)


def grow(mask: Image.Image) -> Image.Image:
    out = mask
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        out = ImageChops.lighter(out, shift(mask, dx, dy))
    return out


def pixel_logo(alpha: Image.Image) -> Image.Image:
    alpha = alpha.crop(alpha.getbbox())
    rows = round(alpha.height * CHUNK_WIDTH / alpha.width)
    blocks = alpha.resize((CHUNK_WIDTH, rows), Image.BOX).point(lambda v: 255 if v >= THRESHOLD else 0)
    shape = blocks.resize((CHUNK_WIDTH * CHUNK, rows * CHUNK), Image.NEAREST)
    pad = CHUNK + 2
    m = Image.new("L", (shape.width + 2 * pad, shape.height + 2 * pad), 0)
    m.paste(shape, (pad, pad))

    shadow = shift(m, CHUNK, CHUNK)
    body = ImageChops.lighter(m, shadow)
    outline = ImageChops.subtract(grow(body), body)
    low = ImageChops.subtract(m, shift(m, 0, -2 * CHUNK))
    high = ImageChops.subtract(m, shift(m, 0, CHUNK))

    out = Image.new("RGBA", m.size, (0, 0, 0, 0))
    for layer, colour in ((outline, INK), (shadow, SHADOW), (m, PURPLE), (low, LOWLIGHT), (high, HIGHLIGHT)):
        out.paste(rgb(colour) + (255,), (0, 0), layer)
    return out.crop(out.getbbox())


def main() -> None:
    master = Image.open(MASTER).convert("RGBA")
    alpha = master.getchannel("A")

    purple = Image.new("RGBA", master.size, rgb(PURPLE) + (0,))
    purple.putalpha(alpha)
    purple.save(PURPLE_OUT, optimize=True)

    logo = pixel_logo(alpha)
    logo.save(GAME_OUT, optimize=True)
    print(f"Wrote {PURPLE_OUT.relative_to(ROOT)} and {GAME_OUT.relative_to(ROOT)} ({logo.width}x{logo.height})")


if __name__ == "__main__":
    main()
