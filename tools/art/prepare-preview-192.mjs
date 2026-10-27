// Native 192x240 preview assets; generate from originals, not from the 75px comparison sprites.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const sharp = require(process.env.RPS_SHARP_PATH || 'sharp');
const root = new URL('../../', import.meta.url);
const out = new URL('apps/game/public/assets/experiments/', root);
const assets = [
  ['taiko-prompt-a', 'art/experiments/taiko-prompt-study/a/generated.png'],
  ['taiko-prompt-b', 'art/experiments/taiko-prompt-study/b/generated.png'],
  ['taiko-prompt-c', 'art/experiments/taiko-prompt-study/c/generated.png'],
  ['taiko-grid-v3', 'apps/game/public/assets/experiments/taiko-grid-v3.png'],
  ['taiko-idle-v2', 'art/experiments/taiko-idle-v2/generated.png'],
  ['taiko-idle-v1', 'art/experiments/taiko-idle-v1/generated.png'],
];
for (const [name, path] of assets) {
  const { data, info } = await sharp(fileURLToPath(new URL(path, root)))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let left = info.width,
    top = info.height,
    right = -1,
    bottom = -1;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      data[i + 3] = data[i + 3] >= 128 ? 255 : 0;
      if (data[i + 3]) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      } else data[i] = data[i + 1] = data[i + 2] = 0;
    }
  const width = Math.round(((right - left + 1) * 100) / (bottom - top + 1));
  if (width > 92 || right < left) throw new Error(`Invalid sprite ${name}`);
  const sprite = await sharp(data, { raw: info })
    .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
    .resize(width, 100, { kernel: 'nearest' })
    .png()
    .toBuffer();
  await sharp({ create: { width: 96, height: 112, channels: 4, background: '#00000000' } })
    .composite([{ input: sprite, left: Math.floor((96 - width) / 2), top: 8 }])
    .png()
    .toFile(fileURLToPath(new URL(`${name}-192.png`, out)));
}
await sharp(fileURLToPath(new URL('apps/game/public/assets/stages/rooftop.png', root)))
  .resize(192, 240, { kernel: 'nearest' })
  .png()
  .toFile(fileURLToPath(new URL('rooftop-192.png', out)));
const review = new URL('art/experiments/preview-192/', root);
mkdirSync(review, { recursive: true });
console.log('Prepared native 192x240 stage and six 100px comparison fighters; no colour reduction.');
