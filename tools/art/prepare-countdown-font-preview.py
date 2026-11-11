"""Builds art/ui/countdown-font-v1/preview.html: the countdown dial with the current Arial digits
next to the menu font (m6x11) at whole-number scales, over real native fight frames (HUD included).

Usage, from the repository root: python tools/art/prepare-countdown-font-preview.py
Everything the page needs (menu font sheet, digit metrics, stage art) is inlined, so it opens
straight from disk. The dial geometry and colours copy HudView.drawTimer; the digits are the real
menu-font glyphs, so their pixels are exact. Nothing in the game is changed.
"""
import base64
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'apps/game/public/assets'
OUT = ROOT / 'art/ui/countdown-font-v1'


def data_url(path: Path) -> str:
    return 'data:image/png;base64,' + base64.b64encode(path.read_bytes()).decode()


def digit_ink() -> dict:
    """Ink box of each digit glyph inside its 16 px cell (row 2 of the 256 x 96 sheet)."""
    alpha = Image.open(ASSETS / 'menus/action/menu-font.png').split()[-1]
    ink = {}
    for d in range(10):
        x0, y0 = d * 16, 16
        box = alpha.crop((x0, y0, x0 + 16, y0 + 16)).getbbox()
        ink[str(d)] = {'x': x0 + box[0], 'y': y0 + box[1], 'w': box[2] - box[0], 'h': box[3] - box[1]}
    return ink


# Native fight frames just before the countdown, from tools/art/capture-countdown-backgrounds.mjs.
FRAMES = ROOT / 'art/ui/countdown-font-v1/backgrounds'
STAGES = {
    'City Rooftop': 'rooftop.png',
    'Storm Field': 'storm-field.png',
    'Sunset Harbor': 'sunset-harbor.png',
    'Lantern Courtyard': 'lantern-courtyard.png',
    'Foundry Floor': 'foundry-floor.png',
}

