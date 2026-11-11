import { expect, test, type Page } from '@playwright/test';
import pkg from '../package.json' with { type: 'json' };

declare global {
  interface Window {
    __homeBuzzes: number[][];
    __rps: {
      scenes: () => string[];
      phase: () => string | null;
      renderScale: () => number;
      music: () => string | null;
      fighters: () => Record<'p1' | 'p2', string> | null;
      combatTextures: () => string[];
      characterSelection: () => {
        selected: string;
        confirmed: boolean;
        starting: boolean;
        available: boolean;
        status: string;
        stats: { rock: number; paper: number; scissors: number; hp: number };
      } | null;
      version: string;
    };
  }
}

const scenes = (page: Page) => page.evaluate(() => window.__rps?.scenes() ?? []);
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
  const active = await scenes(page);
  if (active.length === 0 || active.includes('Boot')) {
    // Asset loading uses real I/O. Keep it out of the scene's simulated-time budget.
    await expect
      .poll(
        async () => {
          await run(page, 50);
          const loaded = await scenes(page);
          return loaded.length > 0 && !loaded.includes('Boot');
        },
        { timeout: 15_000 },
      )
      .toBe(true);
  }
  for (let t = 0; t < maxMs && !(await scenes(page)).includes(key); t += 50) await run(page, 50);
  expect(await scenes(page)).toContain(key);
  await run(page, 600); // let the complete CRT wipe release its input guard
}

/** Follow the new cosmetic selection step, without skipping it in the game. */
async function untilFight(page: Page): Promise<void> {
  for (let t = 0; t < 5000 && !(await scenes(page)).includes('Fight'); t += 50) {
    if ((await scenes(page)).includes('CharacterSelect')) {
      await untilScene(page, 'CharacterSelect');
      await page.keyboard.press('Enter');
      break;
    }
    await run(page, 50);
  }
  await untilScene(page, 'Fight');
  for (let t = 0; t < 6000 && (await phase(page)) !== 'roundIntro'; t += 50) await run(page, 50);
  expect(await scenes(page)).not.toContain('Result');
  expect(await phase(page)).toBe('roundIntro');
}

test('boots to the logo, the home menu, and plays an exchange against the CPU', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await pausedClock(page);
  await page.goto('http://127.0.0.1:5174/');
  await untilScene(page, 'Logo'); // wait for the larger artwork preload, rather than a fixed delay

  await untilScene(page, 'Home'); // the logo leaves on its own (about 2.7s)

  await page.keyboard.press('ArrowUp'); // Online is selected initially; choose CPU.
  await page.keyboard.press('Enter'); // PLAY VERSUS CPU
  await untilFight(page);
  expect(await scenes(page)).toContain('Fight');
  // The approved versus entrance finishes before the round intro and FIGHT beat.
  for (let t = 0; t < 6000 && (await phase(page)) !== 'roundIntro'; t += 50) await run(page, 50);
  expect(await phase(page)).toBe('roundIntro');
  for (let t = 0; t < 4000 && (await phase(page)) !== 'picking'; t += 50) await run(page, 50);
  expect(await phase(page)).toBe('picking');
  await page.keyboard.press('Digit2'); // Scissors
  await run(page, 3000); // the pick countdown
  expect(await phase(page)).toBe('reveal');

  await run(page, 2000);
  expect(['picking', 'roundOver']).toContain(await phase(page));
  expect(errors).toEqual([]);
});

