import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const base = process.env.RPS_PREVIEW_URL || 'http://127.0.0.1:5194/';
const output = 'art/menus/versus-v1';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [],
  checks = [];
const advance = async (page, ms) => {
  for (let t = 0; t < ms; t += 50) await page.clock.runFor(Math.min(50, ms - t));
};
try {
  for (const reduced of [false, true]) {
    const page = await browser.newPage({
      viewport: reduced ? { width: 390, height: 664 } : { width: 600, height: 1000 },
      reducedMotion: reduced ? 'reduce' : 'no-preference',
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForFunction(() => window.__rps?.scenes().includes('Home'));
    await page.waitForTimeout(1800);
    await page.keyboard.press('Backquote');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__rps.characterSelection());
    await page.waitForTimeout(500);
    await page.clock.install();
    await page.clock.pauseAt(Date.now() + 100);
    await page.keyboard.press('Enter');
    await advance(page, 1300);
    if ((await page.evaluate(() => window.__rps.phase())) !== 'idle')
      throw Error('Match started behind closed panels');
    await page
      .locator('#game canvas')
      .screenshot({ path: `${output}/integrated-${reduced ? 'phone' : 'desktop'}-hold.png` });
    await advance(page, 2200);
    await page
      .locator('#game canvas')
      .screenshot({ path: `${output}/integrated-${reduced ? 'phone' : 'desktop'}-reveal.png` });
    for (let i = 0; i < 2200; i++) {
      if (await page.evaluate(() => window.__rps.scenes().includes('Result'))) break;
      if (await page.evaluate(() => window.__rps.phase() === 'picking')) await page.keyboard.press('Digit1');
      await advance(page, 100);
    }
    if (!(await page.evaluate(() => window.__rps.scenes().includes('Result'))))
      throw Error('CPU match did not finish');
    await advance(page, 1000);
    await page.keyboard.press('Enter');
    await advance(page, 1400);
    if (!['idle', 'matchOver'].includes(await page.evaluate(() => window.__rps.phase())))
      throw Error('Rematch skipped closed-panel gate');
    await advance(page, 4000);
    if (!(await page.evaluate(() => window.__rps.scenes().includes('Fight')))) {
      await page.screenshot({ path: `${output}/rematch-debug.png` });
      throw Error(
        'Rematch failed: ' +
          JSON.stringify({
            errors,
            state: await page.evaluate(() => ({
              scenes: window.__rps.scenes(),
              phase: window.__rps.phase(),
            })),
          }),
      );
    }
    checks.push(
      `${reduced ? 'Phone/reduced motion' : 'Desktop'}: selection, closed-panel idle gate, arena reveal, complete CPU match, rematch.`,
    );
    await page.close();
  }
  if (errors.length) throw Error(errors.join('\n'));
  writeFileSync(`${output}/integration-checks.json`, JSON.stringify({ checks, errors }, null, 2));
  console.log(JSON.stringify({ checks, errors }));
} finally {
  await browser.close();
}
