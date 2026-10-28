import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const out = new URL('../../art/cabinet/joystick-v2/runtime/', import.meta.url);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const [device, viewport] of [
    ['desktop', { width: 600, height: 1000 }],
    ['phone', { width: 390, height: 664 }],
  ]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${process.env.RPS_PREVIEW_URL || 'http://127.0.0.1:5181'}/?review=joystick-v2`);
    await page.waitForFunction(() => window.__rps?.scenes().includes('Home'));
    await page.waitForTimeout(400);
    const frames = page.locator('[data-joystick-frame]');
    await frames.evaluateAll((images) => Promise.all(images.map((im) => im.decode())));
    const zone = await page.locator('[data-joystick]').boundingBox();
    const start = { x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 };
    const visible = () =>
      frames.evaluateAll((images) =>
        images.filter((im) => im.style.visibility === 'visible').map((im) => im.dataset.joystickFrame),
      );
    await page.screenshot({ path: fileURLToPath(new URL(`${device}-cabinet.png`, out)) });
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 24, start.y);
    if (JSON.stringify(await visible()) !== '["c"]') throw new Error('Small drag escaped the dead zone');
    for (const [name, dx, dy] of [
      ['u', 0, -1],
      ['ur', 1, -1],
      ['r', 1, 0],
      ['dr', 1, 1],
      ['d', 0, 1],
      ['dl', -1, 1],
      ['l', -1, 0],
      ['ul', -1, -1],
    ]) {
      await page.mouse.move(start.x + dx * 40, start.y + dy * 40);
      await page.waitForTimeout(40);
      if (JSON.stringify(await visible()) !== JSON.stringify([name]))
        throw new Error(`Incorrect ${device}/${name}: ${await visible()}`);
      await page
        .locator(`[data-joystick-frame="${name}"]`)
        .screenshot({ path: fileURLToPath(new URL(`${device}-${name}.png`, out)) });
    }
    await page.mouse.up();
    await page.waitForTimeout(250);
    if (JSON.stringify(await visible()) !== '["c"]') throw new Error('Did not return to neutral');
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(
      `${device}: all 8 independent direction frames load/respond, release returns to center, no page errors.`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
