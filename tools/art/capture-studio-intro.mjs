import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const folder = new URL('../../art/brand/chain-shift-v2/frames/', import.meta.url);
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({
    viewport: { width: 600, height: 1000 },
    reducedMotion: 'no-preference',
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.goto('http://127.0.0.1:5181/?review=studio-intro');
  await page.waitForFunction(() => Boolean(window.__rps));
  const run = async (ms) => {
    for (let t = 0; t < ms; t += 50) await page.clock.runFor(Math.min(50, ms - t));
  };
  for (let t = 0; t < 5000; t += 50) {
    if (await page.evaluate(() => window.__rps.scenes().includes('Logo'))) break;
    await run(50);
  }
  if (!(await page.evaluate(() => window.__rps.scenes().includes('Logo'))))
    throw new Error('Logo did not load');
  for (let i = 0; i < 34; i++) {
    await page
      .locator('#game canvas')
      .screenshot({ path: fileURLToPath(new URL(`${String(i).padStart(2, '0')}.png`, folder)) });
    if (i === 12)
      await page.screenshot({ path: fileURLToPath(new URL('../production-studio-intro.png', folder)) });
    await run(100);
  }
  if (!(await page.evaluate(() => window.__rps.scenes().includes('Home'))))
    throw new Error('Intro did not finish');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Captured slowed pop, sheen and reverse exit; automatic Home transition, no page errors.');
} finally {
  await browser.close();
}
