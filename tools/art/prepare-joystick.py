"""Prepare generated joystick components as nine invariant, perspective-correct cabinet sprites.

Run with Pillow/numpy. No frame mirroring; original generations are retained in joystick-v2/source.
"""
from pathlib import Path
import hashlib
import json
import math
import shutil
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'art/cabinet/joystick-v2'
PUBLIC = ROOT / 'apps/game/public/assets/cabinet'
DIRECTIONS = [('ul', -1, -1), ('u', 0, -1), ('ur', 1, -1),
              ('l', -1, 0), ('c', 0, 0), ('r', 1, 0),
              ('dl', -1, 1), ('d', 0, 1), ('dr', 1, 1)]


def prepare():
    native = OUT / 'native'
    legacy = OUT / 'legacy'
    native.mkdir(parents=True, exist_ok=True)
    legacy.mkdir(exist_ok=True)
    for name, _, _ in DIRECTIONS:
        previous = PUBLIC / f'joystick-{name}.webp'
        if previous.exists() and not (legacy / previous.name).exists():
            shutil.copy2(previous, legacy / previous.name)
    source = Image.open(OUT / 'source/components.png').convert('RGBA')
    regions = {'base': (0, 0, 1000, 752), 'ball': (1000, 0, 1650, 752),
               'shaft': (1650, 0, 2092, 752)}
    pieces = {}
    crops = {}
    for key, region in regions.items():
        part = source.crop(region)
        bounds = part.getchannel('A').point(lambda v: 255 if v > 30 else 0).getbbox()
        pieces[key] = part.crop(bounds)
        crops[key] = {'region': region, 'alphaBounds': bounds}

    # The mounting plate is prepared once and pasted unchanged into all nine frames.
    base = pieces['base']
    base = base.resize((245, round(base.height * 245 / base.width)), Image.Resampling.LANCZOS)
    size, center_x, bottom = 560, 280, 430
    base_x, base_y = center_x - base.width // 2, bottom - base.height
    # Locate the center of the dark socket inside the generated base, not its decorative rim.
    arr = np.asarray(base)
    yy, xx = np.indices(arr.shape[:2])
    socket = ((arr[:, :, :3].max(axis=2) < 14) & (arr[:, :, 3] > 220)
              & (xx > base.width * .40) & (xx < base.width * .63)
              & (yy > base.height * .30) & (yy < base.height * .55))
    # Socket shading is asymmetric; its dark-pixel centroid biases the shaft right.
    # Align every pose to the physical mounting plate center instead.
    pivot_x = float(center_x)
    pivot_y = base_y + float(yy[socket].mean())
    base_canvas = Image.new('RGBA', (size, size))
    base_canvas.alpha_composite(base, (base_x, base_y))
    base_canvas.save(native / 'shared-base.png')

    # Use the same generated sphere for every pose. A supersampled circular mask fixes its
    # silhouette exactly, without rotating the ball's lighting or squashing it under perspective.
    factor = 4
    diameter = 128
    sphere = pieces['ball'].resize((diameter * factor, diameter * factor), Image.Resampling.LANCZOS)
    ball = Image.new('RGBA', sphere.size, (174, 0, 20, 255))
    ball.alpha_composite(sphere)
    circle = Image.new('L', ball.size)
    ImageDraw.Draw(circle).ellipse((0, 0, ball.width - 1, ball.height - 1), fill=255)
    ball.putalpha(circle)
    ball.resize((diameter, diameter), Image.Resampling.LANCZOS).save(native / 'shared-ball.png')

    # Orthographic projection of equal physical tilts. Depth projects less strongly than height,
    # so pushing forward/down shortens the visible shaft instead of swinging it below the plate.
    length, height_projection, depth_projection = 184.0, .78, .55
    angle = math.radians(12)
    neutral_y = pivot_y - length * height_projection
    sheet = Image.new('RGBA', (size * 3, size * 3))
    audit = []
    all_frames = []
    all_moving = []
    atlas = {}
    for index, (name, dx, dy) in enumerate(DIRECTIONS):
        norm = math.hypot(dx, dy)
        tilt = angle if norm else 0
        ux, uy = (dx / norm, dy / norm) if norm else (0, 0)
        travel = length * math.sin(tilt)
        head_x = pivot_x + travel * ux
        head_y = pivot_y - length * math.cos(tilt) * height_projection + travel * uy * depth_projection
        arm_dx, arm_dy = head_x - pivot_x, head_y - pivot_y
        arm_length = math.hypot(arm_dx, arm_dy)
        shaft = pieces['shaft'].resize((30 * factor, round((arm_length + 5) * factor)), Image.Resampling.LANCZOS)
        rotation = -math.degrees(math.atan2(arm_dx, -arm_dy))
        shaft = shaft.rotate(rotation, Image.Resampling.BICUBIC, expand=True)
        moving = Image.new('RGBA', (size * factor, size * factor))
        mid_x, mid_y = (head_x + pivot_x) / 2, (head_y + pivot_y) / 2
        moving.alpha_composite(shaft, (round(mid_x * factor - shaft.width / 2),
                                       round(mid_y * factor - shaft.height / 2)))
        moving.alpha_composite(ball, (round((head_x - diameter / 2) * factor),
                                     round((head_y - diameter / 2) * factor)))
        moving = moving.resize((size, size), Image.Resampling.LANCZOS)
        frame = base_canvas.copy()
        frame.alpha_composite(moving)
        frame.save(native / f'joystick-{name}.webp', lossless=True, method=6)
        frame.save(PUBLIC / f'joystick-{name}.webp', lossless=True, method=6)
        all_frames.append(np.asarray(frame))
        all_moving.append(np.asarray(moving)[:, :, 3])
        left, top = index % 3 * size, index // 3 * size
        sheet.alpha_composite(frame, (left, top))
        atlas[name] = {'frame': {'x': left, 'y': top, 'w': size, 'h': size},
                       'rotated': False, 'trimmed': False,
                       'spriteSourceSize': {'x': 0, 'y': 0, 'w': size, 'h': size},
                       'sourceSize': {'w': size, 'h': size}}
        audit.append({'direction': name, 'tiltDegrees': 12 if norm else 0,
                      'ballCenter': [head_x, head_y], 'ballDiameter': diameter,
                      'projectedOffset': [head_x - pivot_x, head_y - neutral_y],
                      'physicalLateralTravel': travel, 'mirrored': False})
    sheet.save(native / 'joystick-sheet.png')
    sheet.save(PUBLIC / 'joystick-sheet.webp', lossless=True, method=6)
    (PUBLIC / 'joystick-sheet.json').write_text(json.dumps({'frames': atlas, 'meta': {
        'image': 'joystick-sheet.webp', 'scale': '1'}}, indent=2))
    # Verify actual final exports, not just declared geometry.
    moving_union = np.maximum.reduce(all_moving)
    fixed_pixels = (np.asarray(base_canvas)[:, :, 3] > 0) & (moving_union == 0)
    differences = [int(np.count_nonzero(np.any(f[fixed_pixels] != all_frames[4][fixed_pixels], axis=1)))
                   for f in all_frames]
    if any(differences):
        raise ValueError(f'Base shading changed: {differences}')
    radii = [row['physicalLateralTravel'] for row in audit if row['direction'] != 'c']
    if max(radii) - min(radii) > 1e-6:
        raise ValueError('Unequal physical tilt')
    # Ensure the right frame was not made by mirroring the left, including its lighting.
    right_is_mirror = bool(np.array_equal(all_frames[5], all_frames[3][:, ::-1]))
    if right_is_mirror:
        raise ValueError('Mirrored right frame')
    report = {'source': 'source/components.png', 'sourceCrops': crops, 'frameSize': [size, size],
              'baseWidth': 245, 'baseBottom': bottom, 'pivot': [pivot_x, pivot_y],
              'sharedBaseHash': hashlib.sha256(base_canvas.tobytes()).hexdigest(),
              'fixedBasePixelsCompared': int(fixed_pixels.sum()), 'basePixelDifferences': differences,
              'rightIsMirroredLeft': right_is_mirror, 'ballShape': 'same supersampled circle in every frame',
              'projection': {'height': height_projection, 'depth': depth_projection}, 'poses': audit}
    (OUT / 'preparation.json').write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    prepare()
