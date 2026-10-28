import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const out = 'art/stages/storm-field-v1/review';
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({
    viewport: { width: 600, height: 1000 },
    reducedMotion: 'no-preference',
  });
  await page.addInitScript(() => {
    Math.random = () => 0;
    localStorage.setItem('rps-fighter.settings', JSON.stringify({ crt: true, muted: true }));
  });
  await page.goto('http://127.0.0.1:5185/?menuReview=stage&stage=storm-field');
  await page.waitForFunction(() => window.__rps?.scenes().includes('Fight'));
  await page.waitForTimeout(500);
  const normal = await page.evaluate(() => window.__rps.stage());
  if (normal.effects.frame === 0) throw Error('Grass did not advance');
  const native = async (name) =>
    writeFileSync(
      `${out}/${name}-native.png`,
      Buffer.from((await page.evaluate(() => window.__rps.snapshot())).split(',')[1], 'base64'),
    );
  await native('normal');
  await page.screenshot({ path: `${out}/normal-cabinet.png` });
  await page.waitForFunction(() => window.__rps.stage()?.effects.lightning, null, { timeout: 8000 });
  await native('lightning');
  await page.screenshot({ path: `${out}/lightning-cabinet.png` });
  await page.setViewportSize({ width: 390, height: 664 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${out}/phone.png` });
  console.log('Clean desktop/phone and native normal/lightning captures saved; grass advancement verified.');
} finally {
  await browser.close();
}
