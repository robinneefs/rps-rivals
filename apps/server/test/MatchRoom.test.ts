import { defaultRules, defaultTimings, PROTOCOL_VERSION, seededRng, type ServerMessage } from '@rps/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { FakeClock } from '../../../packages/core/test/fakeClock';
import { CloseCode, defaultRoomTimeouts, MatchRoom, type Connection } from '../src/MatchRoom';

class FakeConn implements Connection {
  readonly inbox: ServerMessage[] = [];
  closed: { code: number; reason: string } | null = null;
  send(msg: ServerMessage): void {
    // the real transport is JSON, so make sure every message survives it
    this.inbox.push(JSON.parse(JSON.stringify(msg)) as ServerMessage);
  }
  close(code: number, reason: string): void {
    this.closed ??= { code, reason };
  }
  of<T extends ServerMessage['type']>(type: T): Extract<ServerMessage, { type: T }>[] {
    return this.inbox.filter((m): m is Extract<ServerMessage, { type: T }> => m.type === type);
  }
  get last(): ServerMessage | undefined {
    return this.inbox.at(-1);
  }
}

const hello = (intent: 'create' | 'join', version = '0.6.0', protocol = PROTOCOL_VERSION) =>
  JSON.stringify({ type: 'hello', protocol, version, intent });
const send = (room: MatchRoom, conn: Connection, msg: object) => room.receive(conn, JSON.stringify(msg));

describe('MatchRoom', () => {
  let clock: FakeClock;
  let room: MatchRoom;
  let a: FakeConn;
  let b: FakeConn;

  beforeEach(() => {
    clock = new FakeClock();
    room = new MatchRoom(clock, seededRng(7));
    a = new FakeConn();
    b = new FakeConn();
  });

  const seatBoth = () => {
    room.receive(a, hello('create'));
    room.receive(b, hello('join'));
  };
  const startMatch = () => {
    seatBoth();
    send(room, a, { type: 'character', character: 'taiko', confirmed: true });
    send(room, b, { type: 'character', character: 'riot', confirmed: true });
    send(room, a, { type: 'ready' });
    send(room, b, { type: 'ready' });
  };

  it('seats the creator as p1 and the joiner as p2, then tells both', () => {
    seatBoth();
    expect(a.inbox[0]).toMatchObject({ type: 'welcome', side: 'p1' });
    expect(b.inbox[0]).toMatchObject({ type: 'welcome', side: 'p2' });
    expect(a.last).toEqual({ type: 'opponentJoined' });
    expect(b.last).toEqual({ type: 'opponentJoined' });
  });

  it('refuses joining an empty room, creating a used one, a third player, and other versions', () => {
    room.receive(a, hello('join'));
    expect(a.last).toEqual({ type: 'error', error: 'noRoom' });
    expect(a.closed?.code).toBe(CloseCode.refused);

    const host = new FakeConn();
    room.receive(host, hello('create'));
    const again = new FakeConn();
    room.receive(again, hello('create'));
    expect(again.last).toEqual({ type: 'error', error: 'taken' });

    const old = new FakeConn();
    room.receive(old, hello('join', '0.5.0'));
    expect(old.last).toEqual({ type: 'error', error: 'version' });

    const proto = new FakeConn();
    room.receive(proto, hello('join', '0.6.0', PROTOCOL_VERSION + 1));
    expect(proto.last).toEqual({ type: 'error', error: 'protocol' });

    room.receive(b, hello('join'));
    const third = new FakeConn();
    room.receive(third, hello('join'));
    expect(third.last).toEqual({ type: 'error', error: 'full' });
  });

  it('refuses anything but a hello first, and malformed messages', () => {
    send(room, a, { type: 'ready' });
    expect(a.last).toEqual({ type: 'error', error: 'bad' });
    room.receive(b, '{not json');
    expect(b.last).toEqual({ type: 'error', error: 'bad' });
  });

  it('starts only when both players are ready, and sends time left instead of clock times', () => {
    seatBoth();
    send(room, a, { type: 'character', character: 'taiko', confirmed: true });
    send(room, b, { type: 'character', character: 'riot', confirmed: true });
    send(room, a, { type: 'ready' });
    expect(a.of('phase')).toHaveLength(0);
    send(room, b, { type: 'ready' });
    const [phase] = a.of('phase');
    expect(phase).toMatchObject({ phase: 'roundIntro', msLeft: defaultTimings.roundIntroMs, round: 1 });
    const full = defaultRules.startHealth;
    expect(phase?.state.health).toEqual({ p1: full, p2: full });
    expect(b.of('phase')).toEqual(a.of('phase'));
  });

  it('keeps picks secret until the reveal and ignores bad moves', () => {
    startMatch();
    clock.advance(defaultTimings.roundIntroMs);
    send(room, a, { type: 'pick', move: 'scissors' });
    send(room, b, { type: 'pick', move: 'laser' });
    expect(b.of('locked')).toEqual([{ type: 'locked', side: 'p1' }]);
    expect(JSON.stringify(b.inbox.filter((m) => m.type !== 'welcome'))).not.toContain('scissors');

    send(room, b, { type: 'pick', move: 'paper' });
    clock.advance(defaultTimings.pickMs);
    const [reveal] = b.of('reveal');
    expect(reveal?.picks).toEqual({ p1: 'scissors', p2: 'paper' });
    expect(reveal?.outcome).toMatchObject({ kind: 'win', winner: 'p1', damage: 20 });
    expect(reveal?.autoPicked).toEqual({ p1: false, p2: false });
  });

  it('plays a whole match to matchOver and needs both players for a rematch', () => {
    startMatch();
    for (let i = 0; i < 2000 && a.of('matchOver').length === 0; i++) clock.advance(1000);
    expect(a.of('matchOver')).toHaveLength(1);

    send(room, a, { type: 'rematch' });
    expect(b.last).toEqual({ type: 'rematchRequested', side: 'p1' });
    send(room, b, { type: 'rematch' });
    expect(a.last).toEqual({ type: 'rematchAccepted' });

    const phasesBefore = a.of('phase').length;
    send(room, a, { type: 'ready' });
    send(room, b, { type: 'ready' });
    expect(a.of('phase').slice(phasesBefore)[0]).toMatchObject({ phase: 'roundIntro', round: 1 });
  });

  it('ignores a rematch request while the match is still running', () => {
    startMatch();
    send(room, a, { type: 'rematch' });
    expect(b.of('rematchRequested')).toHaveLength(0);
  });

  it('tells the other player and closes the room when someone leaves', () => {
    startMatch();
    room.leave(a);
    expect(b.last).toEqual({ type: 'opponentLeft' });
    expect(b.closed?.code).toBe(CloseCode.opponentLeft);
    expect(room.isEmpty).toBe(true);
    clock.advance(60_000);
    expect(b.of('phase').length).toBe(1); // the referee stopped
  });

  it('closes a room nobody joins', () => {
    room.receive(a, hello('create'));
    clock.advance(defaultRoomTimeouts.lobbyMs);
    expect(a.closed?.code).toBe(CloseCode.timeout);
    expect(room.isEmpty).toBe(true);
  });
});
