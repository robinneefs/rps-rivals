import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const out = new URL('../../art/cabinet/engraving-v1/', import.meta.url);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const [name, viewport] of [
    ['desktop', { width: 600, height: 1000 }],
    ['phone', { width: 390, height: 664 }],
  ]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:5181/?review=cabinet-engraving');
    await page.waitForFunction(() => window.__rps?.scenes().includes('Home'));
    await page.waitForTimeout(400); // let the opening CRT wipe finish before the screenshot
    await page.evaluate(() => document.fonts.ready);
    const checks = await page.evaluate(() => ({
      signature: document.querySelector('[data-engraving="signature"]').textContent,
      version: document.querySelector('[data-engraving="version"]').textContent,
      expected: `v${window.__rps.version}`,
      fontLoaded: document.fonts.check('18px "Cabinet Scratch"'),
      passThrough: [...document.querySelectorAll('[data-engraving]')].every(
        (el) => getComputedStyle(el).pointerEvents === 'none',
      ),
    }));
    if (
      checks.signature !== 'G Genie' ||
      checks.version !== checks.expected ||
      !checks.fontLoaded ||
      !checks.passThrough
    )
      throw new Error(JSON.stringify(checks));
    await page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, out)) });
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(`${name}: live name/version, font loading and pass-through checked; no page errors.`);
    await page.close();
  }
} finally {
  await browser.close();
}
