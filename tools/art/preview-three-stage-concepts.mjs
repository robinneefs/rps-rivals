// Review-only network overrides: no production stage registration or assets are changed.
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const harborV3 = process.argv.includes('--harbor-v3');
const harborV2 = process.argv.includes('--harbor-v2');
const out = harborV3
  ? 'art/stages/sunset-harbor-v3'
  : harborV2
    ? 'art/stages/sunset-harbor-v2'
    : 'art/stages/three-stage-concepts-v1';
const ids =
  harborV3 || harborV2 ? ['sunset-harbor'] : ['sunset-harbor', 'lantern-courtyard', 'foundry-floor'];
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [];
try {
  const helper = await browser.newPage();
  const resize = async (source, width, height) =>
    Buffer.from(
      await helper.evaluate(
        async ({ source, width, height }) => {
          const image = new Image();
          image.src = source;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(image, 0, 0, width, height);
          return canvas.toDataURL().split(',')[1];
        },
        { source, width, height },
      ),
      'base64',
    );
  for (const id of ids) {
    const source = `data:image/png;base64,${readFileSync(`${out}/${id}-source.png`).toString('base64')}`;
    let native = await resize(source, 192, 240);
    if (harborV3) {
      const sharp = createRequire(import.meta.url)(process.env.RPS_SHARP_PATH || 'sharp');
      native = await sharp(native).png({ palette: true, colours: 40, dither: 0 }).toBuffer();
      const metadata = await sharp(native).metadata();
      writeFileSync(
        `${out}/export.json`,
        JSON.stringify(
          {
            width: metadata.width,
            height: metadata.height,
            paletteLimit: 40,
            dither: 0,
            sampling: 'nearest',
            reference: 'rooftop-v2',
          },
          null,
          2,
        ),
      );
    }
    writeFileSync(`${out}/${id}-192.png`, native);
    const page = await browser.newPage({ viewport: { width: 600, height: 1000 }, reducedMotion: 'reduce' });
    page.on('pageerror', (e) => errors.push(`${id}: ${e.message}`));
    page.on('response', (r) => {
      if (r.status() >= 400) errors.push(`${id}: ${r.status()} ${r.url()}`);
    });
    await page.route('**/assets/stages/rooftop-v2-192.png', (route) =>
      route.fulfill({ contentType: 'image/png', body: native }),
    );
    await page.addInitScript(() => {
      Math.random = () => 0;
      localStorage.setItem('rps-fighter.settings', JSON.stringify({ crt: true, muted: true }));
    });
    await page.goto('http://127.0.0.1:5190/?menuReview=stage&stage=rooftop');
    await page.waitForFunction(() => window.__rps?.scenes().includes('Fight'));
    await page.waitForFunction(() => window.__rps.phase() === 'picking');
    await page.waitForTimeout(450);
    const fighters = await page.evaluate(() => window.__rps.combatTextures());
    if (fighters.length !== 2) throw Error(`Missing actual fighters for ${id}`);
    const snapshot = await page.evaluate(() => window.__rps.snapshot());
    writeFileSync(`${out}/${id}-gameplay.png`, await resize(snapshot, 576, 720));
    await page.screenshot({ path: `${out}/${id}-cabinet.png` });
    await page.setViewportSize({ width: 390, height: 664 });
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${out}/${id}-phone.png` });
    console.log(`${id}: actual fighters ${fighters.join(', ')}; monitor, cabinet and phone captured`);
    await page.close();
  }
  writeFileSync(
    `${out}/review-checks.json`,
    JSON.stringify(
      {
        errors,
        stages: ids,
        note: 'Static review-only background overrides; original game fighters, HUD and CRT.',
      },
      null,
      2,
    ),
  );
  if (errors.length) throw Error(errors.join('\n'));
} finally {
  await browser.close();
}
