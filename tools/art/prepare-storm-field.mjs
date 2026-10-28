// Export the generated cloud art and author looping, native-pixel grass assets.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const sharp = require(process.env.RPS_SHARP_PATH || 'sharp');
const source = 'art/stages/storm-field-v1/';
const out = 'apps/game/public/assets/stages/';
mkdirSync(out, { recursive: true });
const W = 192,
  H = 240,
  frames = 12;
await sharp(`${source}generated-clouds-v2.png`)
  .resize(384, 160, { fit: 'fill', kernel: 'nearest' })
  .png({ palette: true, colours: 16, dither: 0 })
  .toFile(`${out}storm-clouds.png`);
let seed = 0x53544f52;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const back = Buffer.alloc(W * H * frames * 4);
const front = Buffer.alloc(W * 32 * frames * 4);
const colors = ['102638', '173b48', '205357', '2d6866', '427e72', '64957f'].map((c) => Buffer.from(c, 'hex'));
const put = (buf, height, frame, x, y, color) => {
  if (y < 0 || y >= height) return;
  x = ((Math.round(x) % W) + W) % W;
  const i = (y * W * frames + frame * W + x) * 4;
  buf[i] = color[0];
  buf[i + 1] = color[1];
  buf[i + 2] = color[2];
  buf[i + 3] = 255;
};
const blades = [];
for (let y = 145; y < 250; y += 2) {
  const depth = (y - 145) / 100;
  for (let x = -8; x < W + 8; x += 2 + random() * 2) {
    blades.push({
      x,
      y: y + Math.floor(random() * 3),
      h: 2 + Math.floor(depth * 12 + random() * 4),
      bend: 2 + depth * 6 + random() * 2,
      shade: Math.min(5, Math.floor(random() * 3 + depth * 2)),
      phase: random() * 0.6,
    });
  }
}
const foreground = [];
for (let y = 221; y < 251; y += 3) {
  for (let x = -8; x < W + 8; x += 1.5 + random() * 2) {
    foreground.push({
      x,
      y: y + Math.floor(random() * 3),
      h: 10 + Math.floor(random() * 7),
      bend: 5 + random() * 4,
      shade: 2 + Math.floor(random() * 4),
      phase: random() * 0.6,
    });
  }
}
function drawBlade(buf, height, frame, b, top) {
  const wave = Math.sin((frame / frames) * Math.PI * 2 - b.x / 32 - b.y / 47 + b.phase);
  const bend = b.bend + wave * 2.5;
  for (let k = 0; k <= b.h; k++) {
    const t = k / b.h;
    const x = b.x + bend * t * t;
    const y = b.y - k - top;
    put(buf, height, frame, x, y, colors[b.shade]);
    if (k < b.h * 0.6) put(buf, height, frame, x - 1, y, colors[Math.max(0, b.shade - 1)]);
    if (top && k < b.h * 0.75) put(buf, height, frame, x - 1, y, colors[Math.max(0, b.shade - 1)]);
  }
}
for (let frame = 0; frame < frames; frame++) {
  for (let y = 146; y < H; y++)
    for (let x = 0; x < W; x++) put(back, H, frame, x, y, colors[y < 160 ? 0 : 1]);
  for (const b of blades) drawBlade(back, H, frame, b, 0);
  for (const b of foreground) drawBlade(front, 32, frame, b, 208);
}
for (const [name, data, height] of [
  ['field', back, H],
  ['foreground', front, 32],
]) {
  await sharp(data, { raw: { width: W * frames, height, channels: 4 } })
    .png()
    .toFile(`${out}storm-${name}.png`);
}
// A monitor-sized first field frame satisfies the shared stage-art contract.
await sharp(back, { raw: { width: W * frames, height: H, channels: 4 } })
  .extract({ left: 0, top: 0, width: W, height: H })
  .png()
  .toFile(`${out}storm-field-192.png`);
writeFileSync(
  `${source}export.json`,
  JSON.stringify(
    {
      clouds: [384, 160],
      field: [192, 240],
      foreground: [192, 32],
      foregroundY: 208,
      floorY: 220,
      frames,
      frameMs: 120,
      palette: colors.map((c) => `#${c.toString('hex')}`),
      seed: '0x53544f52',
    },
    null,
    2,
  ) + '\n',
);
console.log('Exported storm panorama, 12-frame field/foreground sheets and native first frame.');
