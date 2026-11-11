// Install only the image-generated lower bezel patch; preserve all other cabinet pixels.
import { createRequire } from 'node:module';
const sharp = createRequire(import.meta.url)(process.env.RPS_SHARP_PATH || 'sharp');
const normalized = await sharp('art/cabinet/marquee-rail/generated-purple.png')
  .resize(1200, 407, { fit: 'fill' })
  .toBuffer();
await sharp(normalized)
  .extract({ left: 65, top: 300, width: 1086, height: 90 })
  .resize(1466, 110, { fit: 'fill' })
  .webp({ quality: 95 })
  .toFile('apps/game/public/assets/cabinet/marquee-bottom-rail.webp');
