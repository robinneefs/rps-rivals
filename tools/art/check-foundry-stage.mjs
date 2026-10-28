import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const out = 'art/stages/foundry-layers-v1/review';
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
  const url = 'http://127.0.0.1:5190/?menuReview=stage&stage=foundry-floor';
  await page.goto(url);
  await page.waitForFunction(() => window.__rps?.phase() === 'picking');
  const state = () => page.evaluate(() => window.__rps.stage());
  assert.equal((await state()).id, 'foundry-floor');
  const layers = (await state()).layers;
  assert(layers.indexOf('foundry-gear') < layers.indexOf('foundry-occluders'));
  assert(layers.indexOf('foundry-occluders') < layers.indexOf('fighter-p1'));
  const samples = [];
  for (let i = 0; i < 12; i++) {
    samples.push((await state()).effects);
    await page.waitForTimeout(250);
  }
  assert(new Set(samples.map((s) => s.gearFrame)).size > 5);
  assert(new Set(samples.map((s) => s.fireFrame)).size > 5);
  assert(new Set(samples.map((s) => s.glowAlpha)).size > 5);
  assert(samples.some((s) => s.particles.smoke.length > 0));
  assert(samples.some((s) => s.particles.sparks.length > 0));
  await page.screenshot({ path: `${out}/desktop.png` });
  writeFileSync(
    `${out}/monitor.png`,
    Buffer.from((await page.evaluate(() => window.__rps.snapshot())).split(',')[1], 'base64'),
  );
  await page.setViewportSize({ width: 390, height: 664 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${out}/phone.png` });
  checks.push(
    'native fire, warm glow and slow gear advance behind fixed pipes/rail; desktop and phone captured',
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(150);
  const reduced = (await state()).effects;
  assert.equal(reduced.gearFrame, 0);
  assert.equal(reduced.fireFrame, 0);
  assert.equal(reduced.glowAlpha, 0.12);
  assert.deepEqual(reduced.particles, { smoke: [], sparks: [] });
  await page.waitForTimeout(400);
  assert.deepEqual((await state()).effects, reduced);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  checks.push('live reduced motion freezes and resumes all foundry effects');
  for (const id of ['rooftop', 'storm-field', 'sunset-harbor', 'lantern-courtyard', 'foundry-floor']) {
    await page.goto(`http://127.0.0.1:5190/?menuReview=stage&stage=${id}`);
    await page.waitForFunction(() => window.__rps?.scenes().includes('Fight'));
    assert.equal((await state()).id, id);
    assert.equal((await page.evaluate(() => window.__rps.combatTextures())).length, 2);
  }
  assert((await state()).effects.elapsed < 1500);
  assert.deepEqual(errors, []);
  checks.push('all five stages load; foundry scene re-entry resets clock');
  writeFileSync(`${out}/checks.json`, JSON.stringify({ checks, errors, samples }, null, 2));
  console.log(checks.join('\n'));
} finally {
  await browser.close();
}
