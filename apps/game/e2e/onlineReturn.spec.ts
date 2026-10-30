import { expect, test, type Page, type WebSocketRoute } from '@playwright/test';
import { defaultRules, defaultTimings, type MatchState, type ServerMessage } from '@rps/core';

async function advance(page: Page, ms: number) {
  for (let left = ms; left > 0; left -= 50) await page.clock.runFor(Math.min(left, 50));
}
const scenes = (page: Page) => page.evaluate(() => window.__rps?.scenes() ?? []);
async function until(page: Page, scene: string) {
  await expect
    .poll(
      async () => {
        await advance(page, 100);
        return scenes(page);
      },
      { timeout: 15000, intervals: [10, 20, 50] },
    )
    .toContain(scene);
  await advance(page, 700);
}

for (const exit of [
  'main-menu',
  'rival-left-fight',
  'connection-lost-fight',
  'rival-left-result',
  'connection-lost-result',
  'suspended-fight',
  'suspended-result',
] as const) {
  test(`online ${exit} returns Home and reopens the Online menu`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    let socket: WebSocketRoute | undefined;
    let connections = 0;
    const state: MatchState = {
      round: 1,
      health: { p1: 100, p2: 80 },
      roundsWon: { p1: 0, p2: 0 },
      winner: null,
    };
    const send = (message: ServerMessage) => socket!.send(JSON.stringify(message));
    await page.routeWebSocket('**/room/*', (ws) => {
      socket = ws;
      connections++;
      ws.onMessage((raw) => {
        const message = JSON.parse(String(raw));
        if (message.type === 'hello') {
          send({ type: 'welcome', side: 'p1', rules: defaultRules, timings: defaultTimings });
          send({ type: 'opponentJoined' });
        } else if (message.type === 'character') {
          send({
            type: 'selection',
            fighters: { p1: message.character, p2: 'riot' },
            confirmed: { p1: message.confirmed, p2: true },
          });
        } else if (message.type === 'ready') {
          send({ type: 'phase', phase: 'roundIntro', round: 1, finalRound: false, msLeft: 2800, state });
        } else if (message.type === 'ping') send({ type: 'pong' });
      });
    });
    await page.clock.install({ time: 0 });
    await page.clock.pauseAt(1000);
    await page.goto('/');
    await until(page, 'Home');
    await page.keyboard.press('F4');
    await page.keyboard.press('Enter'); // Online is the Home default.
    await until(page, 'Lobby');
    await page.keyboard.press('Enter'); // Create room, then scripted peer joins.
    await until(page, 'CharacterSelect');
    await page.keyboard.press('Enter');
    await until(page, 'Fight');
    await expect
      .poll(
        async () => {
          await advance(page, 100);
          return page.evaluate(() => window.__rps.phase());
        },
        { timeout: 15000, intervals: [10, 20, 50] },
      )
      .toBe('roundIntro');
    await advance(page, 700);
    if (exit === 'main-menu' || exit.endsWith('result')) {
      send({
        type: 'matchOver',
        winner: 'p1',
        state: { ...state, winner: 'p1', roundsWon: { p1: 2, p2: 0 } },
      });
      await until(page, 'Result');
    }
    if (exit.startsWith('suspended')) {
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
        document.dispatchEvent(new Event('visibilitychange'));
      });
    }
    if (exit === 'main-menu') {
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    } else if (exit.startsWith('rival-left')) send({ type: 'opponentLeft' });
    else socket!.close({ code: 1001, reason: 'test connection loss' });
    if (exit.startsWith('suspended')) {
      await advance(page, 200);
      expect(await scenes(page)).not.toContain('Home');
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
        document.dispatchEvent(new Event('visibilitychange'));
        window.dispatchEvent(new Event('focus'));
      });
    }
    await until(page, 'Home');
    expect(await scenes(page)).not.toContain('Lobby');
    await page.keyboard.press('Enter');
    await until(page, 'Lobby');
    // The create form opens a connection; the Online menu must not open one on entry.
    expect(connections).toBe(1);
    await expect(page.getByRole('textbox', { name: 'Room code' })).toHaveCount(0);
    await page.keyboard.press('ArrowDown'); // JOIN ROOM must still be reachable from the menu.
    await page.keyboard.press('Enter');
    await advance(page, 200);
    await expect(page.getByRole('textbox', { name: 'Room code' })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('leaving Join Room also resets the next Play Online entry', async ({ page }) => {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.goto('/');
  await until(page, 'Home');
  await page.keyboard.press('F4');
  await page.keyboard.press('Enter');
  await until(page, 'Lobby');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await advance(page, 200);
  await expect(page.getByRole('textbox', { name: 'Room code' })).toBeVisible();
  await page.keyboard.press('Escape');
  await advance(page, 200);
  await page.keyboard.press('Escape');
  await until(page, 'Home');
  await page.keyboard.press('Enter');
  await until(page, 'Lobby');
  await expect(page.getByRole('textbox', { name: 'Room code' })).toHaveCount(0);
});
