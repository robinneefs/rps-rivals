// Export image-generated art onto the game's actual pixel grid. No runtime image scaling.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const sharp = require(process.env.RPS_SHARP_PATH || 'sharp');
const input = 'art/stages/rooftop-v2/';
const out = 'apps/game/public/assets/stages/';
const width = 192;
const height = 240;
const { data: stage } = await sharp(`${input}generated-stage.png`)
  .resize(width, height, { fit: 'fill', kernel: 'nearest' })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

// Remove only border-connected clear sky, so clouds can pass BEHIND the skyline and rail.
// The source deliberately uses a uniform cobalt sky distinct from the darker building faces.
const seen = new Uint8Array(width * height);
const queue = Array.from({ length: width }, (_, x) => x);
for (let head = 0; head < queue.length; head++) {
  const p = queue[head];
  if (p < 0 || p >= width * height || seen[p]) continue;
  seen[p] = 1;
  const i = p * 4;
  if (stage[i] > 10 || Math.abs(stage[i + 1] - 103) > 16 || stage[i + 2] < 242) continue;
  stage[i + 3] = 0;
  const x = p % width;
  if (x > 0) queue.push(p - 1);
  if (x < width - 1) queue.push(p + 1);
  queue.push(p - width, p + width);
}
// HUD-safe area is an enforced export contract, not just a prompt suggestion.
for (let y = 0; y < 72; y++) for (let x = 0; x < width; x++) stage[(y * width + x) * 4 + 3] = 0;
await sharp(stage, { raw: { width, height, channels: 4 } })
  .png({ palette: true, colours: 40, dither: 0 })
  .toFile(`${out}rooftop-v2-192.png`);

const { data: cloud, info } = await sharp(`${input}generated-clouds.png`)
  .resize({ width: 576, kernel: 'nearest' })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
// Binary alpha and removal of disconnected generation speckles keep the exported cloud edges crisp.
const visited = new Uint8Array(info.width * info.height);
let top = info.height,
  bottom = -1;
for (let p = 0; p < visited.length; p++) {
  if (visited[p] || cloud[p * 4 + 3] < 192) continue;
  const component = [p];
  visited[p] = 1;
  for (let head = 0; head < component.length; head++) {
    const at = component[head],
      x = at % info.width;
    for (const next of [
      x > 0 ? at - 1 : -1,
      x < info.width - 1 ? at + 1 : -1,
      at - info.width,
      at + info.width,
    ]) {
      if (next < 0 || next >= visited.length || visited[next] || cloud[next * 4 + 3] < 192) continue;
      visited[next] = 1;
      component.push(next);
    }
  }
  if (component.length < 30) {
    for (const at of component) cloud[at * 4 + 3] = 0;
    continue;
  }
  for (const at of component) {
    top = Math.min(top, Math.floor(at / info.width));
    bottom = Math.max(bottom, Math.floor(at / info.width));
  }
}
if (bottom < top) throw new Error('No cloud silhouettes found');
for (let i = 0; i < cloud.length; i += 4) {
  cloud[i + 3] = cloud[i + 3] >= 192 ? 255 : 0;
  if (!cloud[i + 3]) cloud[i] = cloud[i + 1] = cloud[i + 2] = 0;
}
const cloudHeight = bottom - top + 1;
if (cloudHeight > 64) throw new Error(`Clouds exceed 64px band: ${cloudHeight}`);
await sharp(cloud, { raw: { width: info.width, height: info.height, channels: 4 } })
  .extract({ left: 0, top, width: 576, height: cloudHeight })
  .extend({ top: 0, bottom: 64 - cloudHeight, left: 0, right: 0, background: '#00000000' })
  .png({ palette: true, colours: 8, dither: 0 })
  .toFile(`${out}rooftop-clouds-576.png`);
writeFileSync(
  `${input}export.json`,
  JSON.stringify(
    {
      stage: [192, 240],
      hudSafeRows: [0, 47],
      baseClearRows: [0, 71],
      clouds: [576, 64],
      cloudY: 52,
      skyColour: '#0066fe',
      cloudStepMs: 200,
    },
    null,
    2,
  ) + '\n',
);
console.log(`Exported 192x240 stage and 576x64 cloud strip (${cloudHeight}px silhouettes).`);
