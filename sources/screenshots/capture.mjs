// Captures screenshots of the running game for the docs (docs/screenshots/).
// Usage, from the repository root: node sources/screenshots/capture.mjs [seed]
// Builds the game, serves the production build (no dev panels), drives a match against the CPU
// with a paused fake clock and a seeded Math.random (so the CPU's picks, and the shots, come out
// much the same every run), and saves each screen at a desktop browser size and a phone size.
// Then plays into the picking countdown on each of the five stages for the stage gallery.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { webpSaver } from './webp.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const out = resolve(root, 'docs/screenshots');
const seed = Number(process.argv[2] ?? 7);
const port = 5175;
const url = `http://127.0.0.1:${port}/`;
mkdirSync(out, { recursive: true });

const devices = {
  browser: { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
};
const stages = ['rooftop', 'storm-field', 'sunset-harbor', 'lantern-courtyard', 'foundry-floor'];

// A server address enables PLAY ONLINE, as on the published site. The Online menu needs no server.
const build = spawnSync('npm run build', {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, VITE_SERVER_URL: 'ws://localhost:8787' },
});
if (build.status !== 0) process.exit(build.status ?? 1);
// Run Vite's own script with node (not through a shell), so kill() really stops the server.
const vite = resolve(root, 'node_modules/vite/bin/vite.js');
const server = spawn(
  process.execPath,
  [vite, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  { cwd: resolve(root, 'apps/game'), stdio: 'pipe' },
);
await new Promise((ok) => server.stdout.on('data', (d) => String(d).includes('Local') && ok()));

async function open(browser, device, query = '') {
  const page = await browser.newPage(device);
  await page.addInitScript((s) => {
    let a = s >>> 0; // mulberry32
    Math.random = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }, seed);
  // A clock that only moves when the script runs it, in small steps (Phaser clamps big frame gaps).
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.goto(url + query);
  const run = async (ms) => {
    for (let left = ms; left > 0; left -= 50) await page.clock.runFor(Math.min(50, left));
  };
  const scenes = () => page.evaluate(() => window.__rps?.scenes() ?? []);
  const phase = () => page.evaluate(() => window.__rps.phase());
  const until = async (done, maxMs = 20_000) => {
    for (let t = 0; t < maxMs && !(await done()); t += 50) await run(50);
  };
  // Asset loading uses real I/O, so wait for it outside the fake clock.
  for (let i = 0; i < 300 && !(await scenes()).includes('Logo'); i++) {
    await run(50);
    await page.waitForTimeout(50);
  }
  return { page, run, scenes, phase, until };
}

/** From the logo to the start of the first round against the CPU. */
async function toFight({ page, run, scenes, phase, until }, shot) {
  await run(1300);
  await shot?.('logo');
  await until(async () => (await scenes()).includes('Home'));
  await run(1500);
  await shot?.('home');
  await page.keyboard.press('ArrowUp'); // PLAY ONLINE is selected first
  await page.keyboard.press('Enter');
  await until(async () => (await scenes()).includes('CharacterSelect'));
  await run(1200);
  await page.keyboard.press('ArrowLeft'); // Anchor, the heavyweight
  await run(400);
  await shot?.('select');
  await page.keyboard.press('Enter');
  await until(() => page.evaluate(() => window.__rps.transitioning()));
  await run(1500); // the versus panels have slammed together and hold
  await shot?.('versus');
  await until(async () => (await phase()) === 'roundIntro');
  await run(1900);
  await shot?.('fight');
}

const browser = await chromium.launch();
const saveWebp = await webpSaver(browser);
const save = (page, file) => saveWebp(page, resolve(out, `${file}.webp`));
try {
  for (const [name, device] of Object.entries(devices)) {
    const game = await open(browser, device);
    const { page, run, scenes, phase, until } = game;
    const shot = (screen) => save(page, `${name}-${screen}`);
    await toFight(game, shot);
    // Play exchanges with a fixed pattern until the victory screen is up.
    const picks = ['Digit1', 'Digit2', 'Digit3', 'Digit1', 'Digit3'];
    let n = 0;
    let koShot = false;
    while (!(await scenes()).includes('Result') && n < 60) {
      await until(async () => (await phase()) === 'picking' || (await scenes()).includes('Result'));
      if ((await phase()) !== 'picking') break;
      await run(900);
      await page.keyboard.press(picks[n % picks.length]);
      await run(600);
      if (n === 0) await shot('pick'); // locked in, the countdown still running
      await until(async () => (await phase()) !== 'picking');
      await run(1000); // the coins collide
      if (n === 0) await shot('reveal');
      if (!koShot) {
        await until(async () => (await phase()) !== 'reveal');
        if ((await phase()) === 'roundOver') {
          await run(700); // the K.O. letters are up
          await shot('ko');
          koShot = true;
        }
      }
      n++;
    }
    await until(async () => (await scenes()).includes('Result'));
    await run(2500); // the victory splash has finished its entrance
    await shot('result');
    await page.close();
    console.log(name, 'done after', n, 'exchanges');

    const online = await open(browser, device);
    await online.until(async () => (await online.scenes()).includes('Home'));
    await online.run(1500);
    await online.page.keyboard.press('Enter');
    await online.until(async () => (await online.scenes()).includes('Lobby'));
    await online.run(1200);
    await save(online.page, `${name}-online`);
    await online.page.close();
  }
  for (const stage of stages) {
    const game = await open(browser, devices.phone, `?stage=${stage}`);
    await toFight(game);
    await game.until(async () => (await game.phase()) === 'picking');
    await game.run(1200);
    await save(game.page, `stage-${stage}`);
    await game.page.close();
    console.log('stage', stage, 'done');
  }
} finally {
  await browser.close();
  server.kill();
  process.exit(0);
}
