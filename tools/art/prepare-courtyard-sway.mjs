// Rotate native cutouts around their fixed hanging points, sampling whole pixels only.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const sharp = createRequire(import.meta.url)(process.env.RPS_SHARP_PATH || 'sharp');
const root = 'art/stages/lantern-courtyard-layers-v1';
const W = 192,
  H = 240,
  frames = 15;
const lanterns = [
  { id: 'left', pivot: [23, 89] },
  { id: 'right', pivot: [168, 89] },
  { id: 'far-right', pivot: [189, 100] },
];
for (const l of lanterns)
  for (const kind of ['lantern', 'glow']) {
    const name = `${kind}-${l.id}`;
    const data = await sharp(`${root}/layers/${name}.png`).ensureAlpha().raw().toBuffer();
    const sheet = Buffer.alloc(W * frames * H * 4);
    for (let frame = 0; frame < frames; frame++) {
      const radians = ((frame - 7) * Math.PI) / 180,
        c = Math.cos(radians),
        s = Math.sin(radians);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const dx = x - l.pivot[0],
            dy = y - l.pivot[1];
          const sx = Math.round(c * dx + s * dy + l.pivot[0]),
            sy = Math.round(-s * dx + c * dy + l.pivot[1]);
          if (sx < 0 || sx >= W || sy < 0 || sy >= H) continue;
          const from = (sy * W + sx) * 4;
          data.copy(sheet, (y * W * frames + frame * W + x) * 4, from, from + 4);
        }
    }
    await sharp(sheet, { raw: { width: W * frames, height: H, channels: 4 } })
      .png({ palette: true, colours: 40, dither: 0 })
      .toFile(`apps/game/public/assets/stages/courtyard/${name}-sway.png`);
  }
writeFileSync(
  `${root}/sway.json`,
  JSON.stringify(
    {
      frames,
      frameWidth: W,
      frameHeight: H,
      neutralFrame: 7,
      anglesDegrees: [-7, 7],
      sampling: 'nearest',
      lanterns,
    },
    null,
    2,
  ),
);
console.log('Exported15 fixed-pivot pendulum frames for each lantern and matching glow.');
