import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const sharp = createRequire(import.meta.url)(process.env.RPS_SHARP_PATH || 'sharp');
const folder = process.env.RPS_ANCHOR_REVIEW || 'art/fighters/anchor-v3/review';
const art = process.env.RPS_ART_REVIEW || 'anchor-sheet';
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [],
  failures = [];
const poses = ['idle0', 'idle1', 'rock', 'paper', 'scissors', 'hurt', 'ko', 'win', 'kick'];
try {
  const page = await browser.newPage({ viewport: { width: 600, height: 1000 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => {
    if (r.status() >= 400) failures.push(r.url());
  });
  await page.addInitScript(() => localStorage.setItem('rps-fighter.settings', JSON.stringify({ crt: true })));
  await page.goto(`http://127.0.0.1:5184/?art=${art}`);
  await page
    .getByLabel(`${art === 'taiko-sheet' ? 'Taiko' : art === 'riot-sheet' ? 'Riot' : 'Anchor'} sprite review`)
    .waitFor();
  await page.keyboard.press('Backquote');
  await page.getByLabel('Playback', { exact: true }).selectOption({ index: 2 });
  const shots = [];
  for (const [index, pose] of poses.entries()) {
    await page.getByLabel('Pose', { exact: true }).selectOption({ index });
    await page.waitForTimeout(100);
    const png = Buffer.from((await page.evaluate(() => window.__rps.snapshot())).split(',')[1], 'base64');
    const meta = await sharp(png).metadata();
    if (meta.width !== 192 || meta.height !== 240) throw Error('Incorrect native render size');
    writeFileSync(`${folder}/${pose}.png`, png);
    shots.push({ input: png, left: (index % 3) * 192, top: Math.floor(index / 3) * 240 });
  }
  const grid = await sharp({ create: { width: 576, height: 720, channels: 4, background: '#101426' } })
    .composite(shots)
    .png()
    .toBuffer();
  await sharp(grid).resize(1152, 1440, { kernel: 'nearest' }).png().toFile(`${folder}/poses-in-game-2x.png`);
  await page.getByLabel('Pose', { exact: true }).selectOption({ index: 0 });
  await page.getByLabel('Compare with', { exact: true }).selectOption({ index: 1 });
  await page.waitForTimeout(100);
  writeFileSync(
    `${folder}/versus-riot.png`,
    Buffer.from((await page.evaluate(() => window.__rps.snapshot())).split(',')[1], 'base64'),
  );
  await page.screenshot({ path: `${folder}/cabinet.png` });
  await page.setViewportSize({ width: 390, height: 664 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${folder}/phone.png` });
  if (errors.length || failures.length) throw Error(JSON.stringify({ errors, failures }));
  writeFileSync(
    `${folder}/checks.json`,
    JSON.stringify({ native: [192, 240], poses, errors, failures, crt: true, reviewOnly: true }, null, 2),
  );
  console.log('Nine poses, Taiko/Riot comparison, desktop/phone, native snapshot and asset checks passed.');
} finally {
  await browser.close();
}
