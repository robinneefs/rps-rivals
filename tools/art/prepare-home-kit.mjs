// Standalone menu asset kit; never writes production game assets.
// node tools/art/prepare-home-kit.mjs (sharp or RPS_SHARP_PATH required)
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const sharp = require(process.env.RPS_SHARP_PATH || 'sharp');
const root = new URL('../../', import.meta.url);
const v2 = process.argv.includes('--v2');
const folder = new URL(`art/menus/rooftop-crew-${v2 ? 'v2' : 'v1'}/`, root);
const output = new URL('native/', folder);
mkdirSync(output, { recursive: true });
const path = (name) => fileURLToPath(new URL(name, folder));
const write = (name, value) => writeFileSync(new URL(name, folder), JSON.stringify(value, null, 2));

// Threshold transparency, discard only disconnected generation debris. No palette reduction.
async function subjects(name, minimum) {
  const { data, info } = await sharp(path(`source/${name}.png`))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const labels = new Int32Array(w * h),
    queue = new Int32Array(w * h),
    parts = [];
  let id = 0;
  for (let start = 0; start < w * h; start++) {
    if (labels[start] || data[start * 4 + 3] < 128) continue;
    id++;
    labels[start] = id;
    queue[0] = start;
    let head = 0,
      count = 1,
      left = w,
      top = h,
      right = 0,
      bottom = 0;
    while (head < count) {
      const p = queue[head++],
        x = p % w,
        y = Math.floor(p / w);
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx,
            ny = y + dy,
            n = ny * w + nx;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h || labels[n] || data[n * 4 + 3] < 128) continue;
          labels[n] = id;
          queue[count++] = n;
        }
    }
    if (count >= minimum) parts.push({ id, count, left, top, right, bottom });
  }
  const keep = new Set(parts.map((p) => p.id));
  for (let p = 0; p < w * h; p++) data[p * 4 + 3] = keep.has(labels[p]) ? 255 : 0;
  return { data, w, h, labels, parts };
}
async function simple(name, width, height, trim = false) {
  const s = await subjects(name, name === 'clouds' ? 400 : 100);
  let input = sharp(s.data, { raw: { width: s.w, height: s.h, channels: 4 } });
  if (trim) {
    const left = Math.min(...s.parts.map((p) => p.left)),
      top = Math.min(...s.parts.map((p) => p.top));
    const right = Math.max(...s.parts.map((p) => p.right)),
      bottom = Math.max(...s.parts.map((p) => p.bottom));
    input = input.extract({ left, top, width: right - left + 1, height: bottom - top + 1 });
  }
  const paddedCloud = v2 && name === 'clouds';
  input = input.resize(paddedCloud ? width - 32 : width, height, {
    fit: trim ? 'contain' : 'fill',
    kernel: 'nearest',
    background: '#00000000',
  });
  if (paddedCloud) input = input.extend({ left: 16, right: 16, top: 0, bottom: 0, background: '#00000000' });
  await input.png().toFile(path(`native/${name}.png`));
}
await simple('background', 192, 240);
await simple('clouds', 384, 64, true);
await simple('logo', 176, 44, true);
if (v2) {
  // One opaque RGB value per native row: exact framebuffer gradient, no dithering.
  const sky = Buffer.alloc(192 * 240 * 4);
  for (let y = 0; y < 240; y++) {
    const t = Math.min(y / 150, 1);
    const rgb = [0, 103, 255].map((a, i) => Math.round(a + ([65, 199, 255][i] - a) * t));
    for (let x = 0; x < 192; x++) {
      const p = (y * 192 + x) * 4;
      sky[p] = rgb[0];
      sky[p + 1] = rgb[1];
      sky[p + 2] = rgb[2];
      sky[p + 3] = 255;
    }
  }
  await sharp(sky, { raw: { width: 192, height: 240, channels: 4 } })
    .png()
    .toFile(path('native/sky.png'));
}
const characters = [
  { name: 'taiko', height: 132, count: 4, x: 43, y: v2 ? 190 : 185, phaseMs: 0 },
  { name: 'anchor', height: 142, count: 4, x: 100, y: v2 ? 190 : 185, phaseMs: 1500 },
  { name: 'riot', height: 110, count: 2, x: 158, y: v2 ? 192 : 185, phaseMs: 2700 },
];
const audit = [];
for (const c of characters) {
  const s = await subjects(c.name, 10000);
  if (s.parts.length !== 4) throw new Error(`${c.name}: expected4 subjects, found${s.parts.length}`);
  s.parts.sort((a, b) => a.top - b.top);
  const poses = [
    s.parts.slice(0, 2).sort((a, b) => a.left - b.left),
    s.parts.slice(2).sort((a, b) => a.left - b.left),
  ].flat();
  const scale = c.height / (poses[0].bottom - poses[0].top + 1);
  const frames = {},
    composite = [];
  for (let i = 0; i < c.count; i++) {
    const p = poses[i],
      sw = p.right - p.left + 1,
      sh = p.bottom - p.top + 1;
    const data = Buffer.alloc(sw * sh * 4);
    let footLeft = s.w,
      footRight = 0;
    for (let y = 0; y < sh; y++)
      for (let x = 0; x < sw; x++) {
        const src = (p.top + y) * s.w + p.left + x;
        if (s.labels[src] !== p.id) continue;
        s.data.copy(data, (y * sw + x) * 4, src * 4, src * 4 + 4);
        if (y >= sh - 8) {
          footLeft = Math.min(footLeft, x);
          footRight = Math.max(footRight, x);
        }
      }
    const width = Math.round(sw * scale),
      height = Math.round(sh * scale);
    // Stable feet for standing figures; whole seated silhouette centre for Riot.
    const sourceAnchor = c.name === 'riot' ? sw / 2 : (footLeft + footRight) / 2;
    const left = 56 - Math.round(sourceAnchor * scale),
      top = 156 - height;
    if (left < 0 || top < 0 || left + width > 112 || top + height > 160)
      throw new Error(`${c.name}/${i} clips`);
    const pose = await sharp(data, { raw: { width: sw, height: sh, channels: 4 } })
      .resize(width, height, { kernel: 'nearest' })
      .png()
      .toBuffer();
    const frame = await sharp({ create: { width: 112, height: 160, channels: 4, background: '#00000000' } })
      .composite([{ input: pose, left, top }])
      .png()
      .toBuffer();
    writeFileSync(new URL(`native/${c.name}-${i}.png`, folder), frame);
    const x = (i % 2) * 112,
      y = Math.floor(i / 2) * 160;
    composite.push({ input: frame, left: x, top: y });
    frames[`idle${i}`] = {
      frame: { x, y, w: 112, h: 160 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 112, h: 160 },
      sourceSize: { w: 112, h: 160 },
    };
    audit.push({
      character: c.name,
      frame: i,
      scale,
      source: p,
      placed: { left, top, width, height },
      origin: [56, 156],
    });
  }
  const sheetHeight = c.count > 2 ? 320 : 160;
  await sharp({ create: { width: 224, height: sheetHeight, channels: 4, background: '#00000000' } })
    .composite(composite)
    .png()
    .toFile(path(`native/${c.name}.png`));
  write(`native/${c.name}.json`, {
    frames,
    meta: { image: `${c.name}.png`, size: { w: 224, h: sheetHeight }, scale: '1' },
  });
}
// Reuse the game's actual5x7 glyphs for a native-pixel menu preview.
const glyphSource = readFileSync(new URL('apps/game/src/assets/glyphs.ts', root), 'utf8');
const glyphs = Object.fromEntries(
  [...glyphSource.matchAll(/^  ([A-Z]): '([01 ]+)',/gm)].map((m) => [m[1], m[2]]),
);
write('native/glyphs.json', glyphs);
write('alignment.json', audit);
write('manifest.json', {
  screen: { width: 192, height: 240 },
  sky: '#0874ff',
  skyImage: v2 ? 'sky' : null,
  supports: v2 ? { standingFloorY: 190, seatY: 152, raisedShoeY: 171 } : null,
  characters,
  characterCell: { width: 112, height: 160, origin: [56, 156] },
  drawOrder: ['sky', 'clouds', 'background', 'taiko', 'anchor', 'riot', 'logo', 'menu'],
  logo: { x: 8, y: 2, width: 176, height: 44 },
  clouds: { width: 384, height: 64, y: 45, stepMs: 240 },
  menu: { x: 16, y: 184, width: 160, height: 50, labels: ['PLAY VERSUS CPU', 'PLAY ONLINE', 'OPTIONS'] },
  loops: {
    standing: [
      { frame: 0, ms: 1400 },
      { frame: 1, ms: 650 },
      { frame: 0, ms: 1800 },
      { frame: 2, ms: 130 },
      { frame: 0, ms: 1400 },
      { frame: 3, ms: 700 },
    ],
    seated: [
      { frame: 0, ms: 2000 },
      { frame: 1, ms: 900 },
    ],
  },
  excluded: 'Riot source bottom two poses have clipped hanging shoes. Only complete upper two exported.',
  policy: 'nearest resampling, binary alpha, shared source scale per character, no per-frame normalization',
});
console.log(JSON.stringify(audit.map(({ character, frame, placed }) => ({ character, frame, ...placed }))));
