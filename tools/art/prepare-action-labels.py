"""Native pixel lettering: Jersey10 for v1, upright Pixelify Sans Bold20px for v2."""
from pathlib import Path
import sys
import re
import json
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[2]
v2 = '--v2' in sys.argv
output = root / f'art/menus/action-{"v2" if v2 else "v1"}/native'
labels = [('cpu', 'PLAY VERSUS CPU'), ('online', 'PLAY ONLINE'), ('options', 'OPTIONS')]
for size in ([14, 16, 18, 20] if v2 else [24]):
    font = ImageFont.truetype(str(root / ('art/fonts/pixelify-sans/PixelifySans.ttf' if v2 else 'art/fonts/jersey-10/Jersey10-Regular.ttf')), size)
    if v2:
        font.set_variation_by_axes([700])
    sheet = Image.new('RGBA', (176, 120))
    for index, (name, label) in enumerate(labels):
        bounds = font.getbbox(label)
        height = bounds[3] - bounds[1]
        mask = Image.new('L', (176, height))
        ImageDraw.Draw(mask).text((-bounds[0], -bounds[1]), label, font=font, fill=255)
        offset_y = (14-height)//2 if v2 else 0
        pixels = [(x + (0 if v2 else round((height - 1 - y) * .22)), y + offset_y)
                  for y in range(height) for x in range(176) if mask.getpixel((x, y)) >= 128]
        shadow = 1 if v2 and size <= 16 else 2
        if max(x for x, y in pixels) + shadow >= 176 or max(y for x, y in pixels) + shadow >= 20:
            raise ValueError(f'{label} clips its native cell at{size}px')
        for selected in (False, True):
            image = Image.new('RGBA', (176, 20))
            for x, y in pixels:
                if not v2:
                    image.putpixel((x + 1, y + 2), (6, 2, 16, 255))
                image.putpixel((x + shadow, y + shadow), (6, 2, 16, 255))
            for x, y in pixels:
                row = y - offset_y
                t = (row // 2 * 2 if v2 else row) / max(1, height - 1)
                color = (255, round(243 - 119*t), round(73 - 51*t), 255) if selected else (255, 249, 218, 255)
                image.putpixel((x, y), color)
            sheet.paste(image, (0, (index*2+int(selected))*20))
            if not v2 or size == 16:
                image.save(output / f'{name}-{"selected" if selected else "normal"}.png')
    if v2:
        sheet.save(output / f'labels-{size}.png')

if v2:
    # The actual game bitmap alphabet: no outline rasterizer, hinting, threshold or fractional metrics.
    source = (root / 'apps/game/src/assets/glyphs.ts').read_text(encoding='utf-8')
    glyphs = dict(re.findall(r"^  ([A-Z]): '([01 ]+)',", source, re.MULTILINE))
    sheet = Image.new('RGBA', (176, 120))
    for index, (name, label) in enumerate(labels):
        blocks, cursor = [], 0
        for char in label:
            if char == ' ':
                cursor += 2
                continue
            rows = glyphs[char].split()
            columns = [x for x in range(5) if any(row[x] == '1' for row in rows)]
            left, right = min(columns), max(columns)
            for y, row in enumerate(rows):
                for x in range(left, right + 1):
                    if row[x] == '1':
                        blocks.append(((cursor + x - left)*2, y*2))
            cursor += right-left+2
        if (cursor-1)*2+2 > 176:
            raise ValueError(f'Bitmap label clips: {label}')
        for selected in (False, True):
            image = Image.new('RGBA', (176,20))
            draw = ImageDraw.Draw(image)
            for x, y in blocks:
                draw.rectangle((x+2,y+2,x+3,y+3),fill=(6,2,16,255))
            for x, y in blocks:
                t=(y//2)/6
                color=(255,round(243-119*t),round(73-51*t),255) if selected else (255,249,218,255)
                draw.rectangle((x,y,x+1,y+1),fill=color)
            image.save(output / f'{name}-{"selected" if selected else "normal"}.png')
            sheet.paste(image,(0,(index*2+int(selected))*20))
    sheet.save(output / 'labels-bitmap.png')
    broken = 0
    for y in range(0,120,2):
        for x in range(0,176,2):
            first = sheet.getpixel((x,y))
            if any(sheet.getpixel((x+dx,y+dy)) != first for dx in range(2) for dy in range(2)):
                broken += 1
    if broken:
        raise ValueError(f'{broken} bitmap font blocks are not uniform')
    (output / 'bitmap-grid-check.json').write_text(json.dumps({
        'sheet': [176,120], 'fontPixelBlock': [2,2], 'nonuniformBlocks': broken,
        'source': 'apps/game/src/assets/glyphs.ts', 'rasterizer': None,
        'gradientStepRows': 2, 'shadowOffset': [2,2]
    }, indent=2),encoding='utf-8')
