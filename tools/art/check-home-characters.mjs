// Validate the production build, serving local build bytes through Playwright's request router.
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve('apps/game/dist');
const output = 'art/portraits/action-v1/menu-review';
mkdirSync(output, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.ttf': 'font/ttf' };
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 600, height: 1000 }, reducedMotion: 'reduce' });
const errors = [], missing = [], loaded = new Set();
page.on('pageerror', e => errors.push(e.message));
await page.route('http://rps.local/**', async route => {
  const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
  try {
    const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!path.startsWith(`${root}\\`) && !path.startsWith(`${root}/`)) throw Error('Outside build');
    await route.fulfill({ body: readFileSync(path), contentType: types[extname(path)] || 'application/octet-stream' });
    loaded.add(pathname);
  } catch { missing.push(pathname); await route.fulfill({ status: 404, body: 'Missing asset' }); }
});
await page.addInitScript(() => { window.__characterRandom = 0.02; Math.random = () => window.__characterRandom; });
const waitScene = async key => {
  await page.waitForFunction(key => window.__rps?.scenes().includes(key), key);
  await page.waitForTimeout(400);
};
try {
  await page.goto('http://rps.local/');
  await waitScene('Home');
  const hashes = [];
  for (const [i, id] of ['riot', 'taiko', 'anchor'].entries()) {
    if (i) {
      await page.evaluate(value => { window.__characterRandom = value; }, i === 1 ? 0.5 : 0.98);
      await page.keyboard.press('ArrowUp'); await page.keyboard.press('Enter'); await waitScene('Options');
      await page.keyboard.press('Escape'); await waitScene('Home');
    }
    const png = await page.locator('#game canvas').screenshot({ path: `${output}/${id}.png` });
    hashes.push(createHash('sha256').update(png).digest('hex'));
    const atlas = JSON.parse(readFileSync(resolve(root, `assets/menus/action/${id}-sheet.json`)));
    for (const frame of ['rest', 'inhale', 'exhale']) {
      if (atlas.frames[frame]?.frame.w !== 192 || atlas.frames[frame]?.frame.h !== 240) throw Error(`${id}: invalid ${frame}`);
    }
    if (!loaded.has(`/assets/menus/action/${id}-sheet.png`)) throw Error(`${id} not loaded`);
  }
  if (new Set(hashes).size !== 3) throw Error('Character selection did not change on return to Home');
  // Exercise the actual Home update loop for every character using the shared manifest clock.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (let i = 0; i < 3; i++) {
    await page.evaluate(value => { window.__characterRandom = value; }, [0.02, 0.5, 0.98][i]);
    await page.keyboard.press('ArrowUp'); await page.keyboard.press('Enter'); await waitScene('Options');
    await page.keyboard.press('Escape'); await waitScene('Home');
    await page.waitForTimeout(2900);
  }
  if (errors.length || missing.length) throw Error(JSON.stringify({ errors, missing }));
  console.log('Passed: all three atlases, random selection on menu reentry, shared breathing loop, reduced motion, and no missing assets/page errors.');
} finally { await browser.close(); }
