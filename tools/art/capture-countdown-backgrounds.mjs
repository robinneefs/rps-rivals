// Grabs a native 192 x 240 fight frame per stage, just before the countdown appears, as the
// backdrop for art/ui/countdown-font-v1/preview.html (built by prepare-countdown-font-preview.py).
// Usage, with the dev server running (npm run dev): node tools/art/capture-countdown-backgrounds.mjs [url]
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const out = resolve(root, 'art/ui/countdown-font-v1/backgrounds');
const base = process.argv[2] ?? 'http://localhost:5173/';
const stages = ['rooftop', 'storm-field', 'sunset-harbor', 'lantern-courtyard', 'foundry-floor'];
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
try {
  for (const stage of stages) {
    const page = await browser.newPage({ viewport: { width: 600, height: 1000 } });
    await page.emulateMedia({ reducedMotion: 'reduce' }); // no banner motion in the held frame
    await page.goto(`${base}?stage=${stage}`);
    const scenes = () => page.evaluate(() => window.__rps?.scenes() ?? []);
    const phase = () => page.evaluate(() => window.__rps.phase());
    for (let i = 0; i < 200 && !(await scenes()).includes('Home'); i++) await page.waitForTimeout(100);
    await page.waitForTimeout(800);
    await page.keyboard.press('ArrowUp'); // PLAY VERSUS CPU (Online is selected first)
    await page.keyboard.press('Enter');
    for (let i = 0; i < 100 && !(await scenes()).includes('CharacterSelect'); i++) await page.waitForTimeout(100);
    await page.waitForTimeout(600);
    await page.keyboard.press('Enter');
    for (let i = 0; i < 200 && (await phase()) !== 'roundIntro'; i++) await page.waitForTimeout(50);
    // Late in the intro: the HUD is up, the countdown not yet.
    await page.waitForTimeout(2550);
    const url = await page.evaluate(() => window.__rps.snapshot());
    writeFileSync(resolve(out, `${stage}.png`), Buffer.from(url.split(',')[1], 'base64'));
    console.log(stage, await phase());
    await page.close();
  }
} finally {
  await browser.close();
}
