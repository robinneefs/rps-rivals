import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const sharp = createRequire(import.meta.url)(process.env.RPS_SHARP_PATH || 'sharp');
const folder = 'art/menus/pixel-perfect-v1';
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' }),
  results = [],
  errors = [];
try {
  for (const [width, height, dpr] of [
    [600, 1000, 1],
    [600, 1000, 1.25],
    [390, 664, 2],
    [390, 664, 3],
    [1280, 720, 1.5],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: dpr,
      reducedMotion: 'reduce',
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => {
      if (!localStorage.getItem('rps-fighter.settings'))
        localStorage.setItem('rps-fighter.settings', JSON.stringify({ pixelPerfect: true, crt: true }));
    });
    await page.goto('http://127.0.0.1:5181/');
    await page.waitForFunction(() => window.__rps?.scenes().includes('Home'));
    await page.waitForTimeout(600);
    const box = await page.locator('#game canvas').boundingBox(),
      n = Math.round((box.width * dpr) / 192);
    const close = (a, b) => Math.abs(a - b) < 0.04;
    if (
      !close(box.width * dpr, n * 192) ||
      !close(box.height * dpr, n * 240) ||
      !close(box.x * dpr, Math.round(box.x * dpr)) ||
      !close(box.y * dpr, Math.round(box.y * dpr))
    )
      throw Error(`Bad grid ${JSON.stringify({ width, height, dpr, box, n })}`);
    // Compare all interior device-pixel blocks, away from the CRT corners/bezel.
    const png = await page.screenshot();
    const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let broken = 0;
    const ox = Math.round(box.x * dpr),
      oy = Math.round(box.y * dpr);
    for (let y = 10; y < 230; y++)
      for (let x = 10; x < 182; x++) {
        const p = ((oy + y * n) * info.width + ox + x * n) * 4;
        let mismatch = false;
        for (let dy = 0; dy < n; dy++)
          for (let dx = 0; dx < n; dx++) {
            const q = ((oy + y * n + dy) * info.width + ox + x * n + dx) * 4;
            if (data[p] !== data[q] || data[p + 1] !== data[q + 1] || data[p + 2] !== data[q + 2])
              mismatch = true;
          }
        if (mismatch) broken++;
      }
    if (broken) throw Error(`${broken} unequal pixel blocks at DPR${dpr}`);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__rps.scenes().includes('Options'));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${folder}/${width}-${dpr}-options.png` });
    // Toggle using the actual monitor row, then confirm reflow and storage.
    let b = await page.locator('#game canvas').boundingBox();
    await page.mouse.click(b.x + b.width * 0.7, b.y + (b.height * 92) / 240);
    await page.waitForTimeout(100);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('rps-fighter.settings')));
    if (saved.pixelPerfect !== false) throw Error('Options toggle failed');
    b = await page.locator('#game canvas').boundingBox();
    await page.mouse.click(b.x + b.width * 0.7, b.y + (b.height * 92) / 240);
    await page.waitForTimeout(100);
    if (!(await page.evaluate(() => JSON.parse(localStorage.getItem('rps-fighter.settings')).pixelPerfect)))
      throw Error('Reenable failed');
    await page.reload();
    await page.waitForFunction(() => window.__rps?.scenes().includes('Home'));
    if (!(await page.evaluate(() => JSON.parse(localStorage.getItem('rps-fighter.settings')).pixelPerfect)))
      throw Error('Preference did not persist');
    await page.setViewportSize({ width: width + 77, height: height + 121 });
    await page.waitForTimeout(150);
    const resized = await page.locator('#game canvas').boundingBox();
    if (
      !close((resized.width * dpr) / 192, Math.round((resized.width * dpr) / 192)) ||
      !close((resized.height * dpr) / 240, Math.round((resized.height * dpr) / 240))
    )
      throw Error('Resize broke integer scale');
    results.push({ width, height, dpr, multiple: n, brokenBlocks: broken });
    await page.close();
  }
  const preview = await browser.newPage();
  preview.on('pageerror', (e) => errors.push(e.message));
  await preview.goto('http://127.0.0.1:5184/?menuReview=characters');
  await preview.waitForFunction(() => window.__rps?.scenes().includes('CharacterSelect'));
  if (!(await preview.evaluate(() => window.__rps.characterSelection()?.available)))
    throw Error('Character preview not ready');
  await preview.close();
  if (errors.length) throw Error(errors.join('\n'));
  writeFileSync(`${folder}/checks.json`, JSON.stringify({ results, errors }, null, 2));
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
