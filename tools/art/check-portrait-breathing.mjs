import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const sharp = createRequire(import.meta.url)(process.env.RPS_SHARP_PATH || 'sharp');
const folder = 'art/portraits/breathing-v2';
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const results = [],
  errors = [];
try {
  for (const [id, random] of [
    ['taiko', 0.5],
    ['anchor', 0.99],
  ]) {
    const page = await browser.newPage({
      viewport: { width: 600, height: 1000 },
      reducedMotion: 'no-preference',
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript((value) => {
      Math.random = () => value;
      localStorage.setItem('rps-fighter.settings', JSON.stringify({ crt: false }));
    }, random);
    await page.goto('http://127.0.0.1:5184/');
    await page.waitForFunction(() => window.__rps?.scenes().includes('Home'));
    await page.waitForTimeout(2300);
    await page.keyboard.press('Backquote');

    const waitAmount = async (peak) =>
      page.waitForFunction((peak) => {
        const s = window.__rps.homePortrait();
        return s && s.steady && (peak ? s.amount > 0.99 : s.amount === 0);
      }, peak);
    await waitAmount(false);
    const rest = Buffer.from((await page.evaluate(() => window.__rps.snapshot())).split(',')[1], 'base64');
    writeFileSync(`${folder}/${id}-rest.png`, rest);
    await waitAmount(true);
    const inhale = Buffer.from((await page.evaluate(() => window.__rps.snapshot())).split(',')[1], 'base64');
    writeFileSync(`${folder}/${id}-inhale.png`, inhale);
    const a = await sharp(rest).ensureAlpha().raw().toBuffer(),
      b = await sharp(inhale).ensureAlpha().raw().toBuffer();
    const source = `art/portraits/action-v1/native/${id}-rest.png`,
      mask = await sharp(source).ensureAlpha().raw().toBuffer();
    const regions = {
      face: { x0: 109, x1: 166, y0: 70, y1: 107 },
      leftHand: { x0: 0, x1: 91, y0: 69, y1: 139 },
      rightHand: { x0: 170, x1: 192, y0: 70, y1: 139 },
      waist: { x0: 0, x1: 192, y0: 182, y1: 240 },
      chest: { x0: 112, x1: 153, y0: 122, y1: 141 },
    };
    const diff = {};
    for (const [name, r] of Object.entries(regions)) {
      let n = 0,
        checked = 0;
      for (let y = r.y0; y < r.y1; y++)
        for (let x = r.x0; x < r.x1; x++) {
          const p = (y * 192 + x) * 4;
          if (mask[p + 3] !== 255) continue;
          checked++;
          if (a[p] !== b[p] || a[p + 1] !== b[p + 1] || a[p + 2] !== b[p + 2]) n++;
        }
      diff[name] = { changed: n, checked };
    }
    for (const name of ['face', 'leftHand', 'rightHand', 'waist'])
      if (diff[name].changed) throw Error(`${id} ${name} shifted: ${JSON.stringify(diff)}`);
    if (diff.chest.changed < 5) throw Error(`${id} no visible chest motion: ${JSON.stringify(diff)}`);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(100);
    if ((await page.evaluate(() => window.__rps.homePortrait().amount)) !== 0)
      throw Error('Reduced motion does not hold rest');
    results.push({ id, diff, reducedMotion: true });
    await page.close();
  }
  if (errors.length) throw Error(errors.join('\n'));
  writeFileSync(`${folder}/checks.json`, JSON.stringify({ errors, results }, null, 2));
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
