// Remove black padding and center-crop the latest supplied artwork to fill the marquee opening.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const sharp = require(process.env.RPS_SHARP_PATH || 'sharp');
const source = 'art/cabinet/marquee-v4/source.png';
const { data, info } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const rows = [];
for (let y = 0; y < info.height; y++) {
  let lit = 0;
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * info.channels;
    if (Math.max(data[i], data[i + 1], data[i + 2]) > 40) lit++;
  }
  if (lit > info.width / 2) rows.push(y);
}
if (!rows.length) throw new Error('No marquee artwork found');
const top = rows[0],
  height = rows.at(-1) - top + 1;
const output = 'apps/game/public/assets/cabinet/marquee-v4.webp';
await sharp(source)
  .extract({ left: 0, top, width: info.width, height })
  .resize(1466, 322, { fit: 'cover', position: 'centre', kernel: 'lanczos3' })
  .webp({ quality: 95 })
  .toFile(output);
writeFileSync(
  'art/cabinet/marquee-v4/export.json',
  JSON.stringify(
    {
      source: [info.width, info.height],
      removePadding: { top, height },
      output,
      pixels: [1466, 322],
      cabinetWindow: { x: 104, y: 46, width: 733, height: 161 },
      fit: 'cover',
      position: 'center',
    },
    null,
    2,
  ) + '\n',
);
console.log(`Exported full-width marquee from source rows ${top}..${top + height - 1}, 1466x322.`);
