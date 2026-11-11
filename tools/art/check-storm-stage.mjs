import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const out = 'art/stages/storm-field-v1/review';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [];
const results = [];
try {
  for (const reduced of [false, true]) {
    const page = await browser.newPage({
      viewport: { width: 600, height: 1000 },
      reducedMotion: reduced ? 'reduce' : 'no-preference',
    });
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    await page.addInitScript(() => {
      Math.random = () => 0;
      localStorage.setItem('rps-fighter.settings', JSON.stringify({ crt: true, muted: true }));
    });
    await page.goto('http://127.0.0.1:5185/?menuReview=stage&stage=storm-field');
    await page.waitForFunction(() => window.__rps?.scenes().includes('Fight'));
    const initial = await page.evaluate(() => window.__rps.stage());
    assert.equal(initial.id, 'storm-field');
    for (const name of ['fighter-p1', 'fighter-p2'])
      assert(initial.layers.indexOf('storm-foreground') > initial.layers.indexOf(name));
    await page.waitForTimeout(500);
    writeFileSync(
      `${out}/${reduced ? 'reduced' : 'normal'}-native.png`,
      Buffer.from((await page.evaluate(() => window.__rps.snapshot())).split(',')[1], 'base64'),
    );
    if (!reduced) {
      await page.screenshot({ path: `${out}/normal-cabinet.png` });
      await page.waitForFunction(() => window.__rps.stage()?.effects.lightning, { timeout: 8000 });
      writeFileSync(
        `${out}/lightning-native.png`,
        Buffer.from((await page.evaluate(() => window.__rps.snapshot())).split(',')[1], 'base64'),
      );
      const strike = await page.evaluate(() => window.__rps.stage());
      assert(strike.effects.strikes > 0);
      assert(strike.effects.cloudOffset < initial.effects.cloudOffset);
      await page.setViewportSize({ width: 390, height: 664 });
      await page.screenshot({ path: `${out}/phone.png` });
      results.push({ reduced, initial, strike });
      // Complete a real CPU match using PAPER against the deterministic ROCK CPU.
      for (let i = 0; i < 150; i++) {
        if ((await page.evaluate(() => window.__rps.scenes())).includes('Result')) break;
        await page.keyboard.press('Digit2');
        await page.waitForTimeout(650);
      }
      assert((await page.evaluate(() => window.__rps.scenes())).includes('Result'), 'CPU match completes');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => window.__rps.scenes().includes('Fight'));
      const rematch = await page.evaluate(() => window.__rps.stage());
      assert.equal(rematch.id, 'storm-field');
      assert.equal(rematch.effects.strikes, 0, 'storm lifecycle resets on rematch');
      results.push({ rematch });
    } else {
      await page.waitForTimeout(6000);
      const state = await page.evaluate(() => window.__rps.stage());
      assert.deepEqual(state.effects, {
        frame: 0,
        cloudOffset: 96,
        strikes: 0,
        lightning: false,
        reducedMotion: true,
      });
      results.push({ reduced, state });
    }
    await page.close();
  }
  const rooftop = await browser.newPage();
  rooftop.on('pageerror', (e) => errors.push(e.message));
  await rooftop.goto('http://127.0.0.1:5185/?menuReview=stage&stage=rooftop');
  await rooftop.waitForFunction(() => window.__rps?.scenes().includes('Fight'));
  const state = await rooftop.evaluate(() => window.__rps.stage());
  assert.equal(state.id, 'rooftop');
  assert.equal(state.effects, null);
  results.push({ rooftop: state });
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/checks.json`, JSON.stringify({ errors, results }, null, 2));
  console.log(
    'Storm animation, lightning, foreground order, desktop/phone, real CPU match/rematch, reduced motion and rooftop regression passed.',
  );
} finally {
  await browser.close();
}
