import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const [id, random] of [
    ['taiko', 0.5],
    ['anchor', 0.99],
  ]) {
    const folder = `art/portraits/breathing-v2/${id}-motion`;
    mkdirSync(folder, { recursive: true });
    const page = await browser.newPage({
      viewport: { width: 600, height: 1000 },
      reducedMotion: 'no-preference',
    });
    await page.addInitScript((value) => {
      Math.random = () => value;
      localStorage.setItem('rps-fighter.settings', JSON.stringify({ crt: true }));
    }, random);
    await page.goto('http://127.0.0.1:5184/');
    await page.waitForFunction(() => window.__rps?.scenes().includes('Home'));
    await page.waitForTimeout(2300);
    await page.keyboard.press('Backquote');
    const times = [];
    for (let frame = 0; frame < 36; frame++) {
      const png = Buffer.from((await page.evaluate(() => window.__rps.snapshot())).split(',')[1], 'base64');
      writeFileSync(`${folder}/${String(frame).padStart(2, '0')}.png`, png);
      times.push(Date.now());
      await page.waitForTimeout(100);
    }
    writeFileSync(
      `${folder}/timing.json`,
      JSON.stringify(times.map((time, index) => (index < times.length - 1 ? times[index + 1] - time : 120))),
    );
    await page.screenshot({ path: `art/portraits/breathing-v2/${id}-cabinet.png` });
    await page.close();
  }
} finally {
  await browser.close();
}
