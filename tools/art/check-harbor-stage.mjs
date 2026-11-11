import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const out = 'art/stages/sunset-harbor-layers-v1/review';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [],
  checks = [];
try {
  const page = await browser.newPage({ viewport: { width: 600, height: 1000 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  await page.addInitScript(() => {
    Math.random = () => 0;
    localStorage.setItem('rps-fighter.settings', JSON.stringify({ crt: true, muted: true }));
  });
  await page.goto('http://127.0.0.1:5190/?menuReview=stage&stage=sunset-harbor');
  await page.waitForFunction(() => window.__rps?.phase() === 'picking');
  const state = () => page.evaluate(() => window.__rps.stage());
  const first = await state();
  assert.equal(first.id, 'sunset-harbor');
  assert(first.layers.indexOf('harbor-dock-foreground') < first.layers.indexOf('fighter-p1'));
  const samples = [];
  for (let i = 0; i < 12; i++) {
    samples.push((await state()).effects);
    await page.waitForTimeout(350);
  }
  assert(new Set(samples.map((s) => s.boatY)).size > 1);
  assert(new Set(samples.map((s) => s.flutter)).size > 1);
  assert(new Set(samples.map((s) => s.ropeY)).size > 1);
  assert(samples.every((s) => Math.abs(s.boatY) <= 1));
  assert(new Set(samples.map((s) => s.waterFrame)).size > 5);
  await page.waitForFunction(() => window.__rps.stage()?.effects.birdsVisible, null, { timeout: 12000 });
  checks.push(
    'boat, flag, rope and native water ripple frames advance; distant birds appear; dock behind fighters',
  );
  await page.screenshot({ path: `${out}/desktop.png` });
  writeFileSync(
    `${out}/monitor.png`,
    Buffer.from((await page.evaluate(() => window.__rps.snapshot())).split(',')[1], 'base64'),
  );
  await page.setViewportSize({ width: 390, height: 664 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${out}/phone.png` });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(120);
  const reduced = (await state()).effects;
  assert.equal(reduced.reducedMotion, true);
  assert.equal(reduced.boatY, 0);
  assert.equal(reduced.flutter, 0);
  assert.equal(reduced.ropeY, 0);
  assert.equal(reduced.waterFrame, 0);
  assert.equal(reduced.birdsVisible, false);
  await page.waitForTimeout(500);
  assert.deepEqual((await state()).effects, reduced);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForTimeout(250);
  assert.equal((await state()).effects.reducedMotion, false);
  checks.push('live reduced-motion toggle immediately freezes all effects and resumes correctly');
  for (const stage of ['rooftop', 'storm-field', 'sunset-harbor']) {
    await page.goto(`http://127.0.0.1:5190/?menuReview=stage&stage=${stage}`);
    await page.waitForFunction(() => window.__rps?.scenes().includes('Fight'));
    assert.equal((await state()).id, stage);
    assert.equal((await page.evaluate(() => window.__rps.combatTextures())).length, 2);
    if (stage === 'rooftop') {
      await page.waitForFunction(() => window.__rps.stage()?.effects?.birdsVisible, null, { timeout: 12000 });
      assert((await state()).layers.includes('rooftop-birds'));
      await page.screenshot({ path: `${out}/rooftop-birds.png` });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForTimeout(120);
      assert.equal((await state()).effects.birdsVisible, false);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      checks.push('rooftop shares the higher bird flyby and live reduced-motion hiding');
    }
  }
  checks.push('all three stages load with real fighters; harbor scene re-entry starts a fresh clock');
  assert((await state()).effects.elapsed < 1500);
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/checks.json`, JSON.stringify({ checks, errors, samples }, null, 2));
  console.log(checks.join('\n'));
} finally {
  await browser.close();
}
