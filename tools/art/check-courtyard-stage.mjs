import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const out = 'art/stages/lantern-courtyard-layers-v1/review';
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
    localStorage.setItem('rps-fighter.settings', JSON.stringify({ muted: true, crt: true }));
  });
  const url = 'http://127.0.0.1:5190/?menuReview=stage&stage=lantern-courtyard';
  await page.goto(url);
  await page.waitForFunction(() => window.__rps?.phase() === 'picking');
  const stage = () => page.evaluate(() => window.__rps.stage());
  const initial = await stage();
  assert.equal(initial.id, 'lantern-courtyard');
  assert(initial.layers.indexOf('courtyard-stone-floor') < initial.layers.indexOf('fighter-p1'));
  const samples = [];
  for (let i = 0; i < 15; i++) {
    samples.push((await stage()).effects);
    await page.waitForTimeout(400);
  }
  assert(new Set(samples.map((s) => s.offsets.join(','))).size > 1);
  assert(new Set(samples.map((s) => s.glows.join(','))).size > 1);
  assert(samples.some((s) => s.petals.some((p) => p.visible)));
  assert(samples.every((s) => s.offsets.every((x) => Math.abs(x) <= 7)));
  assert(samples.some((s) => s.petals.filter((p) => p.visible).length > 3));
  await page.screenshot({ path: `${out}/desktop.png` });
  writeFileSync(
    `${out}/monitor.png`,
    Buffer.from((await page.evaluate(() => window.__rps.snapshot())).split(',')[1], 'base64'),
  );
  await page.setViewportSize({ width: 390, height: 664 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${out}/phone.png` });
  checks.push(
    'native lantern sway/glow and sparse petals advance; static scenery behind fighters; desktop/phone captured',
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(150);
  const reduced = (await stage()).effects;
  assert.deepEqual(reduced.offsets, [0, 0, 0]);
  assert.deepEqual(reduced.glows, [0.3, 0.3, 0.3]);
  assert(reduced.petals.every((p) => !p.visible));
  await page.waitForTimeout(400);
  assert.deepEqual((await stage()).effects, reduced);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForTimeout(200);
  assert.equal((await stage()).effects.reducedMotion, false);
  checks.push('live reduced motion immediately stops sway/glow, hides petals, and resumes');
  for (const id of ['rooftop', 'storm-field', 'sunset-harbor', 'lantern-courtyard']) {
    await page.goto(`http://127.0.0.1:5190/?menuReview=stage&stage=${id}`);
    await page.waitForFunction(() => window.__rps?.scenes().includes('Fight'));
    assert.equal((await stage()).id, id);
    assert.equal((await page.evaluate(() => window.__rps.combatTextures())).length, 2);
  }
  assert((await stage()).effects.elapsed < 1500);
  checks.push('all four stages load correctly and courtyard re-entry resets effects');
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/checks.json`, JSON.stringify({ checks, errors, samples }, null, 2));
  console.log(checks.join('\n'));
} finally {
  await browser.close();
}
