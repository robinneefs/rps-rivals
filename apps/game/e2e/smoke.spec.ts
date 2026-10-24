import { expect, test, type Page } from '@playwright/test';
import pkg from '../package.json' with { type: 'json' };

declare global {
  interface Window {
    __rps: {
      scenes: () => string[];
      phase: () => string | null;
      renderScale: () => number;
      music: () => string | null;
      version: string;
    };
  }
}

const scenes = (page: Page) => page.evaluate(() => window.__rps.scenes());
const phase = (page: Page) => page.evaluate(() => window.__rps.phase());

/**
 * A fake clock that only moves when the test runs it. A plain install() also lets real time flow,
 * so on a slow machine (CI's software renderer drawing the screen shader) whole phases slip by
 * while the test is talking to the page, and the phase checks below land in the wrong phase.
 */
async function pausedClock(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
}

/**
 * Advances the fake clock in small steps. One big runFor() lets the browser run the game's frames
 * with large gaps, and Phaser clamps big frame deltas, so game time falls behind the clock.
 */
async function run(page: Page, ms: number): Promise<void> {
  for (let left = ms; left > 0; left -= 50) await page.clock.runFor(Math.min(50, left));
}

/** Runs the clock until a screen is showing and its wipe has finished (input is ignored mid-wipe). */
async function untilScene(page: Page, key: string, maxMs = 5000): Promise<void> {
  for (let t = 0; t < maxMs && !(await scenes(page)).includes(key); t += 50) await run(page, 50);
  expect(await scenes(page)).toContain(key);
  await run(page, 300);
}

test('boots to the logo, the home menu, and plays an exchange against the CPU', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await pausedClock(page);
  await page.goto('http://localhost:5174/');
  await run(page, 300);
  expect(await scenes(page)).toContain('Logo');

  await untilScene(page, 'Home'); // the logo leaves on its own (about 2.7s)

  await page.keyboard.press('Enter'); // START GAME (VS CPU)
  await run(page, 600);
  expect(await scenes(page)).toContain('Fight');
  expect(await phase(page)).toBe('roundIntro');

  await run(page, 1800);
  expect(await phase(page)).toBe('picking');
  await page.keyboard.press('Digit2'); // Scissors
  await run(page, 3000); // the pick countdown
  expect(await phase(page)).toBe('reveal');

  await run(page, 2000);
  expect(['picking', 'roundOver']).toContain(await phase(page));
  expect(errors).toEqual([]);
});

test('the build shows the version from package.json', async ({ page }) => {
  await page.goto('http://localhost:5174/');
  expect(await page.evaluate(() => window.__rps.version)).toBe(pkg.version);
});

test('the logo can be skipped with any button', async ({ page }) => {
  await pausedClock(page);
  await page.goto('http://localhost:5174/');
  await run(page, 300);
  await page.keyboard.press('Digit1');
  await run(page, 400);
  expect(await scenes(page)).toContain('Home');
});

test('buttons mashed while the game is still loading never freeze it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://localhost:5174/', { waitUntil: 'commit' });
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Digit1');
    await page.waitForTimeout(50);
  }
  await expect
    .poll(() => page.evaluate(() => window.__rps?.scenes() ?? []), { timeout: 10_000 })
    .not.toContain('Logo');
  expect(errors).toEqual([]);
});

test('the cabinet fits an upright phone and its buttons work by touch', async ({ browser }) => {
  // an iPhone with Safari's bars showing
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 664 },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();
  await pausedClock(page);
  await page.goto('http://localhost:5174/');
  await untilScene(page, 'Logo');

  // the whole screen and control panel are on the page
  const screen = await page.locator('#game').boundingBox();
  const rock = await page.locator('[data-button="rock"]').boundingBox();
  expect(screen && rock).toBeTruthy();
  expect(screen!.x).toBeGreaterThanOrEqual(0);
  expect(screen!.x + screen!.width).toBeLessThanOrEqual(390);
  expect(rock!.y + rock!.height).toBeLessThanOrEqual(664 + 1);
  expect(await page.evaluate(() => window.__rps.renderScale())).toBe(3);

  // a tap on the ROCK part of the panel is a button press (skips the logo)
  await page.touchscreen.tap(rock!.x + rock!.width / 2, rock!.y + rock!.height / 2);
  await untilScene(page, 'Home');
  await ctx.close();
});

