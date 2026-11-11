import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const base = 'http://127.0.0.1:5194/';
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [],
  checks = [];
try {
  async function pair(delayReady = false) {
    const a = await browser.newPage({ viewport: { width: 600, height: 1000 } });
    const b = await browser.newPage({ viewport: { width: 390, height: 664 }, reducedMotion: 'reduce' });
    if (delayReady)
      await b.addInitScript(() => {
        const send = WebSocket.prototype.send;
        WebSocket.prototype.send = function (message) {
          if (JSON.parse(message).type === 'ready') setTimeout(() => send.call(this, message), 2500);
          else send.call(this, message);
        };
      });
    for (const p of [a, b]) p.on('pageerror', (e) => errors.push(e.message));
    let code;
    a.on('websocket', (ws) => {
      if (ws.url().includes('/room/')) code = ws.url().split('/room/')[1];
    });
    await a.goto(base + '?menuReview=create');
    await a.waitForFunction(() => window.__rps?.scenes().includes('Lobby'));
    for (let i = 0; i < 60 && !code; i++) await a.waitForTimeout(100);
    if (!code) throw Error('Room not created');
    await b.goto(base + '?menuReview=join');
    await b.getByLabel('Room code').fill(code);
    await b.keyboard.press('Enter');
    await Promise.all([a, b].map((p) => p.waitForFunction(() => window.__rps.characterSelection())));
    await a.waitForTimeout(500);
    await a.keyboard.press('ArrowLeft');
    await b.keyboard.press('ArrowRight');
    await a.keyboard.press('Enter');
    await b.keyboard.press('Enter');
    await Promise.all([a, b].map((p) => p.waitForFunction(() => window.__rps.scenes().includes('Fight'))));
    return { a, b };
  }
  const { a, b } = await pair(true);
  await a.waitForTimeout(2200);
  if ((await a.evaluate(() => window.__rps.phase())) !== 'idle')
    throw Error('Host started before delayed peer ready');
  await a.locator('#game canvas').screenshot({ path: 'art/menus/versus-v1/online-waiting.png' });
  await Promise.all([a, b].map((p) => p.waitForFunction(() => window.__rps.phase() === 'roundIntro')));
  await a.waitForTimeout(700);
  await a.locator('#game canvas').screenshot({ path: 'art/menus/versus-v1/online-open.png' });
  for (const p of [a, b])
    if (
      JSON.stringify(await p.evaluate(() => window.__rps.fighters())) !==
      JSON.stringify({ p1: 'anchor', p2: 'riot' })
    )
      throw Error('Wrong matchup');
  checks.push(
    'Actual local Worker and two browsers: Anchor versus Riot, delayed peer readiness keeps host panels closed, shared roundIntro opens both.',
  );
  await a.close();
  await b.close();
  const next = await pair();
  await next.b.close();
  await next.a.waitForTimeout(1000);
  await next.a.locator('#game canvas').screenshot({ path: 'art/menus/versus-v1/online-disconnect.png' });
  if ((await next.a.evaluate(() => window.__rps.phase())) !== 'idle')
    throw Error('Disconnected intro started match');
  checks.push(
    'Peer disconnected during closed panels; match remains idle and disconnect notice replaces panels.',
  );
  if (errors.length) throw Error(errors.join('\n'));
  writeFileSync('art/menus/versus-v1/online-checks.json', JSON.stringify({ checks, errors }, null, 2));
  console.log(JSON.stringify({ checks, errors }));
} finally {
  await browser.close();
}
