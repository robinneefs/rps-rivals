// Prepare the single-pose experiment. Needs sharp (or RPS_SHARP_PATH pointing to its package).
// Usage: node tools/art/prepare-taiko.mjs
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require(process.env.RPS_SHARP_PATH || 'sharp');
const root = new URL('../../', import.meta.url);
const compact = process.argv.includes('--compact');
const version = compact ? 'v2' : 'v1';
const frame = compact ? { w: 64, h: 80, figure: 75, top: 2 } : { w: 128, h: 128, figure: 100, top: 20 };
const source = fileURLToPath(new URL(`art/experiments/taiko-idle-${version}/generated.png`, root));
const output = fileURLToPath(new URL(`apps/game/public/assets/experiments/taiko-idle-${version}.png`, root));
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let left = info.width;
let top = info.height;
let right = -1;
let bottom = -1;
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * 4;
    data[i + 3] = data[i + 3] >= 128 ? 255 : 0;
    if (!data[i + 3]) {
      data[i] = data[i + 1] = data[i + 2] = 0;
      continue;
    }
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
  }
}
if (right < left) throw new Error('No opaque character pixels in source');
const width = Math.round(((right - left + 1) * frame.figure) / (bottom - top + 1));
if (width > frame.w - 4) throw new Error('Character is too wide for the experiment frame');
const sprite = await sharp(data, { raw: info })
  .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
  .resize(width, frame.figure, { kernel: 'nearest' })
  .png()
  .toBuffer();
await sharp({ create: { width: frame.w, height: frame.h, channels: 4, background: '#00000000' } })
  .composite([{ input: sprite, left: Math.floor((frame.w - width) / 2), top: frame.top }])
  .png({ palette: true, colours: compact ? 24 : 32, dither: 0 })
  .toFile(output);
console.log(
  JSON.stringify({
    output,
    sourceBounds: { left, top, right, bottom },
    width,
    height: frame.figure,
    footAnchor: { x: frame.w / 2, y: frame.top + frame.figure },
  }),
);
