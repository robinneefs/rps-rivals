import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const dir = 'art/menus/options-v2';
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [];
const scene = async (page, key) => {
  await page.waitForFunction((key) => window.__rps?.scenes().includes(key), key);
  await page.waitForTimeout(400);
};
try {
  for (const phone of [false, true]) {
    const page = await browser.newPage({
      viewport: phone ? { width: 390, height: 664 } : { width: 600, height: 1000 },
      hasTouch: phone,
      isMobile: phone,
      reducedMotion: 'reduce',
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:5181/');
    await scene(page, 'Home');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    await scene(page, 'Options');
    const bounds = await page.locator('#game canvas').boundingBox();
    const point = (x, y) => ({
      x: bounds.x + (bounds.width * x) / 192,
      y: bounds.y + (bounds.height * y) / 240,
    });
    const musicLevelNow = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('rps-fighter.settings') ?? '{}').musicVolume);
    if (!phone) {
      const start = point(109, 140),
        end = point(167, 140);
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      if ((await musicLevelNow()) !== 0) throw Error('Mouse slider minimum failed');
      await page.mouse.move(end.x, end.y, { steps: 10 });
      if ((await musicLevelNow()) !== 10) throw Error('Mouse slider maximum failed');
      const middle = point(144, 180); // retain the music drag even outside its row
      await page.mouse.move(middle.x, middle.y, { steps: 5 });
      if ((await musicLevelNow()) !== 6) throw Error('Mouse slider drag outside row failed');
      await page.mouse.up();
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowUp');
    } else {
      const cdp = await page.context().newCDPSession(page);
      const start = point(101, 163),
        end = point(176, 163),
        middle = point(144, 163);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...start, id: 1 }] });
      if ((await musicLevelNow()) !== 0) throw Error('Touch slider padded target failed');
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...end, id: 1 }] });
      if ((await musicLevelNow()) !== 10) throw Error('Touch slider maximum failed');
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...middle, id: 1 }] });
      if ((await musicLevelNow()) !== 6) throw Error('Touch slider middle failed');
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await cdp.detach();
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowUp');
    }
    await page.screenshot({ path: `${dir}/${phone ? 'phone' : 'desktop'}.png` });
    await page
      .locator('#game canvas')
      .screenshot({ path: `${dir}/${phone ? 'phone-monitor' : 'monitor'}.png` });
    if (!phone) {
      const saved = () =>
        page.evaluate(() => JSON.parse(localStorage.getItem('rps-fighter.settings') ?? '{}'));
      await page.keyboard.press('Enter');
      if ((await saved()).crt !== false) throw Error('CRT toggle failed');
      await page.keyboard.press('Enter');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      if ((await saved()).muted !== true) throw Error('Sound toggle failed');
      await page.keyboard.press('Enter');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowLeft');
      if ((await saved()).musicVolume !== 5) throw Error('Music left failed');
      await page.keyboard.press('ArrowRight');
      if ((await saved()).musicVolume !== 6) throw Error('Music right failed');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      if ((await saved()).sfxVolume !== 9) throw Error('Effects select failed');
      await page.screenshot({ path: `${dir}/effects.png` });
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await scene(page, 'Home');
      await page.keyboard.press('Enter');
      await scene(page, 'CharacterSelect');
      await page.keyboard.press('Enter');
      await scene(page, 'Fight');
    } else {
      const box = await page.locator('#game canvas').boundingBox();
      const tapRow = (y) => page.touchscreen.tap(box.x + box.width / 2, box.y + (box.height * y) / 240);
      await tapRow(115);
      const vibration = await page.evaluate(
        () => JSON.parse(localStorage.getItem('rps-fighter.settings') ?? '{}').vibration,
      );
      if (vibration !== false) throw Error('Phone vibration tap failed');
      await tapRow(115);
      // A zero meter, a full meter, confirm wrapping, and directional clamping.
      await tapRow(163);
      for (let n = 0; n < 12; n++) await page.keyboard.press('ArrowLeft');
      const musicLevel = () =>
        page.evaluate(() => JSON.parse(localStorage.getItem('rps-fighter.settings') ?? '{}').musicVolume);
      if ((await musicLevel()) !== 0) throw Error('Volume minimum failed');
      for (let n = 0; n < 12; n++) await page.keyboard.press('ArrowRight');
      if ((await musicLevel()) !== 10) throw Error('Volume maximum failed');
      await page.keyboard.press('Enter');
      if ((await musicLevel()) !== 0) throw Error('Volume wrap failed');
      await page.keyboard.press('Escape');
      await scene(page, 'Home');
    }
    await page.close();
  }
  if (errors.length) throw Error(errors.join('\n'));
  writeFileSync(
    `${dir}/checks.json`,
    JSON.stringify({ pageErrors: errors, desktopAndPhone: true, settingsAndReturn: true }, null, 2),
  );
  console.log('Options production captures and settings checks passed.');
} finally {
  await browser.close();
}
