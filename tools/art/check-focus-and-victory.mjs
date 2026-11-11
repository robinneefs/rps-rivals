import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const out = 'art/review/focus-and-victory';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [],
  checks = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    window.__audioStarts = 0;
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      window.__audioStarts++;
      return start.apply(this, args);
    };
    localStorage.setItem('rps-fighter.settings', JSON.stringify({ muted: false, crt: false }));
  });
  await page.goto('http://127.0.0.1:5190/?menuReview=stage&stage=sunset-harbor');
  await page.waitForFunction(() => window.__rps?.phase() === 'picking');
  await page.keyboard.press('Digit1');
  await page.waitForTimeout(250);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const before = await page.evaluate(() => window.__audioStarts);
  await page.waitForTimeout(4500);
  const during = await page.evaluate(() => window.__audioStarts);
  assert.equal(during, before, 'No effects may start during blur');
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  const after = await page.evaluate(() => window.__audioStarts);
  assert.equal(after, during, 'Focus must not replay accumulated one-shots');
  checks.push('real WebAudio: no buffer starts while blurred and no queued burst on focus');
  await page.goto('http://127.0.0.1:5190/?menuReview=victory&fighter=taiko&palette=alternate');
  await page.waitForFunction(() => window.__rps?.scenes().includes('Result'));
  await page.waitForTimeout(1400);
  const shots = [];
  for (let i = 0; i < 5; i++) {
    shots.push(await page.evaluate(() => window.__rps.snapshot()));
    await page.waitForTimeout(400);
  }
  assert(new Set(shots).size > 1, 'Victory screen must animate after entrance');
  writeFileSync(`${out}/victory.png`, Buffer.from(shots[0].split(',')[1], 'base64'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(150);
  const still = await page.evaluate(() => window.__rps.snapshot());
  await page.waitForTimeout(600);
  assert(
    (await page.evaluate(() => window.__rps.snapshot())) === still,
    'Reduced-motion victory must stay still',
  );
  checks.push('victory title animates after entrance; live reduced motion settles to a still frame');
  assert.deepEqual(errors, []);
  writeFileSync(
    `${out}/checks.json`,
    JSON.stringify({ checks, errors, audioStarts: { before, during, after } }, null, 2),
  );
  console.log(checks.join('\n'));
} finally {
  await browser.close();
}
