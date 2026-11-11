import {
  Emitter,
  DEFAULT_FIGHTERS,
  rulesForFighters,
  type Fighters,
  opponentOf,
  Referee,
  type Clock,
  type Move,
  type PhaseTimings,
  type Rng,
  type RulesConfig,
  type Side,
  type Unsubscribe,
} from '@rps/core';
import type { MatchSession, MatchView, SessionEvents } from './MatchSession';
import type { MoveSource } from './MoveSource';
import { PausableClock } from './PausableClock';

/** A match on this device: owns the referee; the opponent's picks come from a move source. */
export class LocalSession implements MatchSession {
  readonly me: Side = 'p1';
  readonly opponentName = 'CPU';
  private readonly events = new Emitter<SessionEvents>();
  private readonly referee: Referee;
  private readonly unsubs: Unsubscribe[] = [];
  private myPick: Move | null = null;
  /** Picks the first stage; its own Math.random so the referee's rng sequence is untouched. */
  private readonly stageBase = Math.floor(Math.random() * 1000);
  private rematches = 0;
  /** The match's own time, so it can stop while nobody is watching. */
  private readonly clock: PausableClock;

  constructor(
    readonly rules: RulesConfig,
    timings: PhaseTimings,
    baseClock: Clock,
    private readonly rng: Rng,
    private readonly opponent: MoveSource,
    readonly fighters: Fighters = { ...DEFAULT_FIGHTERS },
  ) {
    this.rules = rulesForFighters(rules, fighters);
    this.clock = new PausableClock(baseClock);
    const clock = this.clock;
    this.referee = new Referee(this.rules, timings, clock, rng);
    const them = opponentOf(this.me);
    this.unsubs.push(
      this.referee.on('phase', (e) => {
        if (e.phase === 'picking') {
          this.myPick = null;
          this.opponent.onPickingStarted(
            { side: them, state: this.referee.matchState, deadline: e.endsAt ?? 0, clock, rng },
            (move) => this.referee.submitPick(them, move),
          );
        } else {
          this.opponent.cancel();
        }
        this.events.emit('phase', e);
      }),
      this.referee.on('locked', (e) => this.events.emit('locked', e)),
      this.referee.on('reveal', (e) => this.events.emit('reveal', e)),
      this.referee.on('matchOver', (e) => this.events.emit('matchOver', e)),
    );
  }

  ready(): void {
    if (this.referee.currentPhase === 'idle' || this.referee.currentPhase === 'matchOver')
      this.referee.start();
  }

  submitPick(move: Move): void {
    if (this.referee.submitPick(this.me, move)) this.myPick = move;
  }

  /** The whole match waits, timers and the CPU included. */
  setPaused(paused: boolean): void {
    if (paused) this.clock.pause();
    else this.clock.resume();
  }

  /** Locally the CPU always agrees; the next ready() starts the new match. */
  requestRematch(): void {
    this.rematches++;
    this.events.emit('rematchAccepted', {});
  }

  /** A random start, then the next stage on each rematch, so a Retry never repeats the stage. */
  stageSeed(): number {
    return this.stageBase + this.rematches;
  }

  snapshot(): MatchView {
    const endsAt = this.referee.phaseEndsAt;
    return {
      phase: this.referee.currentPhase,
      state: this.referee.matchState,
      msLeft: endsAt === null ? 0 : Math.max(0, endsAt - this.clock.now()),
      myPick: this.myPick,
    };
  }

  on<E extends keyof SessionEvents>(event: E, fn: (payload: SessionEvents[E]) => void): Unsubscribe {
    return this.events.on(event, fn);
  }

  dispose(): void {
    this.opponent.cancel();
    this.unsubs.forEach((u) => u());
    this.referee.dispose();
    this.events.clear();
  }
}
