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

async function untilRoundIntro(page: Page) {
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
}

test('online Character Select from the result screen returns both players to the lineup', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let socket: WebSocketRoute | undefined;
  let connections = 0;
  const received: string[] = [];
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
      received.push(message.type);
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
      } else if (message.type === 'characterSelect') {
        // The scripted rival agrees, as the room does once both players have chosen.
        send({ type: 'rematchRequested', side: 'p2' });
        send({ type: 'characterSelectRequested', side: 'p1' });
        send({
          type: 'selection',
          fighters: { p1: 'taiko', p2: 'riot' },
          confirmed: { p1: false, p2: false },
        });
        send({ type: 'characterSelectAccepted' });
      } else if (message.type === 'ping') send({ type: 'pong' });
    });
  });
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.goto('/');
  await until(page, 'Home');
  await page.keyboard.press('F4');
  await page.keyboard.press('Enter');
  await until(page, 'Lobby');
  await page.keyboard.press('Enter');
  await until(page, 'CharacterSelect');
  await page.keyboard.press('Enter');
  await untilRoundIntro(page);
  send({
    type: 'matchOver',
    winner: 'p1',
    state: { ...state, winner: 'p1', roundsWon: { p1: 2, p2: 0 } },
  });
  await until(page, 'Result');
  await page.keyboard.press('ArrowDown'); // CHARACTER SELECT
  await page.keyboard.press('Enter');
  await until(page, 'CharacterSelect');
  expect(received).toContain('characterSelect');
  expect(await scenes(page)).not.toContain('Result');
  // Same room, same connection: no new lobby needed.
  expect(connections).toBe(1);
  await page.keyboard.press('Enter');
  await untilRoundIntro(page);
  expect(received.filter((t) => t === 'ready').length).toBeGreaterThanOrEqual(2);
  expect(errors).toEqual([]);
});
