"""
Turns the ChatGPT art in art/source/ into the game's cabinet files (v2.0 look).

    python3 tools/art/build-cabinet.py        (needs Pillow and numpy)

Writes apps/game/public/assets/cabinet/*.webp and assets/stages/rooftop.png, and prints the
geometry that apps/game/src/cabinet/geometry.ts holds. All geometry is in "cabinet units": pixels
of the original cabinet body image (941 x 1672), whatever resolution each file is saved at.
"""

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "art" / "source"
OUT = ROOT / "apps" / "game" / "public" / "assets" / "cabinet"
STAGES = ROOT / "apps" / "game" / "public" / "assets" / "stages"

# the body image's screen opening (magenta in the source) and empty marquee box, in cabinet units
SCREEN = (162, 322, 616, 767)
MARQUEE_BOX = (104, 44, 733, 165)
# how far the base is drawn on below the image, so tall phones never show the room under the cabinet
BASE_EXTRA = 700
BODY_SCALE = 2


def rgba(path: Path) -> np.ndarray:
    return np.asarray(Image.open(path).convert("RGBA")).astype(np.float32)


def key_green(a: np.ndarray) -> np.ndarray:
    """Flat #00FF00 background to transparent, with a soft edge and the green spill removed."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    spill = g - np.maximum(r, b)
    alpha = 1 - np.clip((spill - 40) / 90, 0, 1)
    out = a.copy()
    out[..., 1] = np.minimum(g, np.maximum(r, b) + 10)  # despill
    out[..., 3] = a[..., 3] * alpha
    return out


def key_magenta(a: np.ndarray, box: tuple[int, int, int, int]) -> np.ndarray:
    x, y, w, h = box
    sub = a[y - 4 : y + h + 4, x - 4 : x + w + 4]
    r, g, b = sub[..., 0], sub[..., 1], sub[..., 2]
    mag = np.minimum(r, b) - g
    sub[..., 3] *= 1 - np.clip((mag - 60) / 80, 0, 1)
    return a


def save(a: np.ndarray, name: str, size: tuple[int, int] | None = None, quality: int = 90) -> Image.Image:
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")
    if size:
        im = im.resize(size, Image.LANCZOS)
    im.save(OUT / name, quality=quality, method=6)
    return im


def body() -> None:
    a = key_magenta(key_green(rgba(SRC / "cabinet-body.webp")), SCREEN)
    h = a.shape[0]
    a = np.concatenate([a, np.repeat(a[h - 2 : h - 1], BASE_EXTRA, axis=0)], axis=0)
    W, H = a.shape[1], a.shape[0]
    save(a, "body.webp", (W * BODY_SCALE, H * BODY_SCALE))
    print(f"body: {W} x {H} units")


def marquee() -> None:
    src = Image.open(SRC / "marquee.webp").convert("RGB")
    a = np.asarray(src).astype(np.int32)
    green = (a[..., 1] > 170) & (a[..., 0] < 150) & (a[..., 2] < 150)
    rows = np.where(green.mean(axis=1) < 0.1)[0]
    strip = src.crop((0, int(rows[0]), src.width, int(rows[-1]) + 1))
    _, _, bw, bh = MARQUEE_BOX
    scale = max(bw / strip.width, bh / strip.height)
    w, h = round(bw / scale), round(bh / scale)
    strip = strip.crop(((strip.width - w) // 2, (strip.height - h) // 2, (strip.width + w) // 2, (strip.height + h) // 2))
    strip.resize((bw * 2, bh * 2), Image.LANCZOS).save(OUT / "marquee.webp", quality=90, method=6)
    print(f"marquee: box {MARQUEE_BOX}")


def buttons() -> None:
    a = key_green(rgba(SRC / "buttons.webp"))
    opaque = a[..., 3] > 128
    for i, move in enumerate(["rock", "paper", "scissors"]):
        x0, x1 = i * 512, (i + 1) * 512
        frames = {}
        for state, (y0, y1) in {"up": (60, 430), "down": (440, 770)}.items():
            ys, xs = np.where(opaque[y0:y1, x0:x1])
            frames[state] = (x0 + xs.min(), x0 + xs.max(), y0 + ys.min(), y0 + ys.max())
        # both states share one box size, lined up on the ring's centre and bottom edge, so a press
        # only drops the cap
        half = max(f[1] - f[0] for f in frames.values()) // 2 + 6
        height = frames["up"][3] - frames["up"][2] + 12
        for state, (left, right, _, bottom) in frames.items():
            cx = (left + right) // 2
            save(a[bottom + 6 - height : bottom + 6, cx - half : cx + half], f"button-{move}-{state}.webp")
        ys, xs = np.where(opaque[780:950, x0:x1])
        save(a[780 + ys.min() - 4 : 780 + ys.max() + 5, x0 + xs.min() - 4 : x0 + xs.max() + 5], f"label-{move}.webp")
    print(f"buttons: frame {2 * half} x {height} px, ring bottom 6 px above the bottom")


def joystick() -> None:
    """
    The source has two columns: up-left / left / down-left, and up / centre / down. The right-hand
    directions are the left ones mirrored, so both sides look exactly alike. Every frame puts the
    base's centre and bottom edge on the same point, so swapping frames only moves the stick.
    """
    a = key_green(rgba(SRC / "joystick.webp"))
    H, W = a.shape[:2]
    dark = (a[..., :3].max(axis=2) < 70) & (a[..., 3] > 128)
    size, bx, by = 560, 280, 430
    cells = {"ul": (0, 0), "l": (1, 0), "dl": (2, 0), "u": (0, 1), "c": (1, 1), "d": (2, 1)}
    def dark_in(r: int, c: int) -> tuple[np.ndarray, np.ndarray]:
        return np.where(dark[r * H // 3 : (r + 1) * H // 3, c * W // 2 : (c + 1) * W // 2])

    # the base's width, from the stick at rest; a leaning ball can stick out past the base's left
    # edge, so each base is placed by its right edge, which is always in view
    ys, xs = dark_in(1, 1)
    base_w = xs.max() - xs.min() + 1
    frames = {}
    for name, (r, c) in cells.items():
        y0, x0 = r * H // 3, c * W // 2
        cell = a[y0 : (r + 1) * H // 3, x0 : (c + 1) * W // 2]
        ys, xs = dark_in(r, c)
        # (the middle column leans only up and down, so there the base's own middle is exact)
        cx = (xs.min() + xs.max()) // 2 if c == 1 else xs.max() - base_w // 2
        bottom = ys.max()
        frame = np.zeros((size, size, 4), np.float32)
        top, left = by - bottom, bx - cx
        ch, cw = cell.shape[:2]
        sy0, sx0 = max(0, -top), max(0, -left)
        sy1, sx1 = min(ch, size - top), min(cw, size - left)
        frame[top + sy0 : top + sy1, left + sx0 : left + sx1] = cell[sy0:sy1, sx0:sx1]
        frames[name] = frame
    for name, src in {"ur": "ul", "r": "l", "dr": "dl"}.items():
        frames[name] = frames[src][:, ::-1]
    for name, frame in frames.items():
        save(frame, f"joystick-{name}.webp")
    print(f"joystick: frames {size} px square, base centre x {bx}, base bottom y {by}, base {base_w} px wide")


def room() -> None:
    Image.open(SRC / "room.webp").convert("RGB").save(OUT / "room.webp", quality=82, method=6)


def stage() -> None:
    im = Image.open(SRC / "stage-rooftop.webp").convert("RGB").resize((288, 360), Image.BOX)
    im.quantize(40, dither=Image.Dither.NONE).convert("RGB").save(STAGES / "rooftop.png", optimize=True)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    STAGES.mkdir(parents=True, exist_ok=True)
    body()
    marquee()
    buttons()
    joystick()
    room()
    stage()
