import {
  defaultRules,
  rulesForFighters,
  initialCharacterSelection,
  defaultTimings,
  opponentOf,
  parseClientMessage,
  PROTOCOL_VERSION,
  Referee,
  SIDES,
  type Cancel,
  type Clock,
  type JoinError,
  type PhaseTimings,
  type Rng,
  type RulesConfig,
  type ServerMessage,
  type Side,
  type PlayableCharacterId,
} from '@rps/core';

/** One player's connection, whatever carries it (a WebSocket in the Durable Object, a fake in tests). */
export interface Connection {
  send(msg: ServerMessage): void;
  close(code: number, reason: string): void;
}

interface Seat {
  conn: Connection;
  version: string;
  ready: boolean;
  rematch: boolean;
  heartbeat?: Cancel;
}

export interface RoomTimeouts {
  /** How long a created room waits for the second player. */
  lobbyMs: number;
  /** How long a finished match waits for both players to ask for a rematch. */
  afterMatchMs: number;
}

export const defaultRoomTimeouts: RoomTimeouts = { lobbyMs: 10 * 60_000, afterMatchMs: 2 * 60_000 };

/** WebSocket close codes the game can tell apart (4000 to 4999 are free for apps). */
export const CloseCode = { normal: 1000, refused: 4000, opponentLeft: 4001, timeout: 4002 } as const;

/**
 * One online match room: seats two players, runs the same Referee as the local game on the room's
 * clock, and forwards its events. It is the only place both picks exist before the reveal.
 * It knows nothing about WebSockets or Cloudflare, so tests drive it with a fake clock.
 */
export class MatchRoom {
  private readonly seats: Record<Side, Seat | null> = { p1: null, p2: null };
  private referee: Referee | null = null;
  private idle: Cancel | null = null;
  private selection = initialCharacterSelection();
  private selectionLocked = false;

  constructor(
    private readonly clock: Clock,
    private readonly rng: Rng,
    private readonly rules: RulesConfig = defaultRules,
    private readonly timings: PhaseTimings = defaultTimings,
    private readonly timeouts: RoomTimeouts = defaultRoomTimeouts,
  ) {}

  /** Nobody is seated: the room can be reused or forgotten. */
  get isEmpty(): boolean {
    return !this.seats.p1 && !this.seats.p2;
  }

  /** A message arrived on a connection. Anything malformed or out of turn is refused or ignored. */
  receive(conn: Connection, raw: unknown): void {
    const msg = parseClientMessage(raw);
    const side = this.sideOf(conn);
    if (!side) {
      if (msg?.type !== 'hello') return this.refuse(conn, 'bad');
      if (msg.protocol !== PROTOCOL_VERSION) return this.refuse(conn, 'protocol');
      return msg.intent === 'create' ? this.create(conn, msg.version) : this.join(conn, msg.version);
    }
    const seat = this.seats[side]!;
    switch (msg?.type) {
      case 'ping':
        seat.heartbeat?.();
        seat.heartbeat = this.clock.schedule(20000, () => {
          this.leave(conn);
          conn.close(CloseCode.timeout, 'connection check timed out');
        });
        conn.send({ type: 'pong' });
        break;
      case 'ready':
        seat.ready = true;
        this.startIfReady();
        break;
      case 'character':
        this.chooseCharacter(side, msg.character, msg.confirmed);
        break;
      case 'pick':
        this.referee?.submitPick(side, msg.move);
        break;
      case 'rematch':
        this.requestRematch(side);
        break;
      // a repeated hello or garbage from a seated player is ignored
    }
  }

  /** A connection closed (the player left, or the network dropped). */
  leave(conn: Connection): void {
    const side = this.sideOf(conn);
    if (!side) return;
    this.seats[side]?.heartbeat?.();
    this.seats[side] = null;
    const other = this.seats[opponentOf(side)];
    if (other) {
      other.conn.send({ type: 'opponentLeft' });
      other.conn.close(CloseCode.opponentLeft, 'opponent left');
    }
    this.reset();
  }

  private create(conn: Connection, version: string): void {
    if (!this.isEmpty) return this.refuse(conn, 'taken');
    this.seats.p1 = { conn, version, ready: false, rematch: false };
    this.welcome('p1');
    this.setIdle(this.timeouts.lobbyMs);
  }

