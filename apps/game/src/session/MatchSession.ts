import type {
  JoinError,
  MatchState,
  Move,
  Phase,
  RefereeEvents,
  RulesConfig,
  Side,
  Unsubscribe,
  Fighters,
  CharacterSelection,
} from '@rps/core';

/** What a match looks like right now, from one player's seat. */
export interface MatchView {
  phase: Phase;
  state: MatchState;
  /** Milliseconds left in the current phase (0 when it has no end). */
  msLeft: number;
  myPick: Move | null;
}

export interface SessionEvents extends Record<string, unknown> {
  selection: CharacterSelection;
  phase: RefereeEvents['phase'];
  locked: RefereeEvents['locked'];
  reveal: RefereeEvents['reveal'];
  matchOver: RefereeEvents['matchOver'];
  /** Both sides agreed to play again (locally: at once). The fight screen can start over. */
  rematchAccepted: Record<string, never>;
  // Online only (a CPU match never sends these):
  /** The opponent asked to play again; `side` is who asked. */
  rematchRequested: { side: Side };
  /** The second player arrived in the room (lobby). */
  opponentJoined: Record<string, never>;
  /** The room refused this player (wrong code, full, other build...). The session is over. */
  refused: { error: JoinError };
  /** The opponent left or dropped. The session is over. */
  opponentLeft: Record<string, never>;
  /** The connection to the room closed (or never opened). The session is over. */
  disconnected: Record<string, never>;
}

/**
 * A match in progress as seen by one player. Scenes talk only to this, never to the referee,
 * so the fight screen doesn't care whether the opponent is a CPU here or a person online.
 */
export interface MatchSession {
  readonly rivalRequestedRematch?: boolean;
  readonly endedReason?: 'refused' | 'opponentLeft' | 'disconnected' | null;
  readonly fighters: Fighters;
  readonly me: Side;
  /** Shown on the HUD and the result screen ("CPU" in a CPU match, "RIVAL" online). */
  readonly opponentName: string;
  /** The rules this match is played with (start health, rounds to win, damage). */
  readonly rules: RulesConfig;
  /** The scene is listening: locally this starts the match; online it tells the server this client is ready. */
  ready(): void;
  submitPick(move: Move): void;
  requestRematch(): void;
  /** The tab was hidden or shown again. A CPU match waits; an online one can't (the rival plays on). */
  setPaused(paused: boolean): void;
  /**
   * A number for picking this match's stage. It changes with every rematch, and online both
   * players get the same one (it comes from the room code), so they see the same stage.
   */
  stageSeed(): number;
  snapshot(): MatchView;
  on<E extends keyof SessionEvents>(event: E, fn: (payload: SessionEvents[E]) => void): Unsubscribe;
  dispose(): void;
}

/** Describes a match, so Retry can replay the same kind of match. */
export type MatchSetup =
  { mode: 'cpu'; cpu: CpuKind; fighters?: Fighters } | { mode: 'online'; roomCode: string };

export type CpuKind = 'random';
