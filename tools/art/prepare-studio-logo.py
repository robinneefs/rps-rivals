"""Native 1x studio logo and a silhouette-clipped sheen, from the original brand master."""
from pathlib import Path
import json
import shutil
from PIL import Image, ImageChops

root = Path(__file__).resolve().parents[2]
out = root / 'art/brand/chain-shift-v2'
production = root / 'apps/game/public/assets'
out.mkdir(parents=True, exist_ok=True)
legacy = out / 'legacy-logo.png'
if not legacy.exists():
    shutil.copy2(production / 'logo.png', legacy)
source = root / 'docs/brand/logo-chain-shift-white.png'
alpha = Image.open(source).convert('RGBA').getchannel('A')
bounds = alpha.getbbox()
crop = alpha.crop(bounds)
w = 164
h = round(crop.height * w / crop.width)
shape = crop.resize((w, h), Image.Resampling.BOX).point(lambda v: 255 if v >= 112 else 0)
mask = Image.new('L', (w + 4, h + 4))
mask.paste(shape, (2, 2))
logo = Image.new('RGBA', mask.size)

# Restrained purple bevel/shadow, all on the true one-pixel grid.
shift = lambda dx, dy: ImageChops.offset(mask, dx, dy)
outline = mask.copy()
for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
    outline = ImageChops.lighter(outline, shift(dx, dy))
logo.paste((40, 14, 66, 255), (0, 0), outline)
logo.paste((78, 30, 130, 255), (0, 0), shift(1, 1))
for y in range(h + 4):
    t = min(1, max(0, (y - 2) / max(1, h - 1)))
    color = tuple(round(a + (b - a) * t) for a, b in zip((217, 194, 255), (155, 83, 245)))
    for x in range(w + 4):
        if mask.getpixel((x, y)):
            logo.putpixel((x, y), (*color, 255))
logo.save(out / 'logo.png')
logo.save(production / 'logo.png')

count = 24
sheet = Image.new('RGBA', (logo.width * count, logo.height))
frames = {}
for frame in range(count):
    image = Image.new('RGBA', logo.size)
    sweep = -34 + frame / (count - 1) * (logo.width + 68)
    for y in range(logo.height):
        for x in range(logo.width):
            distance = abs(x + y * 0.4 - sweep)
            if mask.getpixel((x, y)) and distance < 15:
                strength = 190 if distance < 4 else 100 if distance < 9 else 35
                image.putpixel((x, y), (255, 249, 234, strength))
    sheet.paste(image, (frame * logo.width, 0))
    frames[f'sheen{frame}'] = {
        'frame': {'x': frame * logo.width, 'y': 0, 'w': logo.width, 'h': logo.height},
        'rotated': False, 'trimmed': False,
        'spriteSourceSize': {'x': 0, 'y': 0, 'w': logo.width, 'h': logo.height},
        'sourceSize': {'w': logo.width, 'h': logo.height},
    }
sheet.save(out / 'logo-sheen.png')
sheet.save(production / 'logo-sheen.png')
atlas = {'frames': frames, 'meta': {'image': 'logo-sheen.png', 'scale': '1'}}
for folder in [out, production]:
    (folder / 'logo-sheen.json').write_text(json.dumps(atlas, indent=2))
(out / 'preparation.json').write_text(json.dumps({
    'source': str(source.relative_to(root)), 'sourceBounds': bounds,
    'nativeSize': logo.size, 'screen': [192, 240], 'horizontalMargin': (192-logo.width)//2,
    'method': 'native BOX coverage, binary alpha threshold112, 1px gradient/bevel; no enlarged pixel blocks',
    'sheenFrames': count,
}, indent=2))
print(f'Prepared studio logo {logo.width}x{logo.height}, {count} native sheen frames; master unchanged.')
