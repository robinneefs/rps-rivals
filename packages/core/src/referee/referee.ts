import type { PhaseTimings } from '../config';
import { applyExchange, createMatchState, isFinalRound, startNextRound } from '../rules/exchange';
import type { ExchangeOutcome, MatchState, Move, Picks, RuleEvent, RulesConfig, Side } from '../rules/types';
import { MOVES, SIDES } from '../rules/types';
import type { Cancel, Clock, Rng } from './clock';
import { Emitter, type Unsubscribe } from './emitter';

export type Phase = 'idle' | 'roundIntro' | 'picking' | 'reveal' | 'roundOver' | 'matchOver';

export interface RefereeEvents extends Record<string, unknown> {
  /** A new phase began. `endsAt` is on the referee's clock (null for phases with no end). */
  phase: { phase: Phase; endsAt: number | null; round: number; finalRound: boolean };
  /** A side has a pick in (sent once per side per exchange, not again when the pick changes). */
  locked: { side: Side };
  /** Both picks, revealed together, with what they did. */
  reveal: {
    picks: Picks;
    autoPicked: Record<Side, boolean>;
    outcome: ExchangeOutcome;
    events: RuleEvent[];
    state: MatchState;
  };
  matchOver: { winner: Side; state: MatchState };
}

/**
 * Runs one match: moves through the phases, collects picks, fills in a random pick for anyone who
 * has none when time is up, and calls the rules. Clock and randomness are passed in, so the same
 * class runs in the browser now, in the server room later, and in tests with a fake clock.
 */
export class Referee {
  private readonly events = new Emitter<RefereeEvents>();
  private state: MatchState;
  private phase: Phase = 'idle';
  private endsAt: number | null = null;
  private picks: Partial<Picks> = {};
  private pending: Cancel | null = null;

  constructor(
    private readonly cfg: RulesConfig,
    private readonly timings: PhaseTimings,
    private readonly clock: Clock,
    private readonly rng: Rng,
  ) {
    this.state = createMatchState(cfg);
  }

  on<E extends keyof RefereeEvents>(event: E, fn: (payload: RefereeEvents[E]) => void): Unsubscribe {
    return this.events.on(event, fn);
  }

  /** Starts a fresh match (also used for a rematch). */
  start(): void {
    this.cancelPending();
    this.state = createMatchState(this.cfg);
    this.enter('roundIntro', this.timings.roundIntroMs, () => this.enterPicking());
  }

  /** Allowed, and changeable, only while picking. Returns false when the pick was not accepted. */
  submitPick(side: Side, move: Move): boolean {
    if (this.phase !== 'picking') return false;
    const first = this.picks[side] === undefined;
    this.picks[side] = move;
    if (first) this.events.emit('locked', { side });
    return true;
  }

  get currentPhase(): Phase {
    return this.phase;
  }

  get phaseEndsAt(): number | null {
    return this.endsAt;
  }

  get matchState(): MatchState {
    return this.state;
  }

  hasPicked(side: Side): boolean {
    return this.picks[side] !== undefined;
  }

  /** Stops all timers; no more events after this. */
  dispose(): void {
    this.cancelPending();
    this.events.clear();
    this.phase = 'idle';
  }

  private enterPicking(): void {
    this.picks = {};
    this.enter('picking', this.timings.pickMs, () => this.reveal());
  }

  private reveal(): void {
    const autoPicked = { p1: false, p2: false };
    for (const side of SIDES) {
      if (this.picks[side] === undefined) {
        this.picks[side] = this.cfg.autoPickBySide?.[side] ?? this.randomMove();
        autoPicked[side] = true;
      }
    }
    const picks: Picks = { p1: this.picks.p1!, p2: this.picks.p2! };
    const result = applyExchange(this.state, picks, this.cfg);
    this.state = result.state;

    const roundOver = result.events.some((e) => e.type === 'ko');
    this.enter('reveal', this.timings.revealMs, () => {
      if (roundOver) this.enterRoundOver();
      else this.enterPicking();
    });
    this.events.emit('reveal', { picks, autoPicked, ...result });
  }

  private enterRoundOver(): void {
    this.enter('roundOver', this.timings.roundOverMs, () => {
      if (this.state.winner) {
        this.enter('matchOver', null, null);
        this.events.emit('matchOver', { winner: this.state.winner, state: this.state });
      } else {
        this.state = startNextRound(this.state, this.cfg);
        this.enter('roundIntro', this.timings.roundIntroMs, () => this.enterPicking());
      }
    });
  }

  private enter(phase: Phase, durationMs: number | null, next: (() => void) | null): void {
    this.cancelPending();
    this.phase = phase;
    this.endsAt = durationMs === null ? null : this.clock.now() + durationMs;
    if (durationMs !== null && next) this.pending = this.clock.schedule(durationMs, next);
    this.events.emit('phase', {
      phase,
      endsAt: this.endsAt,
      round: this.state.round,
      finalRound: phase === 'roundIntro' && isFinalRound(this.state, this.cfg),
    });
  }

  private randomMove(): Move {
    return MOVES[Math.floor(this.rng.next() * MOVES.length)] ?? 'rock';
  }

  private cancelPending(): void {
    this.pending?.();
    this.pending = null;
  }
}
