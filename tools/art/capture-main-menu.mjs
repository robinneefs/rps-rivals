// Verify/capture the offline production build served locally on port5181.
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const browser = await chromium.launch({ channel: 'chrome' });
const motion = process.argv.includes('--motion');
const page = await browser.newPage({
  viewport: { width: 600, height: 1000 },
  reducedMotion: motion ? 'no-preference' : 'reduce',
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const scene = async (name) => {
  await page.waitForFunction((key) => window.__rps?.scenes().includes(key), name);
  await page.waitForTimeout(400);
};
try {
  await page.goto('http://127.0.0.1:5181/');
  await scene('Home');
  if (motion) await page.waitForTimeout(2400);
  await page.screenshot({
    path: fileURLToPath(
      new URL(`../../art/menus/action-v2/production-home${motion ? '-motion' : ''}.png`, import.meta.url),
    ),
  });
  if (process.argv.includes('--font-study')) {
    const raw = await browser.newPage({ viewport: { width: 600, height: 1000 }, reducedMotion: 'reduce' });
    raw.on('pageerror', (e) => errors.push(e.message));
    await raw.addInitScript(() =>
      localStorage.setItem('rps-fighter.settings', JSON.stringify({ crt: false })),
    );
    await raw.goto('http://127.0.0.1:5181/');
    await raw.waitForFunction(() => window.__rps?.scenes().includes('Home'));
    await raw.waitForTimeout(400);
    await raw.screenshot({
      path: fileURLToPath(new URL('../../art/menus/action-v2/production-home-crt-off.png', import.meta.url)),
    });
    await raw.close();
  }
  const canvas = page.locator('#game canvas'),
    box = await canvas.boundingBox();
  await canvas.click({ position: { x: box.width * 0.5, y: box.height * (200 / 240) } });
  if (!(await page.evaluate(() => window.__rps.scenes().includes('Home'))))
    throw new Error('Offline online item activated');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await scene('Options');
  await page.keyboard.press('Escape');
  await scene('Home');
  await page.keyboard.press('Enter');
  await scene('CharacterSelect');
  await page.keyboard.press('Enter');
  await scene('Fight');
  if (errors.length) throw new Error(errors.join('\n'));
  writeFileSync(
    new URL('../../art/menus/action-v2/production-check.json', import.meta.url),
    JSON.stringify(
      {
        pageErrors: errors,
        reducedMotion: !motion,
        offlineOnlineDisabled: true,
        optionsReturn: true,
        cpuStarts: true,
      },
      null,
      2,
    ),
  );
  console.log(
    'Production home verified: reduced-motion loading, offline online item disabled/skipped, Options return, CPU start; no page errors.',
  );
} finally {
  await browser.close();
}
