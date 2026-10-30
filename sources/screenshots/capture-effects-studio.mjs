// Captures the development Effects Studio beside a running match for docs/tuning/TUNING-PANEL.md.
// Usage, from the repository root: node sources/screenshots/capture-effects-studio.mjs
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { webpSaver } from './webp.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const port = 5177;
const vite = resolve(root, 'node_modules/vite/bin/vite.js');
const server = spawn(process.execPath, [vite, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: resolve(root, 'apps/game'),
  stdio: 'pipe',
});
await new Promise((ok) => server.stdout.on('data', (d) => String(d).includes('Local') && ok()));

const browser = await chromium.launch();
const save = await webpSaver(browser);
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto(`http://127.0.0.1:${port}/?stage=sunset-harbor`);
  const scenes = () => page.evaluate(() => window.__rps?.scenes() ?? []);
  for (let i = 0; i < 200 && !(await scenes()).includes('Home'); i++) await page.waitForTimeout(100);
  await page.waitForTimeout(1500);
  await page.keyboard.press('ArrowUp'); // PLAY VERSUS CPU (Online is selected first)
  await page.keyboard.press('Enter');
  for (let i = 0; i < 100 && !(await scenes()).includes('CharacterSelect'); i++) await page.waitForTimeout(100);
  await page.waitForTimeout(800);
  await page.keyboard.press('Enter');
  for (let i = 0; i < 200 && (await page.evaluate(() => window.__rps.phase())) !== 'picking'; i++)
    await page.waitForTimeout(100);
  await page.waitForTimeout(600);
  await save(page, resolve(root, 'docs/screenshots/browser-effects-studio.webp'));
} finally {
  await browser.close();
  server.kill();
}
