// Requires the standalone preview server at127.0.0.1:5177.
import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const sharp = require(process.env.RPS_SHARP_PATH || 'sharp');
const actionV2 = process.argv.includes('--action-v2');
const action = process.argv.includes('--action') || actionV2;
const v2 = process.argv.includes('--v2') || action;
const folder = new URL(
  action
    ? `../../art/menus/action-${actionV2 ? 'v2' : 'v1'}/`
    : `../../art/menus/rooftop-crew-${v2 ? 'v2' : 'v1'}/`,
  import.meta.url,
);
mkdirSync(new URL('review-frames/', folder), { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
try {
  await page.goto(`http://127.0.0.1:${actionV2 ? 5180 : action ? 5179 : v2 ? 5178 : 5177}/preview.html`);
  await page.waitForFunction(() => window.menuReady);
  await page.locator('#animate').uncheck();
  if (actionV2) await page.locator('#breathe').uncheck();
  const displayed = await page.locator('canvas').screenshot();
  const { data: displayPixels, info: displayInfo } = await sharp(displayed)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const displayScale = displayInfo.width / 192;
  let brokenCells = 0;
  if (v2) {
    if (!Number.isInteger(displayScale) || displayInfo.height !== 240 * displayScale)
      throw new Error('Fractional preview enlargement');
    for (let y = 0; y < 240; y++)
      for (let x = 0; x < 192; x++) {
        const first = (y * displayScale * displayInfo.width + x * displayScale) * 4;
        let broken = false;
        for (let dy = 0; dy < displayScale; dy++)
          for (let dx = 0; dx < displayScale; dx++) {
            const p = ((y * displayScale + dy) * displayInfo.width + x * displayScale + dx) * 4;
            if (!displayPixels.subarray(first, first + 4).equals(displayPixels.subarray(p, p + 4)))
              broken = true;
          }
        if (broken) brokenCells++;
      }
    if (brokenCells) throw new Error(`${brokenCells} enlarged cells are not uniform`);
  }
  const grid = {
    displaySize: [displayInfo.width, displayInfo.height],
    displayScale,
    brokenCells: v2 ? brokenCells : null,
  };
  if (action)
    await page.evaluate(() => {
      window.captureMotion = true;
    });
  for (let i = 0; i < 80; i++) {
    const url = await page.evaluate((t) => {
      window.renderMenuAt(t);
      return document.querySelector('canvas').toDataURL();
    }, i * 100);
    const data = Buffer.from(url.split(',')[1], 'base64');
    writeFileSync(new URL(`review-frames/${String(i).padStart(3, '0')}.png`, folder), data);
    if (i === 0) {
      writeFileSync(new URL('assembled-192x240.png', folder), data);
      await sharp(data)
        .resize(768, 960, { kernel: 'nearest' })
        .png()
        .toFile(fileURLToPath(new URL('assembled-4x.png', folder)));
    }
  }
  const differences = [];
  for (const [name, count] of action
    ? []
    : [
        ['taiko', 4],
        ['anchor', 4],
        ['riot', 2],
      ]) {
    const base = await sharp(fileURLToPath(new URL(`native/${name}-0.png`, folder)))
      .raw()
      .toBuffer();
    for (let i = 1; i < count; i++) {
      const pixels = await sharp(fileURLToPath(new URL(`native/${name}-${i}.png`, folder)))
        .raw()
        .toBuffer();
      let changed = 0,
        partial = 0;
      for (let p = 0; p < pixels.length; p += 4) {
        if (pixels[p + 3] !== 0 && pixels[p + 3] !== 255) partial++;
        if (!base.subarray(p, p + 4).equals(pixels.subarray(p, p + 4))) changed++;
      }
      if (partial) throw new Error(`${name} has soft alpha`);
      differences.push({ name, frame: i, changedPixels: changed, partialAlpha: partial });
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  const assets = [];
  if (action) {
    for (const name of readdirSync(new URL('native/', folder)).filter((n) => n.endsWith('.png'))) {
      const { data, info } = await sharp(fileURLToPath(new URL(`native/${name}`, folder)))
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      let partialAlpha = 0;
      for (let p = 3; p < data.length; p += 4) if (data[p] !== 0 && data[p] !== 255) partialAlpha++;
      if (partialAlpha) throw new Error(`${name} has partial alpha`);
      assets.push({ name, width: info.width, height: info.height, partialAlpha });
    }
    const base = await sharp(fileURLToPath(new URL('native/background-0.png', folder)))
      .raw()
      .toBuffer();
    for (let i = 1; i < 4; i++) {
      const frame = await sharp(fileURLToPath(new URL(`native/background-${i}.png`, folder)))
        .raw()
        .toBuffer();
      let changed = 0;
      for (let p = 0; p < frame.length; p += 4)
        if (!base.subarray(p, p + 4).equals(frame.subarray(p, p + 4))) changed++;
      if (!changed) throw new Error('Background motion frames are identical');
      differences.push({ name: 'background', frame: i, changedPixels: changed });
    }
    for (const value of ['character', 'background', 'logo', 'menu', 'paint', 'all'])
      await page.locator('#view').selectOption(value);
    for (let i = 0; i < 3; i++) await page.locator('#selected').selectOption({ index: i });
    await page.locator('#selected').selectOption({ index: 0 });
    if (actionV2) {
      const fontPreviews = [];
      for (const [index, size] of ['bitmap', 14, 16, 18, 20].entries()) {
        await page.locator('#font-size').selectOption(String(size));
        const url = await page.evaluate(() => {
          window.captureMotion = false;
          window.renderMenuAt(0);
          return document.querySelector('canvas').toDataURL();
        });
        const data = Buffer.from(url.split(',')[1], 'base64');
        writeFileSync(new URL(`font-${size}-192x240.png`, folder), data);
        fontPreviews.push({ input: data, left: index * 192, top: 0 });
      }
      await sharp({ create: { width: 960, height: 240, channels: 4, background: '#00000000' } })
        .composite(fontPreviews)
        .png()
        .toFile(fileURLToPath(new URL('font-size-comparison.png', folder)));
      await page.locator('#font-size').selectOption('bitmap');
      for (const value of ['logo', 'logo-soft', 'logo-filtered', 'logo-nearest'])
        await page.locator('#logo-export').selectOption(value);
      await page.locator('#logo-export').selectOption('logo');
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  writeFileSync(
    new URL('validation.json', folder),
    JSON.stringify({ canvas: [192, 240], grid, pageErrors: errors, differences, assets }, null, 2),
  );
  console.log(JSON.stringify({ canvas: [192, 240], grid, pageErrors: errors, differences }));
} finally {
  await browser.close();
}
