"""The game's icons and link-preview card, built from its own art.

Usage, from the repository root:
  python tools/art/prepare-brand-icons.py            options only: art/brand/icons-v2/ + preview.html
  python tools/art/prepare-brand-icons.py --install  also writes the chosen designs into the game

The options are three icons (Taiko, the Rock button, the title lettering) and two 1200 x 630
cards, compared at real sizes on light and dark tab bars and as a chat embed. Chosen on
11 November 2026: the Rock button icon and the logo-and-gameplay card. --install writes the
browser favicon and Apple touch icon, the link-preview card (share-v2.png, a new name so chat
apps don't serve their cached copy of the old share.png), the Android launcher icons and splash
screens in every density, and the Play Store icon and feature graphic.
"""
import sys
import base64
import io
import math
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'apps/game/public/assets'
ACTION = ASSETS / 'menus/action'
OUT = ROOT / 'art/brand/icons-v2'
SHOTS = ROOT / 'docs/screenshots'

INK = (26, 11, 46)  # deep menu purple
BURST = [(255, 45, 111), (37, 201, 255), (255, 210, 31), (140, 60, 255)]


def burst(size: int, seed: int = 3) -> Image.Image:
    """Deep purple with marquee-style rays from the centre."""
    w, h = (size, size) if isinstance(size, int) else size
    img = Image.new('RGB', (w, h), INK)
    d = ImageDraw.Draw(img, 'RGBA')
    cx, cy, r = w / 2, h / 2, math.hypot(w, h)
    for i in range(36):
        a = (i / 36) * math.tau + (seed * 0.37 if i % 2 else 0)
        spread = 0.045 + 0.03 * ((i * 7 + seed) % 3)
        color = BURST[(i * 5 + seed) % len(BURST)]
        alpha = 95 if i % 3 else 55
        d.polygon(
            [(cx, cy), (cx + math.cos(a - spread) * r, cy + math.sin(a - spread) * r),
             (cx + math.cos(a + spread) * r, cy + math.sin(a + spread) * r)],
            fill=color + (alpha,),
        )
    glow = Image.new('L', (w, h), 0)
    ImageDraw.Draw(glow).ellipse((cx - w * 0.42, cy - h * 0.42, cx + w * 0.42, cy + h * 0.42), fill=255)
    glow = glow.filter(ImageFilter.GaussianBlur(min(w, h) * 0.18))
    img = Image.composite(Image.new('RGB', (w, h), INK), img, glow.point(lambda v: int(v * 0.55)))
    return img


def rounded(img: Image.Image, radius: float) -> Image.Image:
    mask = Image.new('L', img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, img.width - 1, img.height - 1), radius, fill=255)
    out = img.convert('RGBA')
    out.putalpha(mask)
    return out


def nearest(img: Image.Image, scale: int) -> Image.Image:
    return img.resize((img.width * scale, img.height * scale), Image.NEAREST)


def place(base: Image.Image, art: Image.Image, cx: float, cy: float) -> None:
    base.alpha_composite(art, (round(cx - art.width / 2), round(cy - art.height / 2)))


def outline(art: Image.Image, px: int, color=(10, 6, 18, 255)) -> Image.Image:
    """A dark rim around the art so it stays separate from the burst at small sizes."""
    a = art.split()[-1].filter(ImageFilter.MaxFilter(px * 2 + 1))
    rim = Image.new('RGBA', art.size, color)
    rim.putalpha(a)
    rim.alpha_composite(art)
    return rim


def pad(art: Image.Image, px: int) -> Image.Image:
    out = Image.new('RGBA', (art.width + px * 2, art.height + px * 2))
    out.alpha_composite(art, (px, px))
    return out


# ---------- icon options (512 px masters) ----------

