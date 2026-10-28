import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const sharp = createRequire(import.meta.url)(process.env.RPS_SHARP_PATH || 'sharp');
const root = 'art/stages/lantern-courtyard-layers-v1',
  out = `${root}/layers`;
mkdirSync(out, { recursive: true });
const W = 192,
  H = 240;
const blank = () => Buffer.alloc(W * H * 4);
const native = (path) =>
  sharp(path).resize(W, H, { fit: 'fill', kernel: 'nearest' }).ensureAlpha().raw().toBuffer();
const original = await native('art/stages/lantern-courtyard-v2/lantern-courtyard-source.png');
const clean = await native(`${root}/source/clean-plate.png`);
const base = Buffer.from(original);
const lanterns = [
  { id: 'left', x: 18, y: 89, width: 12, height: 22, pivot: [23, 89], source: [0, 0.5] },
  { id: 'right', x: 163, y: 89, width: 11, height: 22, pivot: [168, 89], source: [0.5, 0.91] },
  { id: 'far-right', x: 187, y: 100, width: 5, height: 20, pivot: [189, 100], source: [0.91, 1] },
];
// Only healed lantern footprints come from the generated plate; all other art is original.
for (const l of lanterns)
  for (let y = l.y - 2; y < l.y + l.height + 2; y++)
    for (let x = l.x - 2; x < Math.min(W, l.x + l.width + 2); x++) {
      const i = (y * W + x) * 4;
      clean.copy(base, i, i, i + 4);
    }
const images = {},
  checks = [];
async function save(name, pixels) {
  for (let i = 3; i < pixels.length; i += 4) pixels[i] = pixels[i] >= 128 ? 255 : 0;
  const png = await sharp(pixels, { raw: { width: W, height: H, channels: 4 } })
    .png({ palette: true, colours: 40, dither: 0 })
    .toBuffer();
  const data = await sharp(png).ensureAlpha().raw().toBuffer();
  let count = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 0 && data[i] !== 255) throw Error(`Soft alpha: ${name}`);
    if (data[i]) count++;
  }
  if (!count) throw Error(`Empty layer: ${name}`);
  writeFileSync(`${out}/${name}.png`, png);
  images[name] = png;
  checks.push({ name, width: W, height: H, visiblePixels: count, binaryAlpha: true });
}
// Separate the connected gradient sky without cutting out the roof silhouettes.
const skyMask = new Uint8Array(W * H),
  queue = Array.from({ length: W }, (_, x) => x);
for (let head = 0; head < queue.length; head++) {
  const p = queue[head];
  if (p < 0 || p >= W * 145 || skyMask[p]) continue;
  const x = p % W,
    y = Math.floor(p / W),
    i = p * 4,
    sample = (Math.min(y, 82) * W + 96) * 4;
  if ([0, 1, 2].reduce((sum, c) => sum + Math.abs(base[i + c] - original[sample + c]), 0) > 22) continue;
  skyMask[p] = 1;
  if (x) queue.push(p - 1);
  if (x < W - 1) queue.push(p + 1);
  queue.push(p - W, p + W);
}
const sky = blank(),
  scenery = blank(),
  floor = blank();
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4,
      sample = (Math.min(y, 82) * W + 96) * 4;
    sky.set([original[sample], original[sample + 1], original[sample + 2], 255], i);
    if (y >= 175) floor.set(base.subarray(i, i + 4), i);
    else if (!skyMask[y * W + x]) scenery.set(base.subarray(i, i + 4), i);
  }
