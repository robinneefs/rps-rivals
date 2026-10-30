import { defaultRules, seededRng, type Move, type PhaseTimings } from '@rps/core';
import { describe, expect, it } from 'vitest';
import { FakeClock } from '../../../packages/core/test/fakeClock';
import { RandomCpu } from '../src/session/cpu/RandomCpu';
import { LocalSession } from '../src/session/LocalSession';
import type { SessionEvents } from '../src/session/MatchSession';
import { stageFor, STAGES } from '../src/config/stages';

const timings: PhaseTimings = { roundIntroMs: 1000, pickMs: 5000, revealMs: 2000, roundOverMs: 3000 };

function setup(seed = 3) {
  const clock = new FakeClock();
  const session = new LocalSession(
    defaultRules,
    timings,
    clock,
    seededRng(seed),
    new RandomCpu({ min: 100, max: 900 }),
  );
  const seen: (keyof SessionEvents)[] = [];
  const reveals: SessionEvents['reveal'][] = [];
  for (const e of ['phase', 'locked', 'reveal', 'matchOver', 'rematchAccepted'] as const) {
    session.on(e, () => seen.push(e));
  }
  session.on('reveal', (r) => reveals.push(r));
  return { clock, session, seen, reveals };
}

describe('LocalSession', () => {
  it('auto-picks Rock for the local Anchor when the player lets the timer expire', () => {
    const clock = new FakeClock();
    const session = new LocalSession(
      defaultRules,
      timings,
      clock,
      seededRng(7),
      {
        onPickingStarted: (_context, submit) => submit('scissors'),
        cancel: () => {},
      },
      { p1: 'anchor', p2: 'riot' },
    );
    const reveals: SessionEvents['reveal'][] = [];
    session.on('reveal', (event) => reveals.push(event));
    session.ready();
    clock.advance(timings.roundIntroMs + timings.pickMs);
    expect(reveals[0]).toMatchObject({
      picks: { p1: 'rock', p2: 'scissors' },
      autoPicked: { p1: true, p2: false },
      outcome: { kind: 'win', winner: 'p1', damage: 50 },
    });
    session.dispose();
  });
  it('cycles through every stage on rematch without consecutive repeats', () => {
    const { session } = setup();
    const stages = [stageFor(session.stageSeed()).id];
    for (let i = 0; i < STAGES.length * 3; i++) {
      session.requestRematch();
      stages.push(stageFor(session.stageSeed()).id);
      expect(stages.at(-1)).not.toBe(stages.at(-2));
    }
    expect(new Set(stages.slice(0, STAGES.length)).size).toBe(STAGES.length);
    session.dispose();
  });
  it('applies selected character damage to both the player and CPU', () => {
    const clock = new FakeClock();
    const session = new LocalSession(
      defaultRules,
      timings,
      clock,
      seededRng(7),
      {
        onPickingStarted: (_context, submit) => submit('rock'),
        cancel: () => {},
      },
      { p1: 'riot', p2: 'anchor' },
    );
    session.ready();
    clock.advance(timings.roundIntroMs);
    session.submitPick('paper');
    clock.advance(timings.pickMs);
    expect(session.snapshot().state.health).toEqual({ p1: 80, p2: 105 });
    clock.advance(timings.revealMs);
    session.submitPick('scissors');
    clock.advance(timings.pickMs);
    expect(session.snapshot().state.health).toEqual({ p1: 30, p2: 105 });
    session.dispose();
  });
  it('starts on ready() and reports the time left in the phase', () => {
    const { clock, session } = setup();
    expect(session.snapshot().phase).toBe('idle');
    session.ready();
    expect(session.snapshot()).toMatchObject({ phase: 'roundIntro', msLeft: 1000 });
    clock.advance(1250);
    expect(session.snapshot()).toMatchObject({ phase: 'picking', msLeft: 4750, myPick: null });
  });

  it('the CPU locks in during picking, and my pick goes to my side', () => {
    const { clock, session, reveals } = setup();
    session.ready();
    clock.advance(1000);
    session.submitPick('paper');
    expect(session.snapshot().myPick).toBe('paper');
    clock.advance(5000);
    expect(reveals).toHaveLength(1);
    expect(reveals[0]!.picks.p1).toBe('paper');
    expect(reveals[0]!.autoPicked).toEqual({ p1: false, p2: false });
  });

  it('paused, the match stands still (the timer, the CPU and the phases) and then carries on', () => {
    const { clock, session, seen } = setup();
    session.ready();
    clock.advance(1500);
    session.setPaused(true);
    const before = seen.length;
    clock.advance(60_000);
    expect(seen.length).toBe(before);
    expect(session.snapshot()).toMatchObject({ phase: 'picking', msLeft: 4500 });
    session.setPaused(false);
    clock.advance(4500);
    expect(session.snapshot().phase).toBe('reveal');
  });

  it('a pick outside the picking phase is ignored', () => {
    const { session } = setup();
    session.ready();
    session.submitPick('rock');
    expect(session.snapshot().myPick).toBeNull();
  });

  it('plays a full match to matchOver, then a rematch starts fresh', () => {
    const { clock, session, seen } = setup();
    session.ready();
    for (let i = 0; i < 5000 && session.snapshot().phase !== 'matchOver'; i++) {
      if (session.snapshot().phase === 'picking') session.submitPick('rock');
      clock.advance(500);
    }
    expect(session.snapshot().phase).toBe('matchOver');
    expect(seen).toContain('matchOver');
    expect(session.snapshot().state.winner).not.toBeNull();

    session.requestRematch();
    expect(seen.at(-1)).toBe('rematchAccepted');
    session.ready();
    expect(session.snapshot()).toMatchObject({
      phase: 'roundIntro',
      state: { round: 1, roundsWon: { p1: 0, p2: 0 } },
    });
  });

  it('dispose stops everything', () => {
    const { clock, session, seen } = setup();
    session.ready();
    session.dispose();
    const count = seen.length;
    clock.advance(60_000);
    expect(seen).toHaveLength(count);
    expect(clock.pendingCount).toBe(0);
  });
});

describe('RandomCpu', () => {
  it('picks each move about a third of the time', () => {
    const clock = new FakeClock();
    const cpu = new RandomCpu({ min: 0, max: 10 });
    const rng = seededRng(42);
    const counts: Record<Move, number> = { rock: 0, scissors: 0, paper: 0 };
    const state = { round: 1, health: { p1: 100, p2: 100 }, roundsWon: { p1: 0, p2: 0 }, winner: null };
    for (let i = 0; i < 3000; i++) {
      cpu.onPickingStarted(
        { side: 'p2', state, deadline: clock.now() + 5000, clock, rng },
        (m) => counts[m]++,
      );
      clock.advance(20);
    }
    for (const n of Object.values(counts)) expect(n).toBeGreaterThan(900);
    expect(counts.rock + counts.scissors + counts.paper).toBe(3000);
  });

  it('decides before the deadline and can be cancelled', () => {
    const clock = new FakeClock();
    const cpu = new RandomCpu({ min: 4000, max: 9000 });
    const state = { round: 1, health: { p1: 100, p2: 100 }, roundsWon: { p1: 0, p2: 0 }, winner: null };
    let picked = 0;
    cpu.onPickingStarted({ side: 'p2', state, deadline: 1000, clock, rng: seededRng(1) }, () => picked++);
    clock.advance(999);
    expect(picked).toBe(1);
    cpu.onPickingStarted({ side: 'p2', state, deadline: 6000, clock, rng: seededRng(1) }, () => picked++);
    cpu.cancel();
    clock.advance(10_000);
    expect(picked).toBe(1);
  });
});
