// Two actual Chrome clients against the local Worker, not a mocked socket.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const output = process.env.RPS_ONLINE_OUTPUT || 'art/menus/character-select-lineup-v2';
const character = process.env.RPS_ONLINE_CHARACTER || 'riot';
if (!['taiko', 'riot', 'anchor'].includes(character)) throw Error('Unknown review character');
const texture = { taiko: 'fighter-p1', riot: 'fighter-p2', anchor: 'fighter-anchor' }[character];
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' }),
  errors = [],
  checks = [];
const scene = async (p, key) => {
  await p.waitForFunction((k) => window.__rps?.scenes().includes(k), key);
  await p.waitForTimeout(400);
};
const selection = (p) => p.evaluate(() => window.__rps.characterSelection());
async function pair() {
  const a = await browser.newPage({ viewport: { width: 600, height: 1000 }, reducedMotion: 'reduce' });
  const b = await browser.newPage({
    viewport: { width: 390, height: 664 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  for (const p of [a, b]) p.on('pageerror', (e) => errors.push(e.message));
  let code;
  a.on('websocket', (ws) => {
    if (ws.url().includes('/room/')) code = ws.url().split('/room/')[1];
  });
  await a.goto('http://127.0.0.1:5184/?menuReview=create');
  await scene(a, 'Lobby');
  for (let i = 0; i < 50 && !code; i++) await a.waitForTimeout(100);
  if (!code) throw Error('Host never opened a real room');
  await a.keyboard.press('Backquote');
  await b.goto('http://127.0.0.1:5184/?menuReview=join');
  await scene(b, 'Lobby');
  await b.keyboard.press('Backquote');
  await b.getByLabel('Room code').fill(code);
  await b.keyboard.press('Enter');
  await Promise.all([scene(a, 'CharacterSelect'), scene(b, 'CharacterSelect')]);
  return { a, b };
}
try {
  if (!process.argv.includes('--disconnect-only')) {
    const { a, b } = await pair();
    for (const p of [a, b])
      for (let i = 0; i < ['taiko', 'riot', 'anchor'].indexOf(character); i++)
        await p.keyboard.press('ArrowRight');
    await a.keyboard.press('Enter');
    await a.waitForFunction(() => window.__rps.characterSelection()?.confirmed);
    if ((await selection(a)).starting) throw Error('Started without rival confirmation');
    await a.locator('#game canvas').screenshot({ path: `${output}/online-waiting.png` });
    await a.keyboard.press('ArrowRight');
    if ((await selection(a)).selected !== character) throw Error('Confirmed selection changed');
    await a.keyboard.press('Escape');
    await a.waitForFunction(() => !window.__rps.characterSelection()?.confirmed);
    await a.keyboard.press('Enter');
    await b.keyboard.press('Enter');
    await Promise.all([scene(a, 'Fight'), scene(b, 'Fight')]);
    for (const p of [a, b]) {
      const fighters = await p.evaluate(() => window.__rps.fighters());
      if (fighters.p1 !== character || fighters.p2 !== character)
        throw Error('Peers disagree on mirror identities');
      const textures = await p.evaluate(() => window.__rps.combatTextures());
      if (textures.join(',') !== `${texture},${texture}`) throw Error('Mirror rendered another identity');
    }
    await a.screenshot({ path: `${output}/online-mirror-cabinet.png` });
    await b.screenshot({ path: `${output}/online-mirror-phone.png` });
    checks.push(
      `Real Worker + two browsers: confirmation wait/cancel, synchronized ${character} mirrors, exact combat sheets.`,
    );
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline && !(await a.evaluate(() => window.__rps.scenes().includes('Result')))) {
      if (await a.evaluate(() => window.__rps.phase() === 'picking')) {
        await a.keyboard.press('Digit1');
        await b.keyboard.press('Digit3');
      }
      await a.waitForTimeout(200);
    }
    await Promise.all([scene(a, 'Result'), scene(b, 'Result')]);
    await a.keyboard.press('Enter');
    await b.keyboard.press('Enter');
    await Promise.all([scene(a, 'Fight'), scene(b, 'Fight')]);
    for (const p of [a, b]) {
      const f = await p.evaluate(() => window.__rps.fighters());
      if (f.p1 !== character || f.p2 !== character) throw Error('Rematch changed characters');
    }
    checks.push('Complete real online match + mutually accepted rematch retains both selected identities.');
    await a.close();
    await b.close();
  }
  const pending = await pair();
  await pending.a.keyboard.press('Enter');
  await pending.a.waitForFunction(() => window.__rps.characterSelection()?.confirmed);
  await pending.b.close();
  await pending.a.waitForFunction(() => window.__rps.characterSelection()?.status === 'RIVAL LEFT');
  if (await pending.a.evaluate(() => window.__rps.scenes().includes('Fight')))
    throw Error('Disconnect started a match');
  await pending.a.keyboard.press('Escape');
  await scene(pending.a, 'Home');
  await pending.a.close();
  checks.push('Opponent leaving during confirmation shows RIVAL LEFT and permits return Home.');
  const changing = await pair();
  await changing.a.keyboard.press('Enter');
  await changing.b.keyboard.press('Enter');
  // Leave in the confirmation-to-fight transition, before either peer can safely assume ready().
  await changing.a.waitForFunction(() => {
    const selection = window.__rps.characterSelection();
    return selection?.starting && selection.transitioning;
  });
  await changing.b.close();
  await changing.a.waitForFunction(() => window.__rps.scenes().includes('Home'), null, { timeout: 8000 });
  await changing.a.close();
  checks.push('Disconnect during the selection-to-fight transition recovers Home without a stuck match.');
  if (errors.length) throw Error(errors.join('\n'));
  writeFileSync(
    `${output}/${process.argv.includes('--disconnect-only') ? 'disconnect-checks' : 'online-checks'}.json`,
    JSON.stringify({ realLocalWorker: true, mockedSockets: false, errors, checks }, null, 2),
  );
  console.log(checks.join('\n'));
} finally {
  await browser.close();
}
