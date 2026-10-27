import { defaultRules, MOVES, resolveExchange, seededRng, type Rng } from '@rps/core';
import { describe, expect, it } from 'vitest';
import { chooseChoreography } from '../src/fight/choreography';

const draws = (...values: number[]): Rng => ({ next: () => values.shift()! });

describe('cosmetic fight choreography', () => {
  it('lets every winning move punch or kick, with the actual loser taking the hit', () => {
    for (const p1 of MOVES)
      for (const p2 of MOVES) {
        const outcome = resolveExchange({ p1, p2 }, defaultRules);
        if (outcome.kind !== 'win') continue;
        const before = structuredClone(outcome);
        for (const [draw, attack] of [
          [0, 'punch'],
          [0.99, 'kick'],
        ] as const) {
          expect(chooseChoreography(outcome, draws(draw))).toEqual({
            attacker: outcome.winner,
            defender: outcome.loser,
            attack,
            reaction: 'hurt',
          });
          expect(outcome).toEqual(before); // Cosmetic choice must never change RPS damage or result.
        }
      }
  });

  it('allows either player and either attack on every clash, always blocked', () => {
    for (const move of MOVES)
      for (const sideDraw of [0, 0.99])
        for (const attackDraw of [0, 0.99]) {
          const action = chooseChoreography(
            resolveExchange({ p1: move, p2: move }, defaultRules),
            draws(sideDraw, attackDraw),
          );
          expect(action).toEqual({
            attacker: sideDraw < 0.5 ? 'p1' : 'p2',
            defender: sideDraw < 0.5 ? 'p2' : 'p1',
            attack: attackDraw < 0.5 ? 'punch' : 'kick',
            reaction: 'block',
          });
        }
  });

  it('keeps both online players in sync without depending on unrelated effect randomness', () => {
    const host = seededRng(123),
      guest = seededRng(123);
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const outcome = resolveExchange({ p1: MOVES[i % 3]!, p2: MOVES[(i + (i % 2)) % 3]! }, defaultRules);
      const action = chooseChoreography(outcome, host);
      Math.random(); // Sound/particle draws use a different source.
      expect(chooseChoreography(outcome, guest)).toEqual(action);
      seen.add(`${action.attacker}/${action.attack}/${action.reaction}`);
    }
    expect(seen.has('p1/punch/block')).toBe(true);
    expect(seen.has('p2/kick/block')).toBe(true);
  });
});