await save('sky-gradient', sky);
await save('scenery-clean', scenery);
await save('stone-floor', floor);
const cutout = await sharp(`${root}/source/lantern-cutouts.png`)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
for (const l of lanterns) {
  const from = Math.floor(cutout.info.width * l.source[0]),
    to = Math.floor(cutout.info.width * l.source[1]);
  let x0 = to,
    y0 = cutout.info.height,
    x1 = from,
    y1 = 0;
  for (let y = 0; y < cutout.info.height; y++)
    for (let x = from; x < to; x++)
      if (cutout.data[(y * cutout.info.width + x) * 4 + 3] >= 128) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
  if (x1 < x0 || y1 < y0) throw Error(`Missing cutout: ${l.id}`);
  const resized = await sharp(`${root}/source/lantern-cutouts.png`)
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .resize(l.width, l.height, { fit: 'fill', kernel: 'nearest' })
    .ensureAlpha()
    .raw()
    .toBuffer();
  const body = blank(),
    glow = blank();
  for (let y = 0; y < l.height; y++)
    for (let x = 0; x < l.width; x++) {
      const s = (y * l.width + x) * 4,
        d = ((l.y + y) * W + l.x + x) * 4;
      body.set(resized.subarray(s, s + 4), d);
      if (resized[s + 3] >= 128 && resized[s] > 225 && resized[s + 1] > 125 && resized[s + 2] < 180)
        glow.set(resized.subarray(s, s + 4), d);
    }
  await save(`lantern-${l.id}`, body);
  await save(`glow-${l.id}`, glow);
}
// Isolate existing small pink petal components from the approved floor art.
const seen = new Uint8Array(W * H),
  components = [];
const pink = (p) => {
  const i = p * 4;
  return (
    original[i] > 150 &&
    original[i] > original[i + 1] * 1.18 &&
    original[i + 2] > original[i + 1] * 0.95 &&
    original[i] > original[i + 2] * 1.05
  );
};
for (let p = W * 175; p < W * 188; p++) {
  if (seen[p] || !pink(p)) continue;
  const todo = [p],
    points = [];
  for (let head = 0; head < todo.length; head++) {
    const q = todo[head];
    if (q < W * 175 || q >= W * 188 || seen[q] || !pink(q)) continue;
    seen[q] = 1;
    points.push(q);
    const x = q % W;
    if (x) todo.push(q - 1);
    if (x < W - 1) todo.push(q + 1);
    todo.push(q - W, q + W);
  }
  if (points.length >= 2 && points.length <= 20) components.push(points);
}
const selected = components.sort((a, b) => b.length - a.length).slice(0, 4);
if (selected.length < 3) throw Error('Not enough native petal variants');
const sheetWidth = selected.length * 8,
  petalSheet = Buffer.alloc(sheetWidth * 8 * 4);
for (const [frame, points] of selected.entries()) {
  const left = Math.min(...points.map((p) => p % W)),
    top = Math.min(...points.map((p) => Math.floor(p / W)));
  for (const p of points) {
    const x = (p % W) - left,
      y = Math.floor(p / W) - top;
    if (x >= 8 || y >= 8) throw Error('Oversized petal');
    original.copy(petalSheet, (y * sheetWidth + frame * 8 + x) * 4, p * 4, p * 4 + 4);
  }
}
await sharp(petalSheet, { raw: { width: sheetWidth, height: 8, channels: 4 } })
  .png({ palette: true, colours: 12, dither: 0 })
  .toFile(`${out}/petals.png`);
const order = ['sky-gradient', 'scenery-clean', 'stone-floor', ...lanterns.map((l) => `lantern-${l.id}`)];
const composite = await sharp({ create: { width: W, height: H, channels: 4, background: '#000' } })
  .composite(order.map((name) => ({ input: images[name] })))
  .png()
  .toBuffer();
writeFileSync(`${root}/assembled-native.png`, composite);
await sharp(composite).resize(576, 720, { kernel: 'nearest' }).toFile(`${root}/assembled-3x.png`);
writeFileSync(
  `${root}/layers.json`,
  JSON.stringify(
    {
      width: W,
      height: H,
      order,
      lanterns,
      glow: { blend: 'ADD', suggestedAlpha: [0.04, 0.15], followsLantern: true },
      petals: {
        file: 'petals.png',
        frameWidth: 8,
        frameHeight: 8,
        frames: selected.length,
        activeCount: [0, 3],
        minimumY: 72,
      },
      standingLine: 220,
      paletteLimitPerLayer: 40,
      binaryAlpha: true,
      checks,
    },
    null,
    2,
  ),
);
console.log(`Exported ${checks.length} aligned layers and ${selected.length} native petal variants.`);
