import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const sharp = createRequire(import.meta.url)(process.env.RPS_SHARP_PATH || 'sharp');
const root = 'art/stages/foundry-layers-v1',
  out = 'apps/game/public/assets/stages/foundry';
const W = 192,
  H = 240,
  S = 176;
const read = (path) =>
  sharp(path).resize(W, H, { fit: 'fill', kernel: 'nearest' }).ensureAlpha().raw().toBuffer();
const base = await read(`${root}/source/clean-background.png`),
  original = await read('art/stages/foundry-floor-v2/foundry-floor-source.png');
const overlay = Buffer.alloc(base.length),
  glow = Buffer.alloc(base.length);
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    // Continuous low-contrast overhead architecture replaces the old rectangular void.
    const shade = y < 82 ? 0.22 + 0.78 * Math.min(1, y / 82) ** 1.6 : 1;
    for (let c = 0; c < 3; c++) base[i + c] = Math.round(base[i + c] * shade);
    // Foreground pipes and full lower rail/floor occlude the turning gear and flames.
    const rail = y >= 147 && y < 167 && base[i] < 55 && base[i + 2] > base[i] * 0.8;
    const fixed =
      y >= 167 || rail || x < 16 || (x < 37 && y >= 108) || (x >= 37 && x < 52 && y >= 128) || x >= 176;
    if (fixed) base.copy(overlay, i, i, i + 4);
    if (
      y > 110 &&
      !(x >= 104 && x < 146 && y >= 124 && y < 159) &&
      original[i] > 150 &&
      original[i] > original[i + 1] * 1.25 &&
      original[i + 1] > 60
    )
      original.copy(glow, i, i, i + 4);
  }
const save = (name, data, w = W, h = H) =>
  sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png({ palette: true, colours: 40, dither: 0 })
    .toFile(`${out}/${name}.png`);
await save('background', base);
await save('occluders', overlay);
await save('warm-glow', glow);
const gear = await sharp(`${root}/source/gear.png`)
  .trim()
  .resize(S, S, { fit: 'fill', kernel: 'nearest' })
  .ensureAlpha()
  .raw()
  .toBuffer();
for (let i = 3; i < gear.length; i += 4) gear[i] = gear[i] >= 128 ? 255 : 0;
// 1-degree native frames, tiled rather than a texture strip wider than GPU limits.
const cols = 18,
  rows = 20,
  gearSheet = Buffer.alloc(cols * S * rows * S * 4);
for (let f = 0; f < 360; f++) {
  const a = (f * Math.PI) / 180,
    c = Math.cos(a),
    s = Math.sin(a),
    ox = (f % cols) * S,
    oy = Math.floor(f / cols) * S;
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const dx = x - 87.5,
        dy = y - 87.5,
        sx = Math.round(c * dx + s * dy + 87.5),
        sy = Math.round(-s * dx + c * dy + 87.5);
      if (sx < 0 || sx >= S || sy < 0 || sy >= S) continue;
      const si = (sy * S + sx) * 4,
        di = ((oy + y) * cols * S + ox + x) * 4;
      gear.copy(gearSheet, di, si, si + 4);
      // The gear also disappears naturally into the overhead shadow, never into a hard crop.
      const worldY = y + 50,
        fade = worldY < 82 ? 0.22 + 0.78 * Math.min(1, worldY / 82) ** 1.6 : 1;
      for (let ch = 0; ch < 3; ch++) gearSheet[di + ch] = Math.round(gearSheet[di + ch] * fade);
    }
}
await save('gear-turn', gearSheet, cols * S, rows * S);
const fireSheet = Buffer.alloc(W * 12 * H * 4);
for (let f = 0; f < 12; f++)
  for (let y = 124; y < 159; y++)
    for (let x = 104; x < 146; x++) {
      const sy = Math.min(158, y + (f % 4)),
        sx = Math.max(104, Math.min(145, x + Math.round(Math.sin(y * 0.45 - (f * Math.PI) / 6) * 1.4)));
      const si = (sy * W + sx) * 4,
        di = (y * W * 12 + f * W + x) * 4;
      if (original[si] > 110 && original[si + 1] > 30 && original[si + 2] < original[si] * 0.6)
        original.copy(fireSheet, di, si, si + 4);
    }
await save('fire', fireSheet, W * 12, H);
writeFileSync(
  `${root}/export.json`,
  JSON.stringify(
    {
      width: W,
      height: H,
      gear: {
        frameWidth: S,
        frameHeight: S,
        frames: 360,
        columns: cols,
        rows,
        center: [-8, 138],
        revolutionMs: 90000,
      },
      fire: { frames: 12, frameWidth: W, frameHeight: H, frameMs: 150 },
      palette: 40,
      sampling: 'nearest',
      top: 'continuous architecture with gradual overhead shadow',
    },
    null,
    2,
  ),
);
console.log('Exported foundry background, fixed occluders, 360 gear frames, 12 fire frames and warm glow.');
