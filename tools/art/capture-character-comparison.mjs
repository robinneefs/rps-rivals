import { chromium } from '@playwright/test';
import { copyFileSync } from 'node:fs';
const browser = await chromium.launch({ channel: 'chrome' }),
  page = await browser.newPage({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
try {
  await page.goto('http://127.0.0.1:5185/');
  for (const id of ['taiko', 'riot', 'anchor']) {
    await page.locator(`[data-fighter="${id}"]`).click();
    await page.waitForFunction(() =>
      [...document.querySelectorAll('.screen')].every((i) => i.complete && i.naturalWidth > 0),
    );
    await page.screenshot({ path: `art/menus/character-select-v1/comparison-${id}.png`, fullPage: true });
    for (const view of ['cabinet', 'phone']) {
      await page.locator(`[data-view="${view}"]`).click();
      await page.waitForFunction(() =>
        [...document.querySelectorAll('.screen')].every((i) => i.complete && i.naturalWidth > 0),
      );
    }
    await page.locator('[data-view="native"]').click();
  }
  await page.locator('[data-fighter="riot"]').click();
  await page.locator('[data-view="cabinet"]').click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll('.screen')].every((i) => i.complete && i.naturalWidth > 0),
  );
  await page.screenshot({ path: 'art/menus/character-select-v1/comparison-cabinets.png', fullPage: true });
  await page.locator('[data-view="phone"]').click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll('.screen')].every((i) => i.complete && i.naturalWidth > 0),
  );
  await page.screenshot({ path: 'art/menus/character-select-v1/comparison-phones.png', fullPage: true });
  if (errors.length) throw Error(errors.join('\n'));
  copyFileSync(
    'art/menus/character-select-v1/comparison-riot.png',
    'art/menus/character-select-v1/comparison.png',
  );
  console.log(
    'Comparison pages passed: all fighters and native/cabinet/phone views load; screenshots saved.',
  );
} finally {
  await browser.close();
}
