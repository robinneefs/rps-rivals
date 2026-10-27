// Review exports only; does not change runtime assets.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const sharp = require(process.env.RPS_SHARP_PATH || 'sharp');
const concept = process.argv.includes('--action') ? 'main-menu-action-v1' : 'main-menu-rooftop-v2';
const folder = new URL(`../../docs/mockups/v2/${concept}/`, import.meta.url);
await sharp(fileURLToPath(new URL('generated.png', folder)))
  .resize(192, 240, { fit: 'fill', kernel: 'nearest' })
  .png().toFile(fileURLToPath(new URL('native-192x240.png', folder)));
await sharp(fileURLToPath(new URL('native-192x240.png', folder)))
  .resize(768, 960, { kernel: 'nearest' })
  .png().toFile(fileURLToPath(new URL('review-4x.png', folder)));