test('native Taiko and Riot assets load and a complete CPU match can be replayed', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  const assets = new Set<string>();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (response) => {
    if (response.ok()) assets.add(new URL(response.url()).pathname);
  });
  await pausedClock(page);
  await page.goto('http://127.0.0.1:5174/');
  await untilScene(page, 'Home');
  expect(assets.has('/assets/taiko.png')).toBe(true);
  expect(assets.has('/assets/taiko.json')).toBe(true);
  expect(assets.has('/assets/riot.png')).toBe(true);
  expect(assets.has('/assets/riot.json')).toBe(true);
  expect(assets.has('/assets/stages/rooftop-v2-192.png')).toBe(true);
  expect(assets.has('/assets/stages/rooftop-clouds-576.png')).toBe(true);
  await page.keyboard.press('ArrowUp'); // CPU, from the default Online selection
  await page.keyboard.press('Enter');
  await untilFight(page);
  await run(page, 1800);
  await page.keyboard.press('F4'); // hide the development tuning panel for the art capture
  await page.screenshot({ path: testInfo.outputPath('riot-in-game.png') });
  // Auto-picks exercise ties, hits, round transitions and the KO animation without changing rules.
  await untilScene(page, 'Result', 180_000);
  await page.keyboard.press('Enter');
  await untilFight(page);
  expect(await phase(page)).toBe('roundIntro');
  expect(errors).toEqual([]);
});

test('layered home art loads, options wrap correctly, and returning home restores input', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  const assets = new Set<string>();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => {
    if (r.ok()) assets.add(new URL(r.url()).pathname);
  });
  await pausedClock(page);
  await page.goto('http://127.0.0.1:5174/');
  await untilScene(page, 'Home');
  for (const name of [
    'background-sheet.png',
    'riot-sheet.png',
    'logo.png',
    'paint-streak.png',
    'labels.png',
    'manifest.json',
  ])
    expect(assets.has(`/assets/menus/action/${name}`)).toBe(true);
  await run(page, 1800); // let the staggered entrance settle before the art capture
  await page.keyboard.press('F4');
  await page.screenshot({ path: testInfo.outputPath('action-home.png') });
  // Down selects Options from Online; returning must discard the old subscription/lock.
  for (let i = 0; i < 2; i++) {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await untilScene(page, 'Options');
    await page.keyboard.press('Escape');
    for (let t = 0; t < 5000 && !(await scenes(page)).includes('Home'); t += 50) await run(page, 50);
    expect(await scenes(page)).toContain('Home');
    await page.keyboard.press('Enter'); // confirm while the opening wipe is still busy
    await run(page, 300);
    expect(await scenes(page)).toContain('Home');
  }
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await untilFight(page);
  expect(errors).toEqual([]);
});

test('home entrance and skip remain silent on phones with reduced motion or haptics disabled', async ({
  browser,
}) => {
  for (const mode of ['normal', 'skip', 'reduced', 'off'] as const) {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 664 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference',
    });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript((off) => {
      window.__homeBuzzes = [];
      Object.defineProperty(navigator, 'vibrate', {
        configurable: true,
        writable: true,
        value: (pattern: number | number[]) => {
          window.__homeBuzzes.push(typeof pattern === 'number' ? [pattern] : [...pattern]);
          return true;
        },
      });
      if (off) localStorage.setItem('rps-fighter.settings', JSON.stringify({ vibration: false }));
    }, mode === 'off');
    await pausedClock(page);
    await page.goto('http://127.0.0.1:5174/');
    await expect
      .poll(
        async () => {
          if (errors.length) throw new Error(errors.join('\n'));
          return page.evaluate(() => Boolean(window.__rps));
        },
        { timeout: 10000 },
      )
      .toBe(true);
    await untilScene(page, 'Logo');
    await page.keyboard.press('Digit1');
    await untilScene(page, 'Home');
    if (mode === 'skip') {
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('Enter');
      await untilFight(page);
    }
    await run(page, 1800);
    const buzzes = await page.evaluate(() => window.__homeBuzzes);
    // Home's current entrance is visual only; it must not vibrate the phone.
    expect(buzzes).toEqual([]);
    await ctx.close();
  }
});

test('the build shows the version from package.json', async ({ page }) => {
  await page.goto('http://127.0.0.1:5174/');
  expect(await page.evaluate(() => window.__rps.version)).toBe(pkg.version);
});

