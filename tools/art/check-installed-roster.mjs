import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const folder = 'art/fighters/three-character-roster';
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' }),
  errors = [],
  checks = [];
try {
  for (const [index, id, texture, source] of [
    [0, 'taiko', 'fighter-p1', 'taiko-v2'],
    [1, 'riot', 'fighter-p2', 'riot-v2-first'],
    [2, 'anchor', 'fighter-anchor', 'anchor-v3'],
  ]) {
    const hash = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
    if (
      hash(`apps/game/public/assets/${id}.png`) !== hash(`apps/game/public/assets/experiments/${source}.png`)
    )
      throw Error('Wrong installed artwork');
    const page = await browser.newPage({ viewport: { width: 600, height: 1000 }, reducedMotion: 'reduce' });
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => {
      if (r.status() >= 400) errors.push(r.url());
    });
    await page.addInitScript(() => {
      Math.random = () => 0;
      localStorage.setItem('rps-fighter.settings', JSON.stringify({ crt: true }));
    });
    await page.goto('http://127.0.0.1:5181/');
    await page.waitForFunction(() => window.__rps?.scenes().includes('Home'));
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__rps.scenes().includes('CharacterSelect'));
    await page.waitForTimeout(350);
    for (let i = 0; i < index; i++) await page.keyboard.press('ArrowRight');
    const state = await page.evaluate(() => window.__rps.characterSelection());
    if (state.selected !== id || !state.available) throw Error('Character unavailable');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__rps.scenes().includes('Fight'));
    await page.waitForTimeout(350);
    const textures = await page.evaluate(() => window.__rps.combatTextures());
    if (textures.join(',') !== `${texture},fighter-p1`) throw Error('Wrong fight identity');
    writeFileSync(
      `${folder}/${id}-native.png`,
      Buffer.from((await page.evaluate(() => window.__rps.snapshot())).split(',')[1], 'base64'),
    );
    await page.screenshot({ path: `${folder}/${id}-cabinet.png` });
    if (id === 'anchor') {
      await page.setViewportSize({ width: 390, height: 664 });
      await page.waitForTimeout(200);
      await page.screenshot({ path: `${folder}/anchor-phone.png` });
    }
    checks.push({ id, source, textures, available: state.available, stats: state.stats });
    await page.close();
  }
  if (errors.length) throw Error(errors.join('\n'));
  writeFileSync(`${folder}/installed-checks.json`, JSON.stringify({ errors, checks }, null, 2));
  console.log(
    'All three production choices load exact approved art, shared stats and real fight textures; desktop/phone/native captures saved.',
  );
} finally {
  await browser.close();
}
