// Export imagegen cutouts to aligned native layers. No runtime scaling or soft alpha.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const sharp = createRequire(import.meta.url)(process.env.RPS_SHARP_PATH || 'sharp');
const root = 'art/stages/sunset-harbor-layers-v1';
const out = `${root}/layers`;
mkdirSync(out, { recursive: true });
const W = 192,
  H = 240;
const blank = () => Buffer.alloc(W * H * 4);
const read = async (path) =>
  sharp(path).resize(W, H, { fit: 'fill', kernel: 'nearest' }).ensureAlpha().raw().toBuffer();
const plate = await read(`${root}/source/clean-background.png`);
const dock = await read(`${root}/source/dock.png`);
const original = await read('art/stages/sunset-harbor-v3/sunset-harbor-source.png');
const buffers = {};
const save = async (name, pixels) => {
  for (let i = 3; i < pixels.length; i += 4) pixels[i] = pixels[i] >= 128 ? 255 : 0;
  const png = await sharp(pixels, { raw: { width: W, height: H, channels: 4 } })
    .png({ palette: true, colours: 40, dither: 0 })
    .toBuffer();
  writeFileSync(`${out}/${name}.png`, png);
  buffers[name] = png;
};
// Flood only the connected peach sky, preserving crane supports and skyline openings.
const skyMask = new Uint8Array(W * H);
const queue = Array.from({ length: W }, (_, x) => x);
for (let head = 0; head < queue.length; head++) {
  const p = queue[head];
  if (p < 0 || p >= W * 133 || skyMask[p]) continue;
  const i = p * 4,
    r = plate[i],
    g = plate[i + 1],
    b = plate[i + 2];
  if (!(r > 165 && g > 90 && g - b > 3 && r - g > 25)) continue;
  skyMask[p] = 1;
  const x = p % W;
  if (x > 0) queue.push(p - 1);
  if (x < W - 1) queue.push(p + 1);
  queue.push(p - W, p + W);
}
const sky = blank(),
  skyline = blank(),
  water = blank(),
  reflections = blank();
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const p = y * W + x,
      i = p * 4;
    // Sample one central sky column: a subtle vertical gradient with no lateral noise.
    const sy = Math.min(y, 105),
      si = (sy * W + 85) * 4;
    sky.set([plate[si], plate[si + 1], plate[si + 2], 255], i);
    if (y >= 72 && y < 133 && !skyMask[p]) skyline.set(plate.subarray(i, i + 4), i);
    if (y >= 133) {
      water.set(plate.subarray(i, i + 4), i);
      if (plate[i] > 240 && plate[i + 1] > 155 && plate[i + 2] < 150 && y < 189) {
        reflections.set(plate.subarray(i, i + 4), i);
        // Heal highlight holes using a nearby non-highlight water color on this row.
        let donor = -1;
        for (let d = 1; d < W && donor < 0; d++)
          for (const nx of [x - d, x + d]) {
            if (nx < 0 || nx >= W) continue;
            const ni = (y * W + nx) * 4;
            if (!(plate[ni] > 240 && plate[ni + 1] > 155 && plate[ni + 2] < 150)) {
              donor = ni;
              break;
            }
          }
        if (donor >= 0) water.set(plate.subarray(donor, donor + 4), i);
      }
    }
  }
await save('sky-gradient', sky);
await save('distant-harbor', skyline);
await save('water-base', water);
await save('water-reflections', reflections);
// Re-align the generated boat cutout: imagegen enlarged it despite the placement request.
const boatRaw = await sharp(`${root}/source/boat.png`)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
let minX = boatRaw.info.width,
  minY = boatRaw.info.height,
  maxX = 0,
  maxY = 0;
for (let y = 0; y < boatRaw.info.height; y++)
  for (let x = 0; x < boatRaw.info.width; x++) {
    if (boatRaw.data[(y * boatRaw.info.width + x) * 4 + 3] < 128) continue;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
const boatSmall = await sharp(`${root}/source/boat.png`)
  .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
  .resize(66, 62, { fit: 'fill', kernel: 'nearest' })
  .ensureAlpha()
  .raw()
  .toBuffer();
const boat = blank();
for (let y = 0; y < 62; y++) boatSmall.copy(boat, ((113 + y) * W + 126) * 4, y * 66 * 4, (y + 1) * 66 * 4);
await save('boat', boat);
const flag = blank(),
  rope = blank();
for (let y = 110; y < 122; y++)
  for (let x = 173; x < 185; x++) {
    const i = (y * W + x) * 4;
    if (original[i] > 130 && original[i] > original[i + 1] * 1.5 && original[i] > original[i + 2] * 1.2)
      flag.set(original.subarray(i, i + 4), i);
  }
// Separate one free rope span; posts, other fixed spans and floor remain on dock layer.
for (let y = 158; y < 175; y++)
  for (let x = 76; x < 118; x++) {
    const i = (y * W + x) * 4;
    if (dock[i + 3] >= 128) {
      rope.set(dock.subarray(i, i + 4), i);
      dock[i + 3] = 0;
    }
  }
await save('pennant', flag);
await save('rope-span', rope);
await save('dock-foreground', dock);
const order = [
  'sky-gradient',
  'distant-harbor',
  'water-base',
  'water-reflections',
  'boat',
  'pennant',
  'rope-span',
  'dock-foreground',
];
const composite = await sharp({ create: { width: W, height: H, channels: 4, background: '#000' } })
  .composite(order.map((name) => ({ input: buffers[name] })))
  .png()
  .toBuffer();
writeFileSync(`${root}/assembled-native.png`, composite);
await sharp(composite).resize(576, 720, { kernel: 'nearest' }).toFile(`${root}/assembled-3x.png`);
const checks = [];
for (const name of order) {
  const { data, info } = await sharp(buffers[name]).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alpha = new Set();
  let count = 0;
  for (let i = 3; i < data.length; i += 4) {
    alpha.add(data[i]);
    if (data[i]) count++;
  }
  if (info.width !== W || info.height !== H || !count || [...alpha].some((a) => a !== 0 && a !== 255))
    throw Error(`Invalid layer: ${name}`);
  checks.push({ name, width: info.width, height: info.height, visiblePixels: count, binaryAlpha: true });
}
writeFileSync(
  `${root}/layers.json`,
  JSON.stringify(
    {
      width: W,
      height: H,
      order,
      paletteLimitPerLayer: 40,
      sampling: 'nearest',
      dither: 0,
      boat: { x: 126, y: 113, width: 66, height: 62, bobPixels: 1 },
      flag: { followsBoat: true },
      rope: {
        anchors: [
          [76, 165],
          [117, 165],
        ],
        note: 'Pin endpoints; move center at most one pixel.',
      },
      standingLine: 220,
      checks,
    },
    null,
    2,
  ),
);
console.log(`Exported and validated ${checks.length} aligned native layers.`);