def icon_taiko() -> Image.Image:
    tile = burst(512).convert('RGBA')
    rest = Image.open(ACTION / 'taiko-sheet.png').convert('RGBA').crop((0, 0, 192, 240))
    face = nearest(rest.crop((88, 16, 192, 120)), 4)  # hair, headband, eyes and goatee
    # A round portrait: gold rim, dark ring, the face clipped to a circle on a warm backdrop.
    d = 432
    disc = Image.new('RGBA', (d, d), (120, 28, 52, 255))
    disc.alpha_composite(face, ((d - face.width) // 2, (d - face.height) // 2 + 6))
    mask = Image.new('L', (d, d), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, d - 1, d - 1), fill=255)
    disc.putalpha(mask)
    ring = Image.new('RGBA', (d + 32, d + 32))
    ImageDraw.Draw(ring).ellipse((0, 0, d + 31, d + 31), fill=(255, 210, 31, 255))
    ImageDraw.Draw(ring).ellipse((8, 8, d + 23, d + 23), fill=(10, 6, 18, 255))
    ring.alpha_composite(disc, (16, 16))
    place(tile, ring, 256, 256)
    return rounded(tile, 96)


def rock_button(width: int) -> Image.Image:
    button = Image.open(ASSETS / 'cabinet/button-rock-up.webp').convert('RGBA')
    return button.resize((width, round(width * button.height / button.width)), Image.LANCZOS)


def icon_button(corner: float = 96) -> Image.Image:
    """The chosen icon. corner=0 gives the full square, for platforms that round it themselves."""
    tile = burst(512, seed=5).convert('RGBA')
    place(tile, rock_button(470), 256, 266)
    return rounded(tile, corner) if corner else tile


def icon_logo() -> Image.Image:
    tile = burst(512, seed=1).convert('RGBA')
    logo = Image.open(ACTION / 'logo.png').convert('RGBA')
    place(tile, outline(pad(nearest(logo, 3), 10), 6), 256, 256)
    return rounded(tile, 96)


ICONS = {'taiko': ('Taiko', icon_taiko), 'button': ('Rock button', icon_button), 'logo': ('Title lettering', icon_logo)}


def small(icon: Image.Image, size: int) -> Image.Image:
    return icon.resize((size, size), Image.LANCZOS)


# ---------- menu font (m6x11 bitmap) ----------

def font_glyphs():
    sheet = Image.open(ACTION / 'menu-font.png').convert('RGBA')
    fnt = (ACTION / 'menu-font.fnt').read_text()
    glyphs = {}
    for m in re.finditer(r'<char id="(\d+)" x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" xoffset="(-?\d+)" yoffset="(-?\d+)" xadvance="(\d+)"', fnt):
        cid, x, y, w, h, xo, yo, adv = map(int, m.groups())
        glyphs[chr(cid)] = (sheet.crop((x, y, x + w, y + h)) if w and h else None, xo, yo, adv)
    return glyphs


GLYPHS = font_glyphs()


def menu_text(text: str, color, scale: int, shadow=(10, 6, 18)) -> Image.Image:
    width = sum(GLYPHS[c][3] for c in text) + 2
    img = Image.new('RGBA', (width, 16))
    for layer, (dx, dy) in ((shadow, (1, 1)), (color, (0, 0))):
        x = 0
        for c in text:
            g, xo, yo, adv = GLYPHS[c]
            if g is not None:
                tint = Image.new('RGBA', g.size, layer + (255,))
                tint.putalpha(g.split()[-1])
                img.alpha_composite(tint, (x + xo + dx, yo + dy))
            x += adv
    return nearest(img.crop(img.getbbox()), scale)


# ---------- link-preview cards (1200 x 630) ----------

def card_marquee() -> Image.Image:
    card = burst((1200, 630), seed=2).convert('RGBA')
    art = Image.open(ROOT / 'art/cabinet/marquee-v7/source.png').convert('RGBA')
    art = art.resize((1200, round(1200 * art.height / art.width)), Image.LANCZOS)
    card.alpha_composite(art, (0, 0))
    band = Image.new('RGBA', (1200, 630 - art.height), INK + (255,))
    card.alpha_composite(band, (0, art.height))
    line = menu_text('ROCK  PAPER  SCISSORS  FIGHT!', (255, 223, 112), 4)
    place(card, line, 600, art.height + 62)
    sub = menu_text('3 FIGHTERS  5 STAGES  VS CPU OR ONLINE', (233, 228, 255), 3)
    place(card, sub, 600, art.height + 140)
    return card.convert('RGB')


def monitor(shot: str, height: int) -> Image.Image:
    """The monitor area of a phone screenshot, framed like the cabinet bezel."""
    im = Image.open(SHOTS / shot).convert('RGBA').crop((186, 756, 984, 1754))
    im = im.resize((round(height * im.width / im.height), height), Image.LANCZOS)
    frame = Image.new('RGBA', (im.width + 16, im.height + 16), (12, 8, 22, 255))
    frame.alpha_composite(im, (8, 8))
    return frame


def card_screens() -> Image.Image:
    """The chosen link-preview card."""
    card = burst((1200, 630), seed=4).convert('RGBA')
    logo = outline(pad(nearest(Image.open(ACTION / 'logo.png').convert('RGBA'), 4), 10), 6)
    place(card, logo, 250, 200)
    place(card, menu_text('ROCK PAPER SCISSORS', (255, 223, 112), 3), 250, 380)
    place(card, menu_text('ARCADE FIGHTER', (255, 223, 112), 3), 250, 425)
    place(card, menu_text('VS CPU OR ONLINE', (233, 228, 255), 2), 250, 505)
    place(card, menu_text('FREE IN YOUR BROWSER', (233, 228, 255), 2), 250, 540)
    for i, shot in enumerate(['phone-versus.webp', 'phone-ko.webp']):
        place(card, monitor(shot, 430), 680 + i * 340, 315)
    return card.convert('RGB')


CARDS = {'marquee': ('Marquee art', card_marquee), 'screens': ('Logo and gameplay', card_screens)}


def data_url(img: Image.Image, fmt='PNG') -> str:
    buf = io.BytesIO()
    img.save(buf, fmt, **({'quality': 90} if fmt == 'JPEG' else {}))
    return f'data:image/{fmt.lower()};base64,' + base64.b64encode(buf.getvalue()).decode()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    icons = {}
    for key, (_, make) in ICONS.items():
        icon = make()
        icon.save(OUT / f'icon-{key}-512.png')
        icons[key] = icon
    cards = {}
    for key, (_, make) in CARDS.items():
        card = make()
        card.save(OUT / f'share-{key}.png')
        cards[key] = card

    rows = []
    for key, (title, _) in ICONS.items():
        sizes = ''.join(
            f'<figure><img src="{data_url(small(icons[key], s))}" width="{s}" height="{s}"><figcaption>{s}</figcaption></figure>'
            for s in (16, 32, 64, 180)
        )
        tabs = ''.join(
            f'<div class="tab {mode}"><img src="{data_url(small(icons[key], 32))}" width="16" height="16">'
            f'<span>RPS Rivals: Rock Paper Sci…</span></div>'
            for mode in ('light', 'dark')
        )
        rows.append(f'<section><h2>Icon: {title}</h2><div class="sizes">{sizes}</div><div class="tabs">{tabs}</div></section>')
    for key, (title, _) in CARDS.items():
        rows.append(
            f'<section><h2>Link preview: {title}</h2><div class="embed"><div class="site">RPS Rivals</div>'
            f'<a>RPS Rivals: Rock Paper Scissors Fighter</a><p>__DESC__</p>'
            f'<img src="{data_url(cards[key].resize((432, 227), Image.LANCZOS))}"></div></section>'
        )
    page = PAGE.replace('__ROWS__', '\n'.join(rows)).replace('__DESC__', DESCRIPTION)
    (OUT / 'preview.html').write_text(page, encoding='utf8')
    print('wrote', OUT)


DESCRIPTION = (
    'Pick Taiko, Riot or Anchor and outguess your rival in a pixel-art arcade fighter built on rock '
    'paper scissors. Five stages, vs the CPU or a friend online. Free in your browser.'
)

PAGE = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Icon options</title>
<style>
  body { margin: 0; padding: 24px 16px 48px; background: #120e1f; color: #e9e4ff; font: 14px/1.5 system-ui, sans-serif; }
  h1 { font-size: 20px; margin: 0 0 4px; } h2 { font-size: 15px; margin: 0 0 12px; }
  section { background: #1b1530; border: 1px solid #33295a; border-radius: 10px; padding: 16px; margin: 0 0 20px; }
  .sizes { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 20px; }
  figure { margin: 0; text-align: center; } figcaption { color: #a69cc8; font-size: 12px; }
  .tabs { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
  .tab { display: flex; gap: 8px; align-items: center; padding: 8px 12px; border-radius: 8px 8px 0 0; width: 220px; font: 12px system-ui; }
  .tab.light { background: #fff; color: #222; } .tab.dark { background: #35363a; color: #e8eaed; }
  .embed { background: #2b2d31; border-left: 4px solid #ff2d6f; border-radius: 4px; padding: 12px 16px; max-width: 432px; color: #dbdee1; }
  .embed .site { font-size: 12px; color: #b5bac1; } .embed a { color: #00a8fc; font-weight: 600; display: block; margin: 4px 0; }
  .embed p { margin: 0 0 12px; font-size: 13px; } .embed img { display: block; width: 100%; height: auto; border-radius: 4px; }
</style></head><body>
<h1>Icon and link preview options</h1>
<p>Each icon at the sizes browsers and phones show, on light and dark tab bars, then the link preview as a chat app would embed it.</p>
__ROWS__
</body></html>
'''

# ---------- install the chosen designs ----------

GAME = ROOT / 'apps/game/public'
RES = ROOT / 'apps/android/android/app/src/main/res'
STORE = ROOT / 'play-store'
DENSITIES = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
SPLASH = {'mdpi': (320, 480), 'hdpi': (480, 800), 'xhdpi': (720, 1280), 'xxhdpi': (960, 1600), 'xxxhdpi': (1280, 1920)}


def write(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)
    print('wrote', path.relative_to(ROOT))


def splash(w: int, h: int) -> Image.Image:
    """The marquee on the deep menu purple."""
    img = Image.new('RGB', (w, h), INK)
    marquee = Image.open(ASSETS / 'cabinet/marquee-v7.png').convert('RGBA')
    mw = round(min(w, h) * 0.8)
    marquee = marquee.resize((mw, round(mw * marquee.height / marquee.width)), Image.LANCZOS)
    img.paste(marquee, ((w - marquee.width) // 2, (h - marquee.height) // 2), marquee)
    return img


def install() -> None:
    square = icon_button(corner=0)
    tile = icon_button()
    write(tile.resize((64, 64), Image.LANCZOS), GAME / 'favicon.png')
    # iOS rounds the corners itself and shows any transparency as black, so give it the full square.
    write(square.convert('RGB').resize((180, 180), Image.LANCZOS), GAME / 'apple-touch-icon.png')
    card = card_screens()
    write(card, GAME / 'share-v2.png')
    # Android: the adaptive icon is the button on @color/ic_launcher_background (INK), inside the
    # 66 dp safe zone of the 108 dp layer; older launchers get the rounded and round tiles.
    for d, k in DENSITIES.items():
        fg = Image.new('RGBA', (round(108 * k), round(108 * k)))
        place(fg, rock_button(round(62 * k)), fg.width / 2, fg.height / 2 + k)
        write(fg, RES / f'mipmap-{d}/ic_launcher_foreground.png')
        size = round(48 * k)
        write(tile.resize((size, size), Image.LANCZOS), RES / f'mipmap-{d}/ic_launcher.png')
        circle = square.resize((size, size), Image.LANCZOS)
        mask = Image.new('L', (size, size), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
        circle.putalpha(mask)
        write(circle, RES / f'mipmap-{d}/ic_launcher_round.png')
        w, h = SPLASH[d]
        write(splash(w, h), RES / f'drawable-port-{d}/splash.png')
        write(splash(h, w), RES / f'drawable-land-{d}/splash.png')
    write(splash(480, 320), RES / 'drawable/splash.png')
    background = RES / 'values/ic_launcher_background.xml'
    background.write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
        f'    <color name="ic_launcher_background">#{INK[0]:02X}{INK[1]:02X}{INK[2]:02X}</color>\n</resources>\n'
    )
    # Play Store: Google Play masks the 512 px icon itself; the 1024 x 500 banner is the card,
    # trimmed top and bottom to the banner's wider shape.
    write(square.convert('RGB'), STORE / 'icon-512.png')
    trim = round((630 - 1200 * 500 / 1024) / 2)
    write(card.crop((0, trim, 1200, 630 - trim)).resize((1024, 500), Image.LANCZOS), STORE / 'feature-graphic.png')


if __name__ == '__main__':
    main()
    if '--install' in sys.argv:
        install()