PAGE = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Countdown font preview</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; padding: 24px 16px 48px; background: #120e1f; color: #e9e4ff; font: 14px/1.5 system-ui, sans-serif; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  p { color: #b9b0d6; margin: 0 0 16px; max-width: 70ch; }
  .controls { display: flex; flex-wrap: wrap; gap: 16px; margin: 0 0 20px; align-items: center; }
  label { display: flex; gap: 8px; align-items: center; }
  select, button { font: inherit; color: inherit; background: #261d40; border: 1px solid #4d3f78; border-radius: 6px; padding: 6px 10px; }
  .grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
  figure { margin: 0; background: #1b1530; border: 1px solid #33295a; border-radius: 10px; padding: 12px; }
  figcaption { margin: 0 0 8px; font-weight: 600; }
  figcaption small { display: block; font-weight: 400; color: #a69cc8; }
  .row { display: flex; gap: 8px; flex-wrap: wrap; }
  canvas { image-rendering: pixelated; display: block; border-radius: 4px; }
</style>
</head>
<body>
<h1>Countdown font preview</h1>
<p>The top 52 rows of a real 192 &times; 240 fight frame, enlarged with nearest sampling, for 3, 2 and 1.
The digits are the real glyphs at whole-number scales; the dial copies <code>HudView.drawTimer</code>.
The CRT pass and the tick animation are not applied here.</p>
<div class="controls">
  <label>Stage <select id="stage"></select></label>
  <label>Enlargement <select id="zoom">
    <option value="2">2&times;</option><option value="3" selected>3&times; (about a phone)</option>
    <option value="4">4&times;</option><option value="6">6&times;</option>
  </select></label>
</div>
<div class="grid" id="grid"></div>
<script>
const FONT = "__FONT__";
const INK = __INK__;
const STAGES = __STAGES__;
const W = 192, H = 52, CX = 96, CY = 18;
const COLORS = { 3: '#ffdf70', 2: '#ffad39', 1: '#ff493b' };
const OUTLINE = '#100d1c', SHADOW = '#6b4525';

const VARIANTS = [
  { id: 'arial', title: 'Current: Arial Bold 26 px', note: 'What the game draws today' },
  { id: 'menu1', title: 'Menu font 1\\u00d7', note: '11 px digits, 1 px outline', scale: 1, outline: 1 },
  { id: 'menu2', title: 'Menu font 2\\u00d7, fine outline', note: '22 px digits, 1 px outline', scale: 2, outline: 1 },
  { id: 'menu2c', title: 'Menu font 2\\u00d7, chunky outline', note: '22 px digits, 2 px outline and shadow, like the damage numbers', scale: 2, outline: 2 },
  { id: 'menu3', title: 'Menu font 3\\u00d7', note: '33 px digits: taller than the 30 px dial', scale: 3, outline: 1 },
];

const load = (src) => new Promise((done) => { const i = new Image(); i.onload = () => done(i); i.src = src; });

/** One digit glyph, tinted, at a whole scale, as its own canvas. */
function glyph(font, digit, color, scale) {
  const g = INK[digit];
  const c = Object.assign(document.createElement('canvas'), { width: g.w * scale, height: g.h * scale });
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.drawImage(font, g.x, g.y, g.w, g.h, 0, 0, g.w * scale, g.h * scale);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color;
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

function drawDial(x, color) {
  x.fillStyle = 'rgba(16,13,28,0.94)';
  x.beginPath(); x.arc(CX, CY, 15, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(98,83,108,0.8)'; x.lineWidth = 1;
  x.beginPath(); x.arc(CX, CY, 15, 0, Math.PI * 2); x.stroke();
  const remaining = 0.62;
  x.strokeStyle = color; x.lineWidth = 2.5;
  x.beginPath(); x.arc(CX, CY, 16, -Math.PI / 2, -Math.PI / 2 + remaining * Math.PI * 2); x.stroke();
}

function drawArial(x, digit, color) {
  // Rendered at 1 texel per game pixel, then centred on its ink, as HudView does.
  const t = document.createElement('canvas'); t.width = 40; t.height = 40;
  const tx = t.getContext('2d');
  tx.font = 'bold 26px Arial, sans-serif'; tx.textBaseline = 'top'; tx.textAlign = 'center';
  tx.lineWidth = 1; tx.strokeStyle = OUTLINE; tx.fillStyle = color;
  tx.fillText(digit, 20, 4); tx.strokeText(digit, 20, 4);
  const px = tx.getImageData(0, 0, 40, 40).data;
  let l = 40, r = -1, tp = 40, b = -1;
  for (let yy = 0; yy < 40; yy++) for (let xx = 0; xx < 40; xx++) if (px[(yy * 40 + xx) * 4 + 3]) {
    l = Math.min(l, xx); r = Math.max(r, xx); tp = Math.min(tp, yy); b = Math.max(b, yy);
  }
  x.drawImage(t, Math.round(CX - (l + r + 1) / 2), Math.round(CY - (tp + b + 1) / 2));
}

function drawMenu(x, font, digit, color, v) {
  const g = INK[digit];
  const w = g.w * v.scale, h = g.h * v.scale;
  const left = Math.round(CX - w / 2), top = Math.round(CY - h / 2);
  const o = v.outline;
  const dark = glyph(font, digit, OUTLINE, v.scale);
  if (o === 2) x.drawImage(glyph(font, digit, SHADOW, v.scale), left + 2, top + 4);
  for (const [dx, dy] of [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, -o], [-o, o], [o, o]])
    if (o === 2 ? !(dx && dy) : true) x.drawImage(dark, left + dx, top + dy);
  x.drawImage(glyph(font, digit, color, v.scale), left, top);
}

async function render() {
  const font = await load(FONT);
  const stage = await load(STAGES[document.getElementById('stage').value]);
  const zoom = Number(document.getElementById('zoom').value);
  const grid = document.getElementById('grid');
  grid.replaceChildren();
  for (const v of VARIANTS) {
    const fig = document.createElement('figure');
    fig.innerHTML = `<figcaption>${v.title}<small>${v.note}</small></figcaption><div class="row"></div>`;
    for (const digit of ['3', '2', '1']) {
      const c = Object.assign(document.createElement('canvas'), { width: W, height: H });
      c.style.width = `${W * zoom}px`; c.style.maxWidth = '100%'; c.style.height = 'auto';
      const x = c.getContext('2d');
      x.imageSmoothingEnabled = false;
      x.drawImage(stage, 0, 0, W, H, 0, 0, W, H);
      drawDial(x, COLORS[digit]);
      if (v.id === 'arial') drawArial(x, digit, COLORS[digit]);
      else drawMenu(x, font, digit, COLORS[digit], v);
      fig.querySelector('.row').append(c);
    }
    grid.append(fig);
  }
}

const select = document.getElementById('stage');
for (const name of Object.keys(STAGES)) select.append(new Option(name, name));
select.onchange = render;
document.getElementById('zoom').onchange = render;
render();
</script>
</body>
</html>
'''


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    stages = {name: data_url(FRAMES / path) for name, path in STAGES.items()}
    page = (
        PAGE.replace('__FONT__', data_url(ASSETS / 'menus/action/menu-font.png'))
        .replace('__INK__', json.dumps(digit_ink()))
        .replace('__STAGES__', json.dumps(stages))
    )
    (OUT / 'preview.html').write_text(page, encoding='utf8')
    print('wrote', OUT / 'preview.html')


if __name__ == '__main__':
    main()
