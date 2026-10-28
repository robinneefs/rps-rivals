import {
  defaultRules,
  initialCharacterSelection,
  Emitter,
  PROTOCOL_VERSION,
  type ClientMessage,
  type JoinError,
  type MatchState,
  type Move,
  type Phase,
  type RulesConfig,
  type ServerMessage,
  type Side,
  type Unsubscribe,
  type PlayableCharacterId,
} from '@rps/core';
import type { MatchSession, MatchView, SessionEvents } from './MatchSession';
import type { OpenSocket, Socket } from './socket';

export interface OnlineOptions {
  /** The match server's address, e.g. wss://rps-rivals-server.example.workers.dev */
  serverUrl: string;
  roomCode: string;
  intent: 'create' | 'join';
  /** This build's version; the room only pairs players on the same build. */
  version: string;
  openSocket: OpenSocket;
  /** Local time in ms, for turning the room's "time left" into a local deadline. */
  now: () => number;
}

/**
 * A match against a person, through an online room (apps/server). The room runs the referee; this
 * sends picks and turns room messages into the same session events the CPU match uses. Sides are
 * the room's real ones, so both screens look the same: the host (who created the room) is p1 on
 * the left, the guest is p2 on the right. Also reports the lobby steps: joined, refused, left.
 */
export class OnlineSession implements MatchSession {
  selection = initialCharacterSelection();
  get fighters() {
    return this.selection.fighters;
  }

  selectCharacter(character: PlayableCharacterId, confirmed: boolean): void {
    this.send({ type: 'character', character, confirmed });
  }
  readonly opponentName = 'RIVAL';
  rules: RulesConfig = structuredClone(defaultRules);
  private readonly events = new Emitter<SessionEvents>();
  private readonly socket: Socket;
  /** Our seat in the room, from its welcome; null until then. */
  private side: Side | null = null;
  private phase: Phase = 'idle';
  private endsAt: number | null = null;
  private state: MatchState | null = null;
  private myPick: Move | null = null;
  private ended = false;
  endedReason: 'refused' | 'opponentLeft' | 'disconnected' | null = null;
  /** Matches started in this room before the current one (rematches both players count alike). */
  private rematches = 0;

  constructor(private readonly opts: OnlineOptions) {
    this.socket = opts.openSocket(`${opts.serverUrl}/room/${opts.roomCode}`, {
      open: () =>
        this.send({ type: 'hello', protocol: PROTOCOL_VERSION, version: opts.version, intent: opts.intent }),
      message: (data) => this.onMessage(data),
      close: () => this.end('disconnected', {}),
    });
  }

  /** p1 (left) for the host, p2 (right) for the guest. */
  get me(): Side {
    return this.side ?? (this.opts.intent === 'create' ? 'p1' : 'p2');
  }

  get roomCode(): string {
    return this.opts.roomCode;
  }

  ready(): void {
    this.send({ type: 'ready' });
  }

  submitPick(move: Move): void {
    if (this.phase !== 'picking' || this.ended) return;
    this.myPick = move;
    this.send({ type: 'pick', move });
  }

  requestRematch(): void {
    this.send({ type: 'rematch' });
  }

  /** The room keeps time for both players, so a hidden tab can't stop it. */
  setPaused(): void {}

  /** The room code's hash plus the rematch count: the same on both machines, never random. */
  stageSeed(): number {
    let h = 0;
    for (const ch of this.opts.roomCode) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h + this.rematches;
  }

  snapshot(): MatchView {
    return {
      phase: this.phase,
      state: this.state ?? {
        round: 1,
        health: { p1: this.rules.startHealth, p2: this.rules.startHealth },
        roundsWon: { p1: 0, p2: 0 },
        winner: null,
      },
      msLeft: this.endsAt === null ? 0 : Math.max(0, this.endsAt - this.opts.now()),
      myPick: this.myPick,
    };
  }

  on<E extends keyof SessionEvents>(event: E, fn: (payload: SessionEvents[E]) => void): Unsubscribe {
    return this.events.on(event, fn);
  }

  dispose(): void {
    this.ended = true;
    this.events.clear();
    this.socket.close();
  }

  private send(msg: ClientMessage): void {
    if (!this.ended) this.socket.send(JSON.stringify(msg));
  }

  private onMessage(data: string): void {
    let msg: ServerMessage;
    try {
      msg = JSON.parse(data) as ServerMessage;
    } catch {
      return;
    }
    const seated = this.side !== null;
    switch (msg.type) {
      case 'selection':
        this.selection = { fighters: { ...msg.fighters }, confirmed: { ...msg.confirmed } };
        this.events.emit('selection', this.selection);
        break;
      case 'welcome':
        this.side = msg.side;
        this.rules = msg.rules;
        break;
      case 'error':
        this.end('refused', { error: msg.error });
        break;
      case 'opponentJoined':
        this.events.emit('opponentJoined', {});
        break;
      case 'opponentLeft':
        this.end('opponentLeft', {});
        break;
      case 'phase': {
        if (!seated) return;
        this.phase = msg.phase;
        this.endsAt = msg.msLeft === null ? null : this.opts.now() + msg.msLeft;
        this.state = msg.state;
        if (msg.phase === 'picking') this.myPick = null;
        this.events.emit('phase', {
          phase: msg.phase,
          endsAt: this.endsAt,
          round: msg.round,
          finalRound: msg.finalRound,
        });
        break;
      }
      case 'locked':
        if (seated) this.events.emit('locked', { side: msg.side });
        break;
      case 'reveal': {
        if (!seated) return;
        const { picks, autoPicked, outcome, events, state } = msg;
        this.state = state;
        this.events.emit('reveal', { picks, autoPicked, outcome, events, state });
        break;
      }
      case 'matchOver':
        if (!seated) return;
        this.state = msg.state;
        this.events.emit('matchOver', { winner: msg.winner, state: this.state });
        break;
      case 'rematchRequested':
        if (seated) this.events.emit('rematchRequested', { side: msg.side });
        break;
      case 'rematchAccepted':
        this.rematches++;
        this.events.emit('rematchAccepted', {});
        break;
    }
  }

  /** The match can't go on. Reported once; the socket is closed. */
  private end<E extends 'refused' | 'opponentLeft' | 'disconnected'>(
    event: E,
    payload: SessionEvents[E],
  ): void {
    if (this.ended) return;
    this.ended = true;
    this.endedReason = event;
    this.events.emit(event, payload);
    this.socket.close();
  }
}

export type { JoinError };
