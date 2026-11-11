// Separate generated poses, share one scale, align the floor, and pack a named Phaser atlas.
// Needs sharp or RPS_SHARP_PATH. node tools/art/prepare-riot-sheet.mjs
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require(process.env.RPS_SHARP_PATH || 'sharp');
const root = new URL('../../', import.meta.url);
const folder = new URL('art/experiments/riot-flat-sheet-v1/', root);
const output = new URL('apps/game/public/assets/', root);
const frameSize = 128;
const anchorX = 64;
const baseline = 124;
const idleHeight = 100;
const stem = 'riot';
const reviewFolder = new URL('native-192/', folder);
mkdirSync(reviewFolder, { recursive: true });
const names = ['idle0', 'idle1', 'rock', 'paper', 'scissors', 'hurt', 'ko', 'win', 'kick'];
const { data, info } = await sharp(fileURLToPath(new URL('generated.png', folder)))
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const labels = new Int32Array(W * H);
const queue = new Int32Array(W * H);
const subjects = [];
let label = 0;
for (let start = 0; start < W * H; start++) {
  if (labels[start] || data[start * 4 + 3] < 128) continue;
  const id = ++label;
  labels[start] = id;
  queue[0] = start;
  let head = 0;
  let count = 1;
  let left = W,
    top = H,
    right = 0,
    bottom = 0;
  while (head < count) {
    const p = queue[head++];
    const x = p % W;
    const y = Math.floor(p / W);
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
        const n = ny * W + nx;
        if (!labels[n] && data[n * 4 + 3] >= 128) {
          labels[n] = id;
          queue[count++] = n;
        }
      }
  }
  if (count > 3000) subjects.push({ id, count, left, top, right, bottom });
}
if (subjects.length !== 9) throw new Error(`Expected nine complete subjects, found ${subjects.length}`);
subjects.sort((a, b) => {
  const rowA = Math.floor((((a.top + a.bottom) / 2) * 3) / H);
  const rowB = Math.floor((((b.top + b.bottom) / 2) * 3) / H);
  return rowA - rowB || a.left - b.left;
});
const scale = idleHeight / (subjects[0].bottom - subjects[0].top + 1);
const frames = {};
const composite = [];
const audit = [];
mkdirSync(new URL('frames/', reviewFolder), { recursive: true });
for (const [i, subject] of subjects.entries()) {
  const name = names[i];
  const sw = subject.right - subject.left + 1;
  const sh = subject.bottom - subject.top + 1;
  const raw = Buffer.alloc(sw * sh * 4);
  for (let y = 0; y < sh; y++)
    for (let x = 0; x < sw; x++) {
      const p = (subject.top + y) * W + subject.left + x;
      if (labels[p] !== subject.id) continue;
      data.copy(raw, (y * sw + x) * 4, p * 4, p * 4 + 3);
      raw[(y * sw + x) * 4 + 3] = 255;
    }
  // The bottom band locates the feet instead of centring on the extended attacking hand.
  let footLeft = W,
    footRight = 0;
  for (let y = Math.max(subject.top, subject.bottom - 7); y <= subject.bottom; y++)
    for (let x = subject.left; x <= subject.right; x++)
      if (labels[y * W + x] === subject.id) {
        footLeft = Math.min(footLeft, x);
        footRight = Math.max(footRight, x);
      }
  let anchor = (footLeft + footRight) / 2;
  if (name === 'ko') anchor = (subject.left + subject.right) / 2;
  if (name === 'kick') anchor += 27 / scale;
  const width = Math.round(sw * scale),
    height = Math.round(sh * scale);
  const left = anchorX - Math.round((anchor - subject.left) * scale);
  const top = baseline - height;
  if (left < 0 || top < 0 || left + width > frameSize || top + height > frameSize)
    throw new Error(`${name} would clip: ${JSON.stringify({ left, top, width, height })}`);
  const pose = await sharp(raw, { raw: { width: sw, height: sh, channels: 4 } })
    .resize(width, height, { kernel: 'nearest' })
    .png()
    .toBuffer();
  const frame = await sharp({
    create: { width: frameSize, height: frameSize, channels: 4, background: '#00000000' },
  })
    .composite([{ input: pose, left, top }])
    .png()
    .toBuffer();
  writeFileSync(new URL(`frames/${name}.png`, reviewFolder), frame);
  const x = (i % 3) * frameSize,
    y = Math.floor(i / 3) * frameSize;
  composite.push({ input: frame, left: x, top: y });
  frames[name] = {
    frame: { x, y, w: frameSize, h: frameSize },
    rotated: false,
    trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: frameSize, h: frameSize },
    sourceSize: { w: frameSize, h: frameSize },
  };
  audit.push({ name, source: subject, placed: { left, top, width, height }, anchor: [anchorX, baseline] });
}
const sheet = fileURLToPath(new URL(`${stem}.png`, output));
await sharp({ create: { width: frameSize * 3, height: frameSize * 3, channels: 4, background: '#00000000' } })
  .composite(composite)
  .png()
  .toFile(sheet);
writeFileSync(
  new URL(`${stem}.json`, output),
  JSON.stringify(
    { frames, meta: { image: `${stem}.png`, size: { w: frameSize * 3, h: frameSize * 3 }, scale: '1' } },
    null,
    2,
  ),
);
writeFileSync(
  new URL('alignment.json', reviewFolder),
  JSON.stringify({ scale, anchor: [anchorX, baseline], audit }, null, 2),
);
await sharp(sheet)
  .resize(frameSize * 9, frameSize * 9, { kernel: 'nearest' })
  .png()
  .toFile(fileURLToPath(new URL('sheet-3x.png', reviewFolder)));
console.log(JSON.stringify({ sheet, scale, poses: audit.map(({ name, placed }) => ({ name, ...placed })) }));


