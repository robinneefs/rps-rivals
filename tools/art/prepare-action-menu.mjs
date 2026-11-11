// Independent action-menu asset kit, never writes production game files.
// node tools/art/prepare-action-menu.mjs (sharp or RPS_SHARP_PATH)
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url),
  sharp = require(process.env.RPS_SHARP_PATH || 'sharp');
const v2 = process.argv.includes('--v2');
const root = new URL('../../', import.meta.url),
  folder = new URL(`art/menus/action-${v2 ? 'v2' : 'v1'}/`, root);
const path = (name) => fileURLToPath(new URL(name, folder));
mkdirSync(new URL('native/', folder), { recursive: true });
const json = (name, data) => writeFileSync(new URL(name, folder), JSON.stringify(data, null, 2));
async function clean(name, trim = false) {
  const { data, info } = await sharp(path(`source/${name}.png`))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width,
    h = info.height,
    seen = new Uint8Array(w * h),
    queue = new Int32Array(w * h);
  let left = w,
    top = h,
    right = 0,
    bottom = 0;
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || data[start * 4 + 3] < 128) continue;
    queue[0] = start;
    seen[start] = 1;
    let head = 0,
      count = 1;
    while (head < count) {
      const p = queue[head++],
        x = p % w,
        y = Math.floor(p / w);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx,
            ny = y + dy,
            n = ny * w + nx;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h || seen[n] || data[n * 4 + 3] < 128) continue;
          seen[n] = 1;
          queue[count++] = n;
        }
    }
    for (let i = 0; i < count; i++) {
      const p = queue[i];
      data[p * 4 + 3] = count >= 100 ? 255 : 0;
      if (count >= 100) {
        const x = p % w,
          y = Math.floor(p / w);
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }
  for (let p = 0; p < w * h; p++) if (data[p * 4 + 3] < 128) data[p * 4 + 3] = 0;
  let image = sharp(data, { raw: { width: w, height: h, channels: 4 } });
  if (trim) image = image.extract({ left, top, width: right - left + 1, height: bottom - top + 1 });
  return image;
}
for (const [name, width, height, trim] of [
  ['riot', 192, 240, false],
  ['speed-lines', 192, 240, false],
  ['paint-streak', v2 ? 224 : 192, v2 ? 120 : 100, true],
  ['logo', 128, 64, true],
]) {
  const image = await clean(name, trim);
  await image
    .resize(width, height, {
      kernel: 'nearest',
      fit: trim && name !== 'paint-streak' ? 'contain' : 'fill',
      background: '#00000000',
    })
    .png()
    .toFile(path(`native/${name}.png`));
}
if (v2) {
  // Compare nearest with area-filtered reduction; harden alpha AFTER the filtered resize.
  const logoSource = await clean('logo', true);
  await sharp(path('native/logo.png')).png().toFile(path('native/logo-nearest.png'));
  const { data, info } = await logoSource
    .resize(128, 64, { fit: 'contain', kernel: 'lanczos3', background: '#00000000' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let p = 3; p < data.length; p += 4) data[p] = data[p] >= 128 ? 255 : 0;
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(path('native/logo-filtered.png'));
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ palette: true, colours: 32, dither: 0 })
    .toFile(path('native/logo-soft.png'));
  // Prefilter at2x, then sample crisply onto the native grid: between soft area filtering and raw nearest.
  const intermediate = await (
    await clean('logo', true)
  )
    .resize(256, 128, { fit: 'contain', kernel: 'lanczos3', background: '#00000000' })
    .png()
    .toBuffer();
  const balanced = await sharp(intermediate)
    .resize(128, 64, { kernel: 'nearest' })
    .ensureAlpha()
    .raw()
    .toBuffer();
  for (let p = 3; p < balanced.length; p += 4) balanced[p] = balanced[p] >= 128 ? 255 : 0;
  await sharp(balanced, { raw: { width: 128, height: 64, channels: 4 } })
    .png({ palette: true, colours: 64, dither: 0 })
    .toFile(path('native/logo.png'));
  const characterFrames = {},
    poses = [];
  for (const [i, name] of ['rest', 'inhale', 'exhale'].entries()) {
    const image = await clean(`riot-${name}`);
    const pose = await image.resize(192, 240, { fit: 'fill', kernel: 'nearest' }).png().toBuffer();
    writeFileSync(new URL(`native/riot-${name}.png`, folder), pose);
    if (i === 0) writeFileSync(new URL('native/riot.png', folder), pose);
    poses.push({ input: pose, left: i * 192, top: 0 });
    characterFrames[name] = {
      frame: { x: i * 192, y: 0, w: 192, h: 240 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 192, h: 240 },
      sourceSize: { w: 192, h: 240 },
    };
  }
  await sharp({ create: { width: 576, height: 240, channels: 4, background: '#00000000' } })
    .composite(poses)
    .png()
    .toFile(path('native/riot-sheet.png'));
  json('native/riot-sheet.json', {
    frames: characterFrames,
    meta: { image: 'riot-sheet.png', size: { w: 576, h: 240 }, scale: '1' },
  });
}
const base = Buffer.alloc(192 * 240 * 4);
for (let y = 0; y < 240; y++)
  for (let x = 0; x < 192; x++) {
    const p = (y * 192 + x) * 4,
      t = y / 239;
    base[p] = 255;
    base[p + 1] = Math.round(48 + 30 * t);
    base[p + 2] = Math.round(61 - 20 * t);
    base[p + 3] = 255;
  }
await sharp(base, { raw: { width: 192, height: 240, channels: 4 } })
  .png()
  .toFile(path('native/background-base.png'));
