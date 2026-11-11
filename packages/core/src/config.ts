import type { RulesConfig } from './rules/types';
import { CHARACTER_DAMAGE, CHARACTER_HEALTH } from './characters';

/**
 * Rules: changing these changes who wins. The server (step 5) uses the same values.
 * Look-and-feel numbers live in apps/game/src/config/tuning.ts instead.
 */
export const defaultRules: RulesConfig = {
  beats: { rock: 'scissors', scissors: 'paper', paper: 'rock' },
  damage: { rock: 15, paper: 10, scissors: 20 },
  characterDamage: CHARACTER_DAMAGE,
  characterHealth: CHARACTER_HEALTH,
  startHealth: 50,
  roundsToWin: 2,
};

/**
 * How long each match phase lasts. These are rules too: online, the server runs the same clock.
 * The client plays its animations inside these windows.
 */
export interface PhaseTimings {
  /** "Round 1 / Fight!" banner before the first countdown of a round. */
  roundIntroMs: number;
  /** Countdown in which both players pick. */
  pickMs: number;
  /** Icons drop, fighters act out the exchange, the loser's bar drains. */
  revealMs: number;
  /** KO and the winner's pose before the next round (or the result screen). */
  roundOverMs: number;
}

export const defaultTimings: PhaseTimings = {
  roundIntroMs: 2800,
  pickMs: 3000,
  revealMs: 1800,
  roundOverMs: 2200,
};
