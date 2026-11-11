import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
const sharp = createRequire(import.meta.url)(process.env.RPS_SHARP_PATH || 'sharp');
const feet = {};
if (!process.argv.includes('--water-only')) {
  for (const [id, key] of [
    ['taiko', 'fighter-p1'],
    ['riot', 'fighter-p2'],
    ['anchor', 'fighter-anchor'],
  ]) {
    const atlas = JSON.parse(readFileSync(`apps/game/public/assets/${id}.json`));
    feet[key] = {};
    for (const [pose, entry] of Object.entries(atlas.frames)) {
      if (pose === 'ko' || pose === 'kick') continue;
      const f = entry.frame;
      const pixels = await sharp(`apps/game/public/assets/${id}.png`)
        .extract({ left: f.x, top: f.y, width: f.w, height: f.h })
        .ensureAlpha()
        .raw()
        .toBuffer();
      let bottom = 0;
      for (let y = 0; y < f.h; y++)
        for (let x = 0; x < f.w; x++) if (pixels[(y * f.w + x) * 4 + 3] > 127) bottom = y;
      let left = f.w,
        right = 0;
      for (let y = Math.max(0, bottom - 7); y <= bottom; y++)
        for (let x = 0; x < f.w; x++)
          if (pixels[(y * f.w + x) * 4 + 3] > 127) {
            left = Math.min(left, x);
            right = Math.max(right, x);
          }
      feet[key][pose] = { left: left - 3, width: right - left + 7 };
    }
  }
  writeFileSync(
    'apps/game/src/config/fighterFootprints.ts',
    '// Generated from the bottom eight opaque rows of each approved native pose.\nexport const FIGHTER_FOOTPRINTS: Record<string, Record<string, { left: number; width: number }>> = ' +
      JSON.stringify(feet, null, 2) +
      ';\n',
  );
}
const dir = 'apps/game/public/assets/stages/harbor';
const source = await sharp(`${dir}/water-base.png`)
  .composite([{ input: `${dir}/water-reflections.png` }])
  .ensureAlpha()
  .raw()
  .toBuffer();
const frames = 12,
  W = 192,
  H = 240,
  sheet = Buffer.alloc(W * frames * H * 4);
for (let frame = 0; frame < frames; frame++)
  for (let y = 133; y < 240; y++) {
    // Entire-water motion in short stepped bands; subpixel sampling is never used.
    const shift = Math.round(4 * Math.sin(Math.floor((y - 133) / 3) * 0.65 - (frame / frames) * Math.PI * 2));
    for (let x = 0; x < W; x++) {
      const sx = (x + shift + W) % W;
      source.copy(sheet, (y * W * frames + frame * W + x) * 4, (y * W + sx) * 4, (y * W + sx + 1) * 4);
    }
  }
await sharp(sheet, { raw: { width: W * frames, height: H, channels: 4 } })
  .png({ palette: true, colours: 40, dither: 0 })
  .toFile(`${dir}/water-wave.png`);
console.log('Measured grounded stance footprints and exported 12 native water ripple frames.');
