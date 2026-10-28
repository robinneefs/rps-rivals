import { describe, expect, it } from 'vitest';
import { defaultRules, seededRng, PROTOCOL_VERSION, type ServerMessage } from '@rps/core';
import { FakeClock } from '../../../packages/core/test/fakeClock';
import { MatchRoom, type Connection } from '../src/MatchRoom';
import { OnlineSession } from '../../game/src/session/OnlineSession';
import type { SocketHandlers } from '../../game/src/session/socket';

/** Real client/session + parser + room roundtrip, with deterministic transport and time. */
function network() {
  const clock = new FakeClock();
  const room = new MatchRoom(clock, seededRng(17));
  const player = (intent: 'create' | 'join') => {
    let handlers!: SocketHandlers;
    let closed = false;
    const messages: ServerMessage[] = [];
    const conn: Connection = {
      send: (message) => {
        messages.push(structuredClone(message));
        handlers.message(JSON.stringify(message));
      },
      close: () => {
        if (!closed) {
          closed = true;
          handlers.close(1000);
        }
      },
    };
    const session = new OnlineSession({
      serverUrl: 'ws://test',
      roomCode: 'BCDF',
      intent,
      version: '2.2.0',
      now: () => clock.now(),
      openSocket: (_, h) => {
        handlers = h;
        return {
          send: (raw) => room.receive(conn, raw),
          close: () => {
            if (!closed) {
              closed = true;
              room.leave(conn);
            }
          },
        };
      },
    });
    handlers.open();
    return { session, messages, conn, raw: (message: object) => room.receive(conn, JSON.stringify(message)) };
  };
  return { clock, room, a: player('create'), b: player('join') };
}

describe('character selection over the match protocol', () => {
  it('never starts from ready alone; confirmations synchronize identities, including mirrors', () => {
    const { a, b } = network();
    a.session.ready();
    b.session.ready();
    expect(a.messages.filter((m) => m.type === 'phase')).toHaveLength(0);
    a.session.selectCharacter('riot', true);
    expect(b.session.selection.confirmed).toEqual({ p1: true, p2: false });
    b.session.selectCharacter('riot', true);
    expect(a.session.fighters).toEqual({ p1: 'riot', p2: 'riot' });
    expect(b.session.fighters).toEqual(a.session.fighters);
    expect(a.messages.filter((m) => m.type === 'phase')).toHaveLength(0);
    a.session.ready();
    b.session.ready();
    expect(a.session.snapshot().phase).toBe('roundIntro');
    expect(a.session.rules).toEqual(defaultRules);
    expect(a.session.snapshot().state.health).toEqual({ p1: 50, p2: 50 });
  });
  it('allows changing/unconfirming while waiting, but locks both identities at mutual confirmation', () => {
    const { a, b } = network();
    a.session.selectCharacter('riot', true);
    a.session.selectCharacter('riot', false);
    expect(b.session.selection.confirmed.p1).toBe(false);
    a.session.selectCharacter('taiko', true);
    b.session.selectCharacter('taiko', true);
    a.session.selectCharacter('riot', false);
    expect(b.session.fighters).toEqual({ p1: 'taiko', p2: 'taiko' });
    expect(b.session.selection.confirmed).toEqual({ p1: true, p2: true });
    a.session.ready();
    b.session.ready();
    b.session.selectCharacter('riot', true);
    expect(a.session.fighters).toEqual({ p1: 'taiko', p2: 'taiko' });
  });
  it('accepts Anchor while rejecting unrecognized choices without substituting an identity', () => {
    const { a, b } = network();
    a.raw({ type: 'character', character: 'anchor', confirmed: true });
    expect(b.session.selection.confirmed.p1).toBe(true);
    expect(b.session.fighters.p1).toBe('anchor');
    a.raw({ type: 'character', character: 'someone', confirmed: true });
    expect(b.session.selection.confirmed.p1).toBe(true);
    expect(b.session.fighters.p1).toBe('anchor');
  });
  it('preserves selected identities and shared rules through complete matches and rematches', () => {
    const { a, b, clock } = network();
    a.session.selectCharacter('anchor', true);
    b.session.selectCharacter('taiko', true);
    a.session.ready();
    b.session.ready();
    for (let i = 0; i < 2000 && a.session.snapshot().phase !== 'matchOver'; i++) clock.advance(1000);
    expect(a.session.snapshot().phase).toBe('matchOver');
    a.session.requestRematch();
    b.session.requestRematch();
    a.session.ready();
    b.session.ready();
    expect(a.session.snapshot().phase).toBe('roundIntro');
    expect(a.session.fighters).toEqual({ p1: 'anchor', p2: 'taiko' });
    expect(b.session.fighters).toEqual(a.session.fighters);
    expect(b.session.rules.damage).toEqual(defaultRules.damage);
  });
  it('reports leaving during confirmation and times out abandoned selection rooms', () => {
    const { a, b, clock } = network();
    let left = 0;
    b.session.on('opponentLeft', () => left++);
    a.session.selectCharacter('taiko', true);
    a.session.dispose();
    expect(left).toBe(1);
    expect(b.session.endedReason).toBe('opponentLeft');
    clock.advance(700000);
    expect(b.messages.filter((m) => m.type === 'phase')).toHaveLength(0);
    const n = network();
    n.clock.advance(600001);
    expect(n.room.isEmpty).toBe(true);
  });
  it('refuses the previous wire protocol rather than running incompatible selection clients', () => {
    const n = network(),
      received: ServerMessage[] = [];
    const conn: Connection = { send: (m) => received.push(m), close: () => {} };
    n.room.receive(
      conn,
      JSON.stringify({ type: 'hello', protocol: PROTOCOL_VERSION - 1, version: '2.2.0', intent: 'join' }),
    );
    expect(received).toContainEqual({ type: 'error', error: 'protocol' });
  });
});