test('the logo can be skipped with any button', async ({ page }) => {
  await pausedClock(page);
  await page.goto('http://127.0.0.1:5174/');
  await untilScene(page, 'Logo');
  await page.keyboard.press('Digit1');
  await untilScene(page, 'Home');
});

test('buttons mashed while the game is still loading never freeze it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:5174/', { waitUntil: 'commit' });
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
  await page.goto('http://127.0.0.1:5174/');
  await untilScene(page, 'Logo');

  await page.keyboard.press('F4'); // development controls must not intercept monitor/cabinet taps
  // the whole screen and control panel are on the page
  const screen = await page.locator('#game').boundingBox();
  const rock = await page.locator('[data-button="rock"]').boundingBox();
  expect(screen && rock).toBeTruthy();
  expect(screen!.x).toBeGreaterThanOrEqual(0);
  expect(screen!.x + screen!.width).toBeLessThanOrEqual(390);
  expect(rock!.y + rock!.height).toBeLessThanOrEqual(664 + 1);
  const canvas = page.locator('#game canvas').first();
  await expect(canvas).toHaveAttribute('width', '192');
  await expect(canvas).toHaveAttribute('height', '240');
  expect(await canvas.evaluate((el) => getComputedStyle(el).imageRendering)).toBe('pixelated');

  // a tap on the ROCK part of the panel is a button press (skips the logo)
  await page.touchscreen.tap(rock!.x + rock!.width / 2, rock!.y + rock!.height / 2);
  await untilScene(page, 'Home');
  // The painted home labels are touch targets on the actual monitor, not DOM overlay buttons.
  const homeCanvas = await canvas.boundingBox();
  await page.touchscreen.tap(
    homeCanvas!.x + homeCanvas!.width * 0.5,
    homeCanvas!.y + homeCanvas!.height * (220 / 240),
  );
  await untilScene(page, 'Options');
  await page.keyboard.press('Escape');
  await untilScene(page, 'Home');
  await page.keyboard.press('ArrowUp'); // select CPU after returning Home
  await page.touchscreen.tap(rock!.x + rock!.width / 2, rock!.y + rock!.height / 2);
  await untilFight(page);
  await ctx.close();
});

test('music: the menu loop on home and the fight loop in a match', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await pausedClock(page);
  await page.goto('http://127.0.0.1:5174/');
  await untilScene(page, 'Logo');
  await page.keyboard.press('Digit1'); // skip the logo (also lets the browser play sound)
  await untilScene(page, 'Home');
  await run(page, 300);
  expect(await page.evaluate(() => window.__rps.music())).toBe('menu');

  await page.keyboard.press('ArrowUp'); // CPU
  await page.keyboard.press('Enter'); // START GAME
  await untilFight(page);
  await run(page, 300);
  expect(['fight', 'storm', 'harbor', 'courtyard', 'foundry']).toContain(
    await page.evaluate(() => window.__rps.music()),
  );
  expect(errors).toEqual([]);
});

test('ONLINE opens the lobby, and BACK returns home', async ({ page }) => {
  await pausedClock(page);
  await page.goto('http://127.0.0.1:5174/');
  await untilScene(page, 'Logo');
  await page.keyboard.press('Digit1'); // skip the logo
  await untilScene(page, 'Home');
  // Online is the default selection. (enabled in dev builds: local server address)
  await page.keyboard.press('Enter');
  await untilScene(page, 'Lobby');
  await page.keyboard.press('Escape');
  await untilScene(page, 'Home');
});

test('JOIN ROOM takes letters by keyboard layout, and its code box is a real text field', async ({
  page,
}) => {
  await pausedClock(page);
  await page.goto('http://127.0.0.1:5174/');
  await untilScene(page, 'Logo');
  await page.keyboard.press('Digit1');
  await untilScene(page, 'Home');
  // Online is the default selection.
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
  await page.goto('http://127.0.0.1:5174/');
  await untilScene(page, 'Logo');
  await page.keyboard.press('Digit1');
  await untilScene(page, 'Home');
  // Online is the default selection.
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
