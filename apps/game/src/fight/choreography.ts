import { opponentOf, type ExchangeOutcome, type Rng, type Side } from '@rps/core';
import type { FighterAttack } from '../assets/keys';

export interface Choreography {
  attacker: Side;
  defender: Side;
  attack: FighterAttack;
  reaction: 'hurt' | 'block';
}

/** Cosmetic choices only: the outcome determines who gets hit, never the move's sprite name. */
export function chooseChoreography(outcome: ExchangeOutcome, rng: Rng): Choreography {
  const attacker = outcome.kind === 'win' ? outcome.winner : rng.next() < 0.5 ? 'p1' : 'p2';
  return {
    attacker,
    defender: opponentOf(attacker),
    attack: rng.next() < 0.5 ? 'punch' : 'kick',
    reaction: outcome.kind === 'win' ? 'hurt' : 'block',
  };
}
