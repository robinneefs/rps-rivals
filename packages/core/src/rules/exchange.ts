import { opponentOf } from './sides';
import type { ExchangeOutcome, MatchState, Picks, RuleEvent, RulesConfig, Side } from './types';

/** Who wins one exchange and for how much. Pure: no state, no time, no randomness. */
export function resolveExchange(picks: Picks, cfg: RulesConfig): ExchangeOutcome {
  if (picks.p1 === picks.p2) return { kind: 'tie', picks };
  const winner = cfg.beats[picks.p1] === picks.p2 ? 'p1' : 'p2';
  const damage = cfg.damageBySide?.[winner] ?? cfg.damage;
  return { kind: 'win', picks, winner, loser: opponentOf(winner), damage: damage[picks[winner]] };
}

/**
 * Plays one exchange on a match state. Never changes `state` in place: returns the new state, the
 * outcome, and a list of what happened (damage, KO, round won, match won) for the presentation.
 * A KO ends the round; the next round's fresh health is set by `startNextRound`.
 */
export function applyExchange(
  state: MatchState,
  picks: Picks,
  cfg: RulesConfig,
): { state: MatchState; outcome: ExchangeOutcome; events: RuleEvent[] } {
  if (state.winner) throw new Error('The match is already over');
  if (isRoundOver(state)) throw new Error('The round is over; start the next round first');

  const outcome = resolveExchange(picks, cfg);
  if (outcome.kind === 'tie') return { state, outcome, events: [] };

  const { winner, loser, damage } = outcome;
  const events: RuleEvent[] = [];
  const health = { ...state.health, [loser]: Math.max(0, state.health[loser] - damage) };
  events.push({ type: 'damage', side: loser, amount: damage, health: health[loser] });

  let roundsWon = state.roundsWon;
  let matchWinner: Side | null = state.winner;
  if (health[loser] === 0) {
    roundsWon = { ...roundsWon, [winner]: roundsWon[winner] + 1 };
    events.push({ type: 'ko', side: loser });
    events.push({ type: 'roundWon', side: winner, round: state.round, roundsWon: roundsWon[winner] });
    if (roundsWon[winner] >= cfg.roundsToWin) {
      matchWinner = winner;
      events.push({ type: 'matchWon', side: winner });
    }
  }

  return { state: { ...state, health, roundsWon, winner: matchWinner }, outcome, events };
}

export function createMatchState(cfg: RulesConfig): MatchState {
  return {
    round: 1,
    health: { ...(cfg.healthBySide ?? { p1: cfg.startHealth, p2: cfg.startHealth }) },
    roundsWon: { p1: 0, p2: 0 },
    winner: null,
  };
}

/** A round is over when either fighter is at 0 health. */
export function isRoundOver(state: MatchState): boolean {
  return state.health.p1 === 0 || state.health.p2 === 0;
}

/** After a KO (and the match not yet won): next round number, health back to full. */
export function startNextRound(state: MatchState, cfg: RulesConfig): MatchState {
  if (state.winner) throw new Error('The match is already over');
  if (!isRoundOver(state)) throw new Error('The round is not over yet');
  return {
    ...state,
    round: state.round + 1,
    health: { ...(cfg.healthBySide ?? { p1: cfg.startHealth, p2: cfg.startHealth }) },
  };
}

/** True when the round about to start is the last one possible (both sides one win away). */
export function isFinalRound(state: MatchState, cfg: RulesConfig): boolean {
  return state.roundsWon.p1 === cfg.roundsToWin - 1 && state.roundsWon.p2 === cfg.roundsToWin - 1;
}
