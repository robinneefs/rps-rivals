import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url),
  sharp = require(process.env.RPS_SHARP_PATH || 'sharp');
const folder = new URL('../../art/menus/action-v2/native-font-study/', import.meta.url);
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 600, height: 1000 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const samples = [];
try {
  for (const [i, font] of ['bitmap', 'spleen', 'tamzen-bold', 'm6x11'].entries()) {
    await page.goto(`http://127.0.0.1:5181/?homeFont=${font}`);
    await page.waitForFunction(() => window.__rps?.scenes().includes('Home'));
    await page.waitForTimeout(400);
    await page.screenshot({ path: fileURLToPath(new URL(`${font}-crt.png`, folder)) });
    const screen = await page.locator('#game canvas').screenshot();
    const native = await sharp(screen).resize(192, 240, { kernel: 'nearest' }).png().toBuffer();
    samples.push({ input: native, left: i * 192, top: 0 });
    // Compare screenshot first, then prove this alternative still uses actual menu actions.
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__rps.scenes().includes('Options'));
    await page.keyboard.press('Escape');
  }
  const board = await sharp({ create: { width: 768, height: 240, channels: 4, background: '#00000000' } })
    .composite(samples)
    .png()
    .toBuffer();
  await sharp(board)
    .resize(1536, 480, { kernel: 'nearest' })
    .png()
    .toFile(fileURLToPath(new URL('comparison-2x.png', folder)));
  if (errors.length) throw new Error(errors.join('\n'));
  writeFileSync(
    new URL('validation.json', folder),
    JSON.stringify(
      {
        fonts: ['bitmap', 'spleen', 'tamzen-bold', 'm6x11'],
        crt: true,
        pageErrors: errors,
        optionsNavigation: true,
        note: 'Comparison images are captured CRT-filtered game frames. Candidate font bitmaps themselves are native1x; bitmap reference is2x.',
      },
      null,
      2,
    ),
  );
  console.log('Captured4 actual-game CRT font options, all navigate to Options without page errors.');
} finally {
  await browser.close();
}