  private join(conn: Connection, version: string): void {
    const host = this.seats.p1;
    if (!host) return this.refuse(conn, 'noRoom');
    if (this.seats.p2) return this.refuse(conn, 'full');
    if (version !== host.version) return this.refuse(conn, 'version');
    this.seats.p2 = { conn, version, ready: false, rematch: false };
    this.clearIdle();
    this.welcome('p2');
    this.setIdle(this.timeouts.lobbyMs);
    this.broadcast({ type: 'selection', ...this.selection });
    this.broadcast({ type: 'opponentJoined' });
  }

  private welcome(side: Side): void {
    this.seats[side]?.conn.send({ type: 'welcome', side, rules: this.rules, timings: this.timings });
  }

  private startIfReady(): void {
    if (!SIDES.every((s) => this.seats[s]?.ready)) return;
    if (!SIDES.every((s) => this.selection.confirmed[s])) return;
    const phase = this.referee?.currentPhase ?? 'idle';
    if (phase !== 'idle' && phase !== 'matchOver') return;
    this.clearIdle();
    this.referee ??= this.createReferee();
    this.referee.start();
  }

  private chooseCharacter(side: Side, character: PlayableCharacterId, confirmed: boolean): void {
    // Identities cannot change during a match or its rematch handshake.
    if (this.referee || this.selectionLocked) return;
    this.selection.fighters[side] = character;
    this.selection.confirmed[side] = confirmed;
    this.selectionLocked = SIDES.every((s) => this.selection.confirmed[s]);
    // A readiness message sent before lock-in cannot bypass selection.
    for (const s of SIDES) if (this.seats[s]) this.seats[s]!.ready = false;
    this.broadcast({
      type: 'selection',
      fighters: { ...this.selection.fighters },
      confirmed: { ...this.selection.confirmed },
    });
  }

  private requestRematch(side: Side): void {
    const seat = this.seats[side]!;
    if (this.referee?.currentPhase !== 'matchOver' || seat.rematch) return;
    seat.rematch = true;
    this.broadcast({ type: 'rematchRequested', side });
    if (!SIDES.every((s) => this.seats[s]?.rematch)) return;
    for (const s of SIDES) Object.assign(this.seats[s]!, { rematch: false, ready: false });
    this.broadcast({ type: 'rematchAccepted' });
  }

  private createReferee(): Referee {
    const referee = new Referee(
      rulesForFighters(this.rules, this.selection.fighters),
      this.timings,
      this.clock,
      this.rng,
    );
    referee.on('phase', (e) =>
      this.broadcast({
        type: 'phase',
        phase: e.phase,
        msLeft: e.endsAt === null ? null : Math.max(0, e.endsAt - this.clock.now()),
        round: e.round,
        finalRound: e.finalRound,
        state: referee.matchState,
      }),
    );
    referee.on('locked', (e) => this.broadcast({ type: 'locked', ...e }));
    referee.on('reveal', (e) => this.broadcast({ type: 'reveal', ...e }));
    referee.on('matchOver', (e) => {
      this.broadcast({ type: 'matchOver', ...e });
      this.setIdle(this.timeouts.afterMatchMs);
    });
    return referee;
  }

  private broadcast(msg: ServerMessage): void {
    for (const s of SIDES) this.seats[s]?.conn.send(msg);
  }

  private refuse(conn: Connection, error: JoinError): void {
    conn.send({ type: 'error', error });
    conn.close(CloseCode.refused, error);
  }

  private sideOf(conn: Connection): Side | null {
    return SIDES.find((s) => this.seats[s]?.conn === conn) ?? null;
  }

  /** Closes the room if nothing happens in time, so an abandoned room stops using server time. */
  private setIdle(ms: number): void {
    this.clearIdle();
    this.idle = this.clock.schedule(ms, () => {
      this.idle = null;
      for (const s of SIDES) this.seats[s]?.conn.close(CloseCode.timeout, 'timed out');
      this.reset();
    });
  }

  private clearIdle(): void {
    this.idle?.();
    this.idle = null;
  }

  private reset(): void {
    this.clearIdle();
    this.referee?.dispose();
    this.referee = null;
    this.selection = initialCharacterSelection();
    this.selectionLocked = false;
    for (const s of SIDES) {
      this.seats[s]?.heartbeat?.();
      this.seats[s] = null;
    }
  }
}
