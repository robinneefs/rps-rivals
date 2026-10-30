import { beforeEach, describe, expect, it } from 'vitest';
import {
  defaultRules as gameRules,
  Referee,
  rulesForFighters,
  seededRng,
  type Fighters,
  type PhaseTimings,
  type RefereeEvents,
} from '../src';
import { FakeClock } from './fakeClock';

const timings: PhaseTimings = { roundIntroMs: 1000, pickMs: 5000, revealMs: 2000, roundOverMs: 3000 };

// These tests count damage from a fixed 100 health, whatever the game's default is.
const defaultRules = { ...gameRules, startHealth: 100 };

function setup(rules = defaultRules, seed = 1) {
  const clock = new FakeClock();
  const referee = new Referee(rules, timings, clock, seededRng(seed));
  const log: { [E in keyof RefereeEvents]: RefereeEvents[E][] } = {
    phase: [],
    locked: [],
    reveal: [],
    matchOver: [],
  };
  referee.on('phase', (e) => log.phase.push(e));
  referee.on('locked', (e) => log.locked.push(e));
  referee.on('reveal', (e) => log.reveal.push(e));
  referee.on('matchOver', (e) => log.matchOver.push(e));
  return { clock, referee, log };
}

describe('Referee', () => {
  it.each(['p1', 'p2'] as const)(
    'always auto-picks Rock for Anchor on %s, keeping other fighters random',
    (side) => {
      const fighters: Fighters = { p1: 'taiko', p2: 'riot' };
      fighters[side] = 'anchor';
      const other = side === 'p1' ? 'p2' : 'p1';
      const otherMoves = new Set<string>();
      for (let seed = 1; seed <= 24; seed++) {
        const s = setup(rulesForFighters(defaultRules, fighters), seed);
        s.referee.start();
        s.clock.advance(timings.roundIntroMs + timings.pickMs);
        const reveal = s.log.reveal[0]!;
        expect(reveal.picks[side]).toBe('rock');
        expect(reveal.autoPicked).toEqual({ p1: true, p2: true });
        otherMoves.add(reveal.picks[other]);
        s.referee.dispose();
      }
      expect(otherMoves).toEqual(new Set(['rock', 'paper', 'scissors']));
    },
  );

  it('keeps manual Anchor picks and auto-picks Rock for the other Anchor in a mirror match', () => {
    const s = setup(rulesForFighters(defaultRules, { p1: 'anchor', p2: 'anchor' }));
    s.referee.start();
    s.clock.advance(timings.roundIntroMs);
    s.referee.submitPick('p1', 'paper');
    s.clock.advance(timings.pickMs);
    expect(s.log.reveal[0]).toMatchObject({
      picks: { p1: 'paper', p2: 'rock' },
      autoPicked: { p1: false, p2: true },
    });
  });
  let t: ReturnType<typeof setup>;
  beforeEach(() => {
    t = setup();
  });

  it('starts idle and does nothing until started', () => {
    expect(t.referee.currentPhase).toBe('idle');
    expect(t.referee.submitPick('p1', 'rock')).toBe(false);
  });

  it('goes round intro, then picking, with end times on its clock', () => {
    t.referee.start();
    expect(t.log.phase.at(-1)).toEqual({ phase: 'roundIntro', endsAt: 1000, round: 1, finalRound: false });
    t.clock.advance(1000);
    expect(t.log.phase.at(-1)).toMatchObject({ phase: 'picking', endsAt: 6000 });
  });

  it('only accepts picks while picking', () => {
    t.referee.start();
    expect(t.referee.submitPick('p1', 'rock')).toBe(false);
    t.clock.advance(1000);
    expect(t.referee.submitPick('p1', 'rock')).toBe(true);
    t.clock.advance(5000);
    expect(t.referee.currentPhase).toBe('reveal');
    expect(t.referee.submitPick('p1', 'paper')).toBe(false);
  });

  it('a pick can change until time is up; the last one counts; locked is sent once', () => {
    t.referee.start();
    t.clock.advance(1000);
    t.referee.submitPick('p1', 'rock');
    t.referee.submitPick('p1', 'paper');
    t.referee.submitPick('p2', 'rock');
    t.clock.advance(4999);
    expect(t.log.reveal).toHaveLength(0);
    t.clock.advance(1);
    expect(t.log.locked).toEqual([{ side: 'p1' }, { side: 'p2' }]);
    expect(t.log.reveal[0]).toMatchObject({
      picks: { p1: 'paper', p2: 'rock' },
      autoPicked: { p1: false, p2: false },
      outcome: { kind: 'win', winner: 'p1', damage: 10 },
      state: { health: { p1: 100, p2: 90 } },
    });
  });

  it('waits for the timer even when both have picked (picks stay changeable)', () => {
    t.referee.start();
    t.clock.advance(1000);
    t.referee.submitPick('p1', 'rock');
    t.referee.submitPick('p2', 'rock');
    t.clock.advance(100);
    expect(t.referee.currentPhase).toBe('picking');
  });

  it('gives a random move to anyone without a pick when time is up', () => {
    t.referee.start();
    t.clock.advance(1000);
    t.referee.submitPick('p2', 'scissors');
    t.clock.advance(5000);
    const reveal = t.log.reveal[0]!;
    expect(reveal.autoPicked).toEqual({ p1: true, p2: false });
    expect(['rock', 'paper', 'scissors']).toContain(reveal.picks.p1);
    expect(reveal.picks.p2).toBe('scissors');
  });

  it('random fallback picks are repeatable with the same seed and cover all moves', () => {
    const picksFor = (seed: number) => {
      const s = setup(defaultRules, seed);
      s.referee.start();
      s.clock.advance(1000);
      const seen: string[] = [];
      for (let i = 0; i < 30 && s.referee.currentPhase !== 'matchOver'; i++) {
        s.clock.advance(5000);
        const r = s.log.reveal.at(-1)!;
        seen.push(r.picks.p1 + r.picks.p2);
        s.clock.advance(timings.revealMs);
        if (s.referee.currentPhase === 'roundOver')
          s.clock.advance(timings.roundOverMs + timings.roundIntroMs);
      }
      return seen;
    };
    expect(picksFor(7)).toEqual(picksFor(7));
    expect(
      new Set(
        picksFor(7)
          .join('')
          .match(/rock|scissors|paper/g),
      ),
    ).toEqual(new Set(['rock', 'paper', 'scissors']));
  });

  it('after the reveal window, picking starts again with fresh picks', () => {
    t.referee.start();
    t.clock.advance(1000);
    t.referee.submitPick('p1', 'rock');
    t.referee.submitPick('p2', 'rock');
    t.clock.advance(5000 + 2000);
    expect(t.referee.currentPhase).toBe('picking');
    expect(t.referee.hasPicked('p1')).toBe(false);
  });

  it('plays a whole best-of-three match through every phase', () => {
    t.referee.start();
    const playExchange = (p1: 'rock' | 'scissors' | 'paper', p2: 'rock' | 'scissors' | 'paper') => {
      t.referee.submitPick('p1', p1);
      t.referee.submitPick('p2', p2);
      t.clock.advance(timings.pickMs);
    };
    // Round 1: p1 throws through blocks (5 x 20).
    t.clock.advance(timings.roundIntroMs);
    for (let i = 0; i < 5; i++) {
      playExchange('scissors', 'paper');
      if (i < 4) t.clock.advance(timings.revealMs);
    }
    t.clock.advance(timings.revealMs);
    expect(t.referee.currentPhase).toBe('roundOver');
    t.clock.advance(timings.roundOverMs);
    expect(t.log.phase.at(-1)).toMatchObject({ phase: 'roundIntro', round: 2, finalRound: false });
    expect(t.referee.matchState.health).toEqual({ p1: 100, p2: 100 });

    // Round 2: p2 counters attacks (10 x 10).
    t.clock.advance(timings.roundIntroMs);
    for (let i = 0; i < 10; i++) {
      playExchange('rock', 'paper');
      t.clock.advance(timings.revealMs);
    }
    t.clock.advance(timings.roundOverMs);
    expect(t.log.phase.at(-1)).toMatchObject({ phase: 'roundIntro', round: 3, finalRound: true });

    // Round 3: p2 attacks through throws (7 x 15).
    t.clock.advance(timings.roundIntroMs);
    for (let i = 0; i < 7; i++) {
      playExchange('scissors', 'rock');
      t.clock.advance(timings.revealMs);
    }
    expect(t.log.matchOver).toHaveLength(0);
    t.clock.advance(timings.roundOverMs);
    expect(t.referee.currentPhase).toBe('matchOver');
    expect(t.log.matchOver).toEqual([
      {
        winner: 'p2',
        state: { round: 3, health: { p1: 0, p2: 100 }, roundsWon: { p1: 1, p2: 2 }, winner: 'p2' },
      },
    ]);
    expect(t.clock.pendingCount).toBe(0);

    const phases = t.log.phase.map((p) => p.phase);
    expect(phases.filter((p) => p === 'roundIntro')).toHaveLength(3);
    expect(phases.filter((p) => p === 'roundOver')).toHaveLength(3);
    expect(phases.at(-1)).toBe('matchOver');
  });

  it('start() again is a rematch: fresh state, old timers cancelled', () => {
    t.referee.start();
    t.clock.advance(1000);
    t.referee.submitPick('p1', 'scissors');
    t.referee.submitPick('p2', 'paper');
    t.clock.advance(5000);
    t.referee.start();
    expect(t.referee.matchState.health).toEqual({ p1: 100, p2: 100 });
    expect(t.referee.currentPhase).toBe('roundIntro');
    expect(t.clock.pendingCount).toBe(1);
  });

  it('dispose stops all timers and events', () => {
    t.referee.start();
    t.referee.dispose();
    const before = t.log.phase.length;
    t.clock.advance(60_000);
    expect(t.log.phase).toHaveLength(before);
    expect(t.clock.pendingCount).toBe(0);
  });
});
