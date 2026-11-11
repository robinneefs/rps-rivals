import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const folder = 'art/menus/victory-v1';
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [],
  checks = [];
try {
  for (const spec of [
    {
      name: 'desktop',
      width: 600,
      height: 1000,
      crt: true,
      pixelPerfect: false,
      reducedMotion: 'no-preference',
    },
    {
      name: 'desktop-crt-off',
      width: 600,
      height: 1000,
      crt: false,
      pixelPerfect: false,
      reducedMotion: 'reduce',
    },
    { name: 'phone', width: 390, height: 664, crt: true, pixelPerfect: false, reducedMotion: 'reduce' },
    {
      name: 'phone-pixel-perfect',
      width: 390,
      height: 664,
      crt: true,
      pixelPerfect: true,
      reducedMotion: 'reduce',
    },
  ]) {
    const phone = spec.name.startsWith('phone');
    const page = await browser.newPage({
      viewport: { width: spec.width, height: spec.height },
      deviceScaleFactor: phone ? 3 : 1,
      hasTouch: phone,
      isMobile: phone,
      reducedMotion: spec.reducedMotion,
    });
    page.setDefaultTimeout(15000);
    console.log(spec.name);
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    await page.addInitScript(
      (settings) => localStorage.setItem('rps-fighter.settings', JSON.stringify(settings)),
      { crt: spec.crt, pixelPerfect: spec.pixelPerfect },
    );
    const open = async () => {
      await page.goto('http://127.0.0.1:5184/?menuReview=victory');
      await page.waitForFunction(() => window.__rps?.scenes().includes('Result'));
      await page.keyboard.press('Backquote');
      await page.waitForTimeout(450);
    };
    await open();
    console.log('opened');
    if ((await page.evaluate(() => window.__rps.fighters().p1)) !== 'riot')
      throw Error('Wrong preview winner');
    await page.screenshot({ path: `${folder}/${spec.name}.png` });
    await page.locator('#game canvas').screenshot({ path: `${folder}/${spec.name}-monitor.png` });
    if (!phone) {
      const native = await page.evaluate(() => window.__rps.snapshot());
      writeFileSync(`${folder}/${spec.name}-native.png`, Buffer.from(native.split(',')[1], 'base64'));
    }
    const tap = async (y) => {
      const box = await page.locator('#game canvas').boundingBox();
      await page.touchscreen.tap(box.x + box.width / 2, box.y + (box.height * y) / 240);
    };
    if (phone) await tap(191);
    else await page.keyboard.press('Enter');
    await page.waitForFunction(
      () => window.__rps.scenes().includes('Fight') && !window.__rps.scenes().includes('Result'),
    );
    if ((await page.evaluate(() => window.__rps.fighters().p1)) !== 'riot')
      throw Error('Rematch lost fighter choice');
    await open();
    console.log('opened');
    if (phone) await tap(219);
    else {
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }
    await page.waitForFunction(
      () => window.__rps.scenes().includes('Home') && !window.__rps.scenes().includes('Result'),
    );
    console.log('actions passed');
    checks.push({ ...spec, rematch: true, mainMenu: true });
    await page.close();
  }
  if (errors.length) throw Error(errors.join('\n'));
  writeFileSync(`${folder}/checks.json`, JSON.stringify({ checks, errors }, null, 2));
  console.log(`Passed ${checks.length} display/input cases; no page or asset errors.`);
} finally {
  await browser.close();
}
