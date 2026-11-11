// Equal-size prompt comparison; source colour values are retained (no palette quantization).
// node tools/art/prepare-prompt-study.mjs — needs sharp or RPS_SHARP_PATH.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require(process.env.RPS_SHARP_PATH || 'sharp');
const root = new URL('../../', import.meta.url);
const folder = new URL('art/experiments/taiko-prompt-study/', root);
const stats = [];
const previews = [];
for (const [index, id] of ['a', 'b', 'c'].entries()) {
  const source = fileURLToPath(new URL(`${id}/generated.png`, folder));
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width;
  let top = info.height;
  let right = -1;
  let bottom = -1;
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
  if (right < left) throw new Error(`No subject in ${id}`);
  const width = Math.round(((right - left + 1) * 75) / (bottom - top + 1));
  if (width > 64) throw new Error(`Variant ${id} exceeds frame width`);
  const figure = await sharp(data, { raw: info })
    .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
    .resize(width, 75, { kernel: 'nearest' })
    .png()
    .toBuffer();
  const output = fileURLToPath(new URL(`apps/game/public/assets/experiments/taiko-prompt-${id}.png`, root));
  await sharp({ create: { width: 64, height: 80, channels: 4, background: '#00000000' } })
    .composite([{ input: figure, left: Math.floor((64 - width) / 2), top: 2 }])
    .png()
    .toFile(output);
  const pixels = await sharp(output).ensureAlpha().raw().toBuffer();
  const colours = new Set();
  for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3]) colours.add(pixels.readUInt32BE(i));
  const enlarged = await sharp(output).resize(384, 480, { kernel: 'nearest' }).png().toBuffer();
  previews.push({ input: enlarged, left: index * 384, top: 32 });
  stats.push({
    id,
    original: [info.width, info.height],
    bounds: { left, top, right, bottom },
    figure: [width, 75],
    opaqueColours: colours.size,
  });
}
const labels = Buffer.from(
  '<svg width="1152" height="32"><style>text{font:18px sans-serif;fill:white}</style><text x="20" y="23">A · Coarse arcade</text><text x="404" y="23">B · Explicit grid</text><text x="788" y="23">C · Flat shapes</text></svg>',
);
previews.push({ input: labels, left: 0, top: 0 });
await sharp({ create: { width: 1152, height: 512, channels: 4, background: '#283246' } })
  .composite(previews)
  .png()
  .toFile(fileURLToPath(new URL('comparison-6x.png', folder)));
writeFileSync(new URL('preparation.json', folder), JSON.stringify(stats, null, 2) + '\n');
console.log(JSON.stringify(stats));
