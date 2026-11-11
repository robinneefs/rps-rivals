import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const results = [];
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 600, height: 1000 } });
  await page.goto('http://127.0.0.1:5185/?menuReview=stage&stage=storm-field');
  await page.waitForFunction(() => window.__rps?.scenes().includes('Fight'));
  for (const selector of [
    '[data-button="rock"]',
    '[data-button="paper"]',
    '[data-button="scissors"]',
    '[data-joystick]',
  ]) {
    const rect = await page.locator(selector).boundingBox();
    const samples = [];
    for (let i = 0; i < 25; i++) {
      const x = rect.x + rect.width * (0.2 + (i % 5) * 0.15);
      const y = rect.y + rect.height * (0.2 + Math.floor(i / 5) * 0.15);
      await page.mouse.move(x, y);
      samples.push(
        await page.evaluate(
          ({ x, y }) => {
            const el = document.elementFromPoint(x, y);
            return {
              tag: el.tagName,
              cursor: getComputedStyle(el).cursor,
              button: el.dataset.button,
              joystick: el.hasAttribute('data-joystick'),
            };
          },
          { x, y },
        ),
      );
    }
    const cursors = [...new Set(samples.map((x) => x.cursor))];
    assert.deepEqual(cursors, [selector === '[data-joystick]' ? 'grab' : 'pointer']);
    results.push({ selector, samples: samples.length, cursors });
  }
  await page.goto('http://127.0.0.1:5185/');
  await page.waitForFunction(() => window.__rps?.scenes().includes('Home'));
  await page.waitForTimeout(900);
  await page.keyboard.press('Backquote');
  const box = await page.locator('canvas').boundingBox();
  const cursors = [];
  for (let i = 0; i < 30; i++) {
    await page.mouse.move(box.x + ((70 + (i % 10) * 3) / 192) * box.width, box.y + (169 / 240) * box.height);
    cursors.push(await page.locator('canvas').evaluate((el) => getComputedStyle(el).cursor));
  }
  results.push({ selector: 'Home canvas menu', samples: cursors.length, cursors: [...new Set(cursors)] });
  assert.deepEqual([...new Set(cursors)], ['pointer']);
  mkdirSync('art/cursor-review', { recursive: true });
  writeFileSync('art/cursor-review/checks.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
