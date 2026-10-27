// Actual scene review and input checks using the dev-only menu links.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const dir = 'art/menus/shared-v1';
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [],
  checks = [];
const scene = async (page, key) => {
  await page.waitForFunction((key) => window.__rps?.scenes().includes(key), key);
  await page.waitForTimeout(800);
};
try {
  for (const phone of [false, true]) {
    for (const mode of process.argv.includes('--create-only')
      ? ['create']
      : process.argv.includes('--rooms-only')
        ? ['create', 'join']
        : ['online', 'create', 'join', 'win', 'loss']) {
      const page = await browser.newPage({
        viewport: phone ? { width: 390, height: 664 } : { width: 600, height: 1000 },
        hasTouch: phone,
        isMobile: phone,
        reducedMotion: 'reduce',
      });
      page.on('pageerror', (e) => errors.push(e.message));
      await page.routeWebSocket(/localhost:8787/, (ws) => {
        ws.onMessage((data) => {
          const message = JSON.parse(data);
          if (message.intent === 'join' && !ws.url().endsWith('/BCDG'))
            ws.send(JSON.stringify({ type: 'error', error: 'noRoom' }));
        });
      });
      await page.goto(`http://127.0.0.1:5184/?menuReview=${mode}`);
      await scene(page, ['win', 'loss'].includes(mode) ? 'Result' : 'Lobby');
      await page.keyboard.press('Backquote');
      const capture = async (suffix = '') => {
        await page
          .locator('#game canvas')
          .screenshot({ path: `${dir}/${mode}${suffix}-${phone ? 'phone' : 'monitor'}.png` });
      };
      await capture();
      if (mode === 'online') {
        // Wrapping from first item selects Back, then re-entry exercises Join via keyboard.
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('Enter');
        await scene(page, 'Home');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await scene(page, 'Lobby');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await page.getByLabel('Room code').waitFor();
      } else if (mode === 'create') {
        const canvas = page.locator('#game canvas'),
          b = await canvas.boundingBox();
        if (phone) await page.touchscreen.tap(b.x + b.width / 2, b.y + (b.height * 192) / 240);
        else await canvas.click({ position: { x: b.width / 2, y: (b.height * 192) / 240 } });
        await page.getByLabel('Room code').waitFor({ state: 'hidden' });
        await page.keyboard.press('Escape');
        await scene(page, 'Home');
      } else if (mode === 'join') {
        const field = page.getByLabel('Room code');
        await field.fill('BCDF');
        if ((await field.inputValue()) !== 'BCDF') throw Error('Room entry failed');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
        await capture('-error');
        if (!(await field.isEnabled())) throw Error('Refused join did not unlock input');
        // A pending connection must release the native keyboard field on cancellation.
        await field.fill('BCDG');
        await page.keyboard.press('Enter');
        if (await field.isEnabled()) throw Error('Pending join did not lock the code field');
        await page.keyboard.press('Escape');
        if (!(await field.isEnabled())) throw Error('Cancelled join left the code field disabled');
        await field.fill('BCDF');
        if ((await field.inputValue()) !== 'BCDF') throw Error('Cannot edit after cancelling join');
        const b = await page.locator('#game canvas').boundingBox();
        if (phone) await page.touchscreen.tap(b.x + b.width / 2, b.y + (b.height * 192) / 240);
        else await page.mouse.click(b.x + b.width / 2, b.y + (b.height * 192) / 240);
        await field.waitFor({ state: 'hidden' });
      } else if (mode === 'win') {
        await page.keyboard.press('Enter');
        await scene(page, 'Fight');
      } else {
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await scene(page, 'Home');
      }
      checks.push(`${mode}: ${phone ? 'phone' : 'desktop'} rendered and input passed`);
      await page.close();
    }
  }
  if (errors.length) throw Error(errors.join('\n'));
  writeFileSync(
    `${dir}/${process.argv.includes('--create-only') ? 'create-checks' : process.argv.includes('--rooms-only') ? 'room-checks' : 'checks'}.json`,
    JSON.stringify({ pageErrors: errors, checks }, null, 2),
  );
  console.log(checks.join('\n'));
} finally {
  await browser.close();
}
