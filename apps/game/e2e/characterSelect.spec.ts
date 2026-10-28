import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const output = 'art/menus/character-select-lineup-v2';
mkdirSync(output, { recursive: true });
const advance = async (page: Page, ms: number) => {
  for (let left = ms; left > 0; left -= 50) await page.clock.runFor(Math.min(50, left));
};
const active = (page: Page, key: string) => page.evaluate((key) => window.__rps?.scenes().includes(key), key);
const state = (page: Page) => page.evaluate(() => window.__rps.characterSelection());
async function until(page: Page, key: string, max = 5000): Promise<void> {
  for (let t = 0; t < max && !(await active(page, key)); t += 50) await advance(page, 50);
  expect(await active(page, key)).toBe(true);
  await advance(page, 300);
}
async function boot(page: Page, random: number): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript((value) => {
    Math.random = () => value;
  }, random);
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.goto('http://localhost:5174/');
  await expect
    .poll(
      async () => {
        await advance(page, 50);
        return page.evaluate(() => window.__rps?.scenes().includes('Logo'));
      },
      { timeout: 15000 },
    )
    .toBe(true);
  await page.keyboard.press('Digit1');
  await until(page, 'Home');
  await page.keyboard.press('Backquote');
  await page.keyboard.press('Enter');
  await until(page, 'CharacterSelect');
}
async function point(page: Page, x: number, y: number) {
  const b = (await page.locator('#game canvas').boundingBox())!;
  return { x: b.x + (b.width * x) / 192, y: b.y + (b.height * y) / 240 };
}

test('lineup browsing, playable Anchor, cancel-ready, Riot mirror fight and rematch', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await boot(page, 0.5);
  expect((await state(page))?.selected).toBe('taiko');
  expect((await state(page))?.stats).toEqual({ rock: 15, paper: 10, scissors: 20, hp: 50 });
  await page.locator('#game canvas').screenshot({ path: `${output}/taiko-browsing.png` });
  await page.keyboard.press('ArrowLeft');
  await advance(page, 50);
  expect(await state(page)).toMatchObject({ selected: 'anchor', available: true });
  await page.keyboard.press('Enter');
  await advance(page, 100);
  expect((await state(page))?.confirmed).toBe(true);
  await page.keyboard.press('Escape');
  await advance(page, 800);
  expect(await active(page, 'CharacterSelect')).toBe(true);
  await page.locator('#game canvas').screenshot({ path: `${output}/anchor-playable.png` });
  await page.keyboard.press('Escape');
  await until(page, 'Home');
  await page.keyboard.press('Enter');
  await until(page, 'CharacterSelect');
  const riot = await point(page, 103, 95);
  await page.mouse.move(riot.x, riot.y);
  await advance(page, 50);
  expect((await state(page))?.selected).toBe('riot');
  await page.locator('#game canvas').screenshot({ path: `${output}/riot-browsing.png` });
  await page.keyboard.press('Enter');
  await advance(page, 100);
  expect(await state(page)).toMatchObject({ confirmed: true, starting: true });
  await page.locator('#game canvas').screenshot({ path: `${output}/riot-ready.png` });
  await page.keyboard.press('Escape');
  await advance(page, 800);
  expect(await state(page)).toMatchObject({ confirmed: false, selected: 'riot' });
  await page.keyboard.press('Enter');
  await until(page, 'Fight');
  expect(await page.evaluate(() => window.__rps.fighters())).toEqual({ p1: 'riot', p2: 'riot' });
  expect(await page.evaluate(() => window.__rps.combatTextures())).toEqual(['fighter-p2', 'fighter-p2']);
  for (let t = 0; t < 180000 && !(await active(page, 'Result')); t += 100) {
    if (await page.evaluate(() => window.__rps.phase() === 'picking')) await page.keyboard.press('Digit1');
    await advance(page, 100);
  }
  expect(await active(page, 'Result')).toBe(true);
  await advance(page, 300);
  await page.keyboard.press('Enter');
  await until(page, 'Fight');
  expect(await page.evaluate(() => window.__rps.fighters())).toEqual({ p1: 'riot', p2: 'riot' });
  expect(errors).toEqual([]);
});

test('phone portrait taps, Anchor confirmation, monitor Back, cabinet confirm and Taiko mirrors', async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 664 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await boot(page, 0);
  const tap = async (x: number, y: number) => {
    const p = await point(page, x, y);
    await page.touchscreen.tap(p.x, p.y);
    await advance(page, 50);
  };
  await tap(153, 95);
  expect((await state(page))?.selected).toBe('anchor');
  await tap(120, 225);
  await advance(page, 100);
  expect((await state(page))?.confirmed).toBe(true);
  await tap(36, 225);
  await advance(page, 800);
  expect((await state(page))?.confirmed).toBe(false);
  await tap(36, 225);
  await until(page, 'Home');
  await page.keyboard.press('Enter');
  await until(page, 'CharacterSelect');
  await page.screenshot({ path: `${output}/phone-browsing.png` });
  await tap(41, 95);
  await tap(120, 225);
  expect((await state(page))?.confirmed).toBe(true);
  await page.screenshot({ path: `${output}/phone-ready.png` });
  await tap(36, 225);
  await advance(page, 800);
  expect((await state(page))?.confirmed).toBe(false);
  // Actual cabinet ROCK touch confirms, preserving the selected identity.
  const rock = (await page.locator('[data-button="rock"]').boundingBox())!;
  await page.touchscreen.tap(rock.x + rock.width / 2, rock.y + rock.height / 2);
  await until(page, 'Fight');
  expect(await page.evaluate(() => window.__rps.fighters())).toEqual({ p1: 'taiko', p2: 'taiko' });
  expect(await page.evaluate(() => window.__rps.combatTextures())).toEqual(['fighter-p1', 'fighter-p1']);
  expect(errors).toEqual([]);
  await ctx.close();
});

test('Anchor mirrors use her own combat atlas and retain identities through a CPU rematch', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await boot(page, 0.99);
  await page.keyboard.press('ArrowLeft');
  await advance(page, 50);
  expect(await state(page)).toMatchObject({
    selected: 'anchor',
    available: true,
    stats: { rock: 15, paper: 10, scissors: 20, hp: 50 },
  });
  await page.keyboard.press('Enter');
  await until(page, 'Fight');
  expect(await page.evaluate(() => window.__rps.fighters())).toEqual({ p1: 'anchor', p2: 'anchor' });
  expect(await page.evaluate(() => window.__rps.combatTextures())).toEqual([
    'fighter-anchor',
    'fighter-anchor',
  ]);
  await page.locator('#game canvas').screenshot({ path: `${output}/anchor-mirror-fight.png` });
  for (let t = 0; t < 180000 && !(await active(page, 'Result')); t += 100) {
    if (await page.evaluate(() => window.__rps.phase() === 'picking')) await page.keyboard.press('Digit1');
    await advance(page, 100);
  }
  expect(await active(page, 'Result')).toBe(true);
  await advance(page, 300);
  await page.keyboard.press('Enter');
  await until(page, 'Fight');
  expect(await page.evaluate(() => window.__rps.fighters())).toEqual({ p1: 'anchor', p2: 'anchor' });
  expect(errors).toEqual([]);
});