const composites = [],
  frames = {};
for (let i = 0; i < 4; i++) {
  // Radiate the same line shapes around the focal point; never redraw/randomize them.
  const scale = 1 + i * 0.035,
    w = Math.round(192 * scale),
    h = Math.round(240 * scale);
  const left = Math.round(110 * (scale - 1)),
    top = Math.round(95 * (scale - 1));
  const lines = await sharp(path('native/speed-lines.png'))
    .resize(w, h, { kernel: 'nearest' })
    .extract({ left, top, width: 192, height: 240 })
    .png()
    .toBuffer();
  writeFileSync(new URL(`native/speed-${i}.png`, folder), lines);
  const frame = await sharp(base, { raw: { width: 192, height: 240, channels: 4 } })
    .composite([{ input: lines, left: 0, top: 0 }])
    .png()
    .toBuffer();
  writeFileSync(new URL(`native/background-${i}.png`, folder), frame);
  composites.push({ input: frame, left: i * 192, top: 0 });
  frames[`speed${i}`] = {
    frame: { x: i * 192, y: 0, w: 192, h: 240 },
    rotated: false,
    trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: 192, h: 240 },
    sourceSize: { w: 192, h: 240 },
  };
}
await sharp({ create: { width: 768, height: 240, channels: 4, background: '#00000000' } })
  .composite(composites)
  .png()
  .toFile(path('native/background-sheet.png'));
json('native/background-sheet.json', {
  frames,
  meta: { image: 'background-sheet.png', size: { w: 768, h: 240 }, scale: '1' },
});
// Bundle a real pixel font and rasterize at native resolution, with integer stepped slant.
execFileSync(process.env.RPS_PYTHON || 'python', [
  fileURLToPath(new URL('tools/art/prepare-action-labels.py', root)),
  ...(v2 ? ['--v2'] : []),
]);
if (v2)
  execFileSync(process.env.RPS_PYTHON || 'python', [
    fileURLToPath(new URL('tools/art/prepare-native-font-study.py', root)),
  ]);
if (v2)
  execFileSync(process.env.RPS_PYTHON || 'python', [
    fileURLToPath(new URL('tools/art/prepare-menu-font.py', root)),
  ]);
const labels = ['PLAY VERSUS CPU', 'PLAY ONLINE', 'OPTIONS'];
const labelFrames = {},
  labelComposites = [];
for (let item = 0; item < 3; item++)
  for (let selected = 0; selected < 2; selected++) {
    const key = `${['cpu', 'online', 'options'][item]}-${selected ? 'selected' : 'normal'}`,
      row = item * 2 + selected;
    const png = await sharp(path(`native/${key}.png`))
      .png()
      .toBuffer();
    labelComposites.push({ input: png, left: 0, top: row * 20 });
    labelFrames[key] = {
      frame: { x: 0, y: row * 20, w: 176, h: 20 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 176, h: 20 },
      sourceSize: { w: 176, h: 20 },
    };
  }
await sharp({ create: { width: 176, height: 120, channels: 4, background: '#00000000' } })
  .composite(labelComposites)
  .png()
  .toFile(path('native/labels.png'));
json('native/labels.json', {
  frames: labelFrames,
  meta: { image: 'labels.png', size: { w: 176, h: 120 }, scale: '1' },
});
// A distinct arrow asset: menu selection doesn't alter the painted backplate.
const arrow = Buffer.alloc(9 * 11 * 4);
for (let y = 0; y < 11; y++)
  for (let x = 0; x < 9 - Math.abs(y - 5); x++) {
    const p = (y * 9 + x) * 4;
    arrow[p] = 255;
    arrow[p + 1] = 222;
    arrow[p + 2] = 33;
    arrow[p + 3] = 255;
  }
await sharp(arrow, { raw: { width: 9, height: 11, channels: 4 } })
  .png()
  .toFile(path('native/arrow.png'));
json('manifest.json', {
  screen: { width: 192, height: 240 },
  drawOrder: ['background', 'character', 'logo', 'paint-streak', 'labels', 'arrow'],
  character: { id: 'riot', image: 'native/riot.png', x: 0, y: 0, width: 192, height: 240, replaceable: true },
  characterLoop: v2
    ? { frames: [0, 1, 0, 2, 0], durations: [2000, 240, 160, 260, 180], atlas: 'native/riot-sheet.json' }
    : null,
  logo: { x: 6, y: 2, width: 128, height: 64 },
  paint: v2 ? { x: -16, y: 142, width: 224, height: 120 } : { x: 0, y: 140, width: 192, height: 100 },
  menu: {
    labels,
    x: 8,
    // Slightly below center, with 12 native pixels beneath the last glyph/shadow.
    ys: v2 ? [176, 196, 216] : [172, 192, 212],
    labelCell: [176, 20],
    arrowX: 28,
    arrowOffsetY: 3,
    labelWidths: [100, 74, 48],
  },
  defaultFont: v2 ? 'm6x11-native-16' : 'jersey-10',
  fontSizes: v2 ? [14, 16, 18, 20] : null,
  defaultFontSize: v2 ? 16 : null,
  background: {
    atlas: 'native/background-sheet.json',
    frames: [0, 1, 2, 3, 2, 1],
    frameMs: 140,
    focalPoint: [110, 95],
    motion: 'radial pulse from a single generated source; no frame-to-frame AI redraw',
  },
  notes:
    'Home-screen kit only. Character is static; menu/character/title/background are independent. Runtime preview uses true integer native pixels.',
});
console.log('Prepared action menu:4 background frames, separated Riot/logo/paint,6 label states and arrow.');
