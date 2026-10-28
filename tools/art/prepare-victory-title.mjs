// Extract only the approved brush lettering; portrait/background/menu remain separate live layers.
import { createRequire } from 'node:module';
const sharp = createRequire(import.meta.url)(process.env.RPS_SHARP_PATH || 'sharp');
const { data, info } = await sharp('art/menus/victory-v1/approved-concept.png')
  .extract({ left: 40, top: 80, width: 1060, height: 300 })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) {
  const [r, g, b] = data.subarray(i, i + 3);
  const gold = r > 190 && g > 175 && b < 155;
  const pink = r > 190 && g < 150 && b > 75 && b < 190;
  // Deep plum shadow separates the gold face from both hair and background bursts.
  data[i] = gold ? 255 : 41;
  data[i + 1] = gold ? 211 : 19;
  data[i + 2] = gold ? 92 : 55;
  data[i + 3] = gold || pink ? 255 : 0;
}
const native = await sharp(data, { raw: info }).resize(184, 52, { kernel: 'nearest' }).raw().toBuffer();
// Discard isolated source-texture specks, retaining the headline and exclamation mark.
const visited = new Set();
for (let pixel = 0; pixel < 184 * 52; pixel++) {
  if (visited.has(pixel) || !native[pixel * 4 + 3]) continue;
  const component = [],
    pending = [pixel];
  visited.add(pixel);
  while (pending.length) {
    const p = pending.pop();
    component.push(p);
    const x = p % 184,
      y = Math.floor(p / 184);
    for (const [nx, ny] of [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]) {
      if (nx < 0 || nx >= 184 || ny < 0 || ny >= 52) continue;
      const n = ny * 184 + nx;
      if (!visited.has(n) && native[n * 4 + 3]) {
        visited.add(n);
        pending.push(n);
      }
    }
  }
  // A detached gold source-art fragment below the C/T is decorative debris,
  // not lettering. Keep the exclamation dot and all actual brush strokes.
  const belowCT = component.every((p) => p % 184 >= 66 && p % 184 <= 74 && Math.floor(p / 184) >= 46);
  if (component.length < 9 || belowCT) for (const p of component) native[p * 4 + 3] = 0;
}
await sharp(native, { raw: { width: 184, height: 52, channels: 4 } })
  .png()
  .toFile('apps/game/public/assets/menus/action/victory-title.png');
