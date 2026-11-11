import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 664 },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  await page.addInitScript(() =>
    localStorage.setItem('rps-fighter.settings', JSON.stringify({ pixelPerfect: true, crt: true })),
  );
  await page.goto('http://127.0.0.1:5181/');
  await page.waitForFunction(() => window.__rps?.scenes().includes('Home'));
  await page.waitForTimeout(500);
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__rps.scenes().includes('Options'));
  await page.waitForTimeout(300);
  const tap = async (x, y) => {
    const b = await page.locator('#game canvas').boundingBox();
    await page.touchscreen.tap(b.x + (b.width * x) / 192, b.y + (b.height * y) / 240);
    await page.waitForTimeout(100);
  };
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('rps-fighter.settings')));
  await tap(150, 92);
  if ((await saved()).pixelPerfect !== false) throw Error('Touch disable failed');
  await tap(150, 92);
  if ((await saved()).pixelPerfect !== true) throw Error('Touch enable failed');
  await tap(167, 164);
  if ((await saved()).musicVolume !== 10) throw Error('Pixel mode touch slider failed');
  await page.screenshot({ path: 'art/menus/pixel-perfect-v1/phone-touch-options.png' });
  await tap(90, 212);
  await page.waitForFunction(() => window.__rps.scenes().includes('Home'));
  await page.waitForTimeout(400);
  await page.locator('[data-button="rock"]').tap();
  await page.waitForFunction(() => window.__rps.scenes().includes('CharacterSelect'));
  writeFileSync(
    'art/menus/pixel-perfect-v1/touch-checks.json',
    JSON.stringify({ toggle: true, slider: true, monitorBack: true, cabinetConfirm: true, dpr: 3 }, null, 2),
  );
  console.log('Phone Pixel Perfect toggle, slider, monitor Back and cabinet input passed.');
} finally {
  await browser.close();
}
