import { describe, expect, it } from 'vitest';
import {
  characterStats,
  createMatchState,
  startNextRound,
  defaultRules,
  PLAYABLE_CHARACTERS,
  MOVES,
  resolveExchange,
  rulesForFighters,
} from '../src';

describe('character damage profiles', () => {
  it('starts and resets each fighter at its own maximum health', () => {
    const rules = rulesForFighters(defaultRules, { p1: 'riot', p2: 'anchor' });
    const first = createMatchState(rules);
    expect(first.health).toEqual({ p1: 80, p2: 120 });
    const next = startNextRound({ ...first, health: { p1: 0, p2: 65 }, roundsWon: { p1: 0, p2: 1 } }, rules);
    expect(next.health).toEqual({ p1: 80, p2: 120 });
    expect(next.round).toBe(2);
    expect(first.health).toEqual({ p1: 80, p2: 120 });
  });
  const expected = {
    taiko: { rock: 25, paper: 25, scissors: 25 },
    riot: { rock: 15, paper: 15, scissors: 35 },
    anchor: { rock: 50, paper: 5, scissors: 5 },
  };
  for (const character of PLAYABLE_CHARACTERS) {
    it(`${character} uses its actual move damage on either side, including mirrors`, () => {
      expect(characterStats(character, defaultRules)).toEqual({
        damage: expected[character],
        hp: { taiko: 100, riot: 80, anchor: 120 }[character],
      });
      for (const rival of PLAYABLE_CHARACTERS) {
        const rules = rulesForFighters(defaultRules, { p1: character, p2: rival });
        for (const move of MOVES) {
          expect(resolveExchange({ p1: move, p2: defaultRules.beats[move] }, rules)).toMatchObject({
            winner: 'p1',
            damage: expected[character][move],
          });
          expect(resolveExchange({ p1: defaultRules.beats[move], p2: move }, rules)).toMatchObject({
            winner: 'p2',
            damage: expected[rival][move],
          });
          expect(resolveExchange({ p1: move, p2: move }, rules).kind).toBe('tie');
        }
      }
    });
  }
  it('honors authoritative custom roster values and snapshots them for a match', () => {
    const rules = {
      ...defaultRules,
      characterDamage: { ...defaultRules.characterDamage!, riot: { ...defaultRules.characterDamage!.riot } },
    };
    rules.characterDamage!.riot.paper = 23;
    const match = rulesForFighters(rules, { p1: 'riot', p2: 'anchor' });
    rules.characterDamage!.riot.paper = 9;
    expect(resolveExchange({ p1: 'paper', p2: 'rock' }, match)).toMatchObject({ damage: 23 });
    expect(characterStats('riot', rules).damage.paper).toBe(9);
  });
  it('retains generic damage for rules without a roster', () => {
    const rules = { ...defaultRules, characterDamage: undefined };
    const match = rulesForFighters(rules, { p1: 'riot', p2: 'anchor' });
    expect(resolveExchange({ p1: 'paper', p2: 'rock' }, match)).toMatchObject({ damage: 10 });
  });
});