test('music: the menu loop on home and the fight loop in a match', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await pausedClock(page);
  await page.goto('http://localhost:5174/');
  await untilScene(page, 'Logo');
  await page.keyboard.press('Digit1'); // skip the logo (also lets the browser play sound)
  await untilScene(page, 'Home');
  await run(page, 300);
  expect(await page.evaluate(() => window.__rps.music())).toBe('menu');

  await page.keyboard.press('Enter'); // START GAME
  await untilScene(page, 'Fight');
  await run(page, 300);
  expect(await page.evaluate(() => window.__rps.music())).toBe('fight');
  expect(errors).toEqual([]);
});

test('ONLINE opens the lobby, and BACK returns home', async ({ page }) => {
  await pausedClock(page);
  await page.goto('http://localhost:5174/');
  await untilScene(page, 'Logo');
  await page.keyboard.press('Digit1'); // skip the logo
  await untilScene(page, 'Home');
  await page.keyboard.press('ArrowDown'); // ONLINE (enabled in dev builds: local server address)
  await page.keyboard.press('Enter');
  await untilScene(page, 'Lobby');
  await page.keyboard.press('Escape');
  await untilScene(page, 'Home');
});

test('JOIN ROOM takes letters by keyboard layout, and its code box is a real text field', async ({
  page,
}) => {
  await pausedClock(page);
  await page.goto('http://localhost:5174/');
  await untilScene(page, 'Logo');
  await page.keyboard.press('Digit1');
  await untilScene(page, 'Home');
  await page.keyboard.press('ArrowDown'); // ONLINE
  await page.keyboard.press('Enter');
  await untilScene(page, 'Lobby');
  await page.keyboard.press('ArrowDown'); // JOIN ROOM
  await page.keyboard.press('Enter');
  await run(page, 600);
  const field = page.getByRole('textbox', { name: 'Room code' });
  await expect(field).toBeVisible();
  await expect(field).toBeFocused();

  // typing into the field (what a phone keyboard does); vowels and digits are not code letters
  await page.keyboard.type('bc');
  await expect(field).toHaveValue('BC');

  // AZERTY: the key that types "m" sits where QWERTY has ";". The letter counts, not the position.
  await field.evaluate((el) => el.blur());
  await page.evaluate(() =>
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', code: 'Semicolon' })),
  );
  await expect(field).toHaveValue('BCM');

  // leaving the screen removes the field
  for (let i = 0; i < 4; i++) await page.keyboard.press('Escape');
  await untilScene(page, 'Lobby');
  await page.keyboard.press('Escape');
  await untilScene(page, 'Home');
  await expect(field).toHaveCount(0);
});

test('NEW ROOM is cancelled by any cabinet button, back to the lobby menu', async ({ page }) => {
  await pausedClock(page);
  await page.goto('http://localhost:5174/');
  await untilScene(page, 'Logo');
  await page.keyboard.press('Digit1');
  await untilScene(page, 'Home');
  await page.keyboard.press('ArrowDown'); // ONLINE
  await page.keyboard.press('Enter');
  await untilScene(page, 'Lobby');
  await page.keyboard.press('Enter'); // CREATE ROOM
  await run(page, 600);
  await page.keyboard.press('Digit2'); // cancel
  await run(page, 600);
  // from the lobby menu, Esc goes home (from NEW ROOM it would only go back to the menu)
  await page.keyboard.press('Escape');
  await untilScene(page, 'Home');
});
