import type { PhaseTimings } from '../config';
import type { Phase, RefereeEvents } from '../referee/referee';
import type { MatchState, Move, RulesConfig, Side } from '../rules/types';
import { MOVES } from '../rules/types';
import { isPlayableCharacter, type PlayableCharacterId, type CharacterSelection } from '../characters';

/**
 * The messages between the game and an online match room (apps/server), as plain JSON over a
 * WebSocket. Both sides import this file, so a renamed field is a type error on both ends.
 * Bump PROTOCOL_VERSION whenever a message changes shape: the room refuses clients on another one.
 */
export const PROTOCOL_VERSION = 4;

/**
 * Room codes: four consonants. No vowels, so a random code can't spell a word (rude or otherwise),
 * and no letters that look like digits.
 */
export const ROOM_CODE_LETTERS = 'BCDFGHJKLMNPQRSTVWXZ';
export const ROOM_CODE_LENGTH = 4;

export function isRoomCode(code: string): boolean {
  return code.length === ROOM_CODE_LENGTH && [...code].every((ch) => ROOM_CODE_LETTERS.includes(ch));
}

export function randomRoomCode(next: () => number): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++)
    code += ROOM_CODE_LETTERS[Math.floor(next() * ROOM_CODE_LETTERS.length)] ?? 'A';
  return code;
}

/** Game → room. */
export type ClientMessage =
  /** First message on a new connection. `create` opens an empty room, `join` enters one that is waiting. */
  | { type: 'hello'; protocol: number; version: string; intent: 'create' | 'join' }
  /** The fight screen is listening; the match starts when both players are ready. */
  | { type: 'ready' }
  | { type: 'character'; character: PlayableCharacterId; confirmed: boolean }
  | { type: 'pick'; move: Move }
  /** Play again; the room answers `rematchAccepted` once both players asked. */
  | { type: 'rematch' };

export type JoinError =
  /** The client speaks another protocol version. */
  | 'protocol'
  /** The other player runs a different game build. */
  | 'version'
  /** `join` on a room nobody created. */
  | 'noRoom'
  /** `create` on a room that is already in use (pick another code). */
  | 'taken'
  /** Two players are already in. */
  | 'full'
  /** The message could not be understood. */
  | 'bad';

/** Room → game. Sides are the room's real sides: the host is p1 (left), the guest p2 (right), on both screens. */
export type ServerMessage =
  | ({ type: 'selection' } & CharacterSelection)
  | { type: 'welcome'; side: Side; rules: RulesConfig; timings: PhaseTimings }
  | { type: 'error'; error: JoinError }
  /** The opponent is in the room (sent to both when the second player joins). */
  | { type: 'opponentJoined' }
  /** The opponent left or lost their connection. The match is over. */
  | { type: 'opponentLeft' }
  /**
   * A new phase began. `msLeft` is the time left in it (null when it has no end), not a clock time,
   * so the two machines' clocks never have to agree.
   */
  | {
      type: 'phase';
      phase: Phase;
      msLeft: number | null;
      round: number;
      finalRound: boolean;
      state: MatchState;
    }
  | ({ type: 'locked' } & RefereeEvents['locked'])
  | ({ type: 'reveal' } & RefereeEvents['reveal'])
  | ({ type: 'matchOver' } & RefereeEvents['matchOver'])
  /** One player asked for a rematch (so the other can see it). */
  | { type: 'rematchRequested'; side: Side }
  | { type: 'rematchAccepted' };

/**
 * Checks a message from a client. Anything that isn't exactly a known message comes back as null,
 * so the room never hands the referee a value its types don't allow.
 */
export function parseClientMessage(raw: unknown): ClientMessage | null {
  if (typeof raw !== 'string' || raw.length > 512) return null;
  let msg: unknown;
  try {
    msg = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof msg !== 'object' || msg === null) return null;
  const m = msg as Record<string, unknown>;
  switch (m.type) {
    case 'hello':
      return typeof m.protocol === 'number' &&
        typeof m.version === 'string' &&
        m.version.length <= 32 &&
        (m.intent === 'create' || m.intent === 'join')
        ? { type: 'hello', protocol: m.protocol, version: m.version, intent: m.intent }
        : null;
    case 'ready':
      return { type: 'ready' };
    case 'character':
      return isPlayableCharacter(m.character) && typeof m.confirmed === 'boolean'
        ? { type: 'character', character: m.character, confirmed: m.confirmed }
        : null;
    case 'rematch':
      return { type: 'rematch' };
    case 'pick':
      return MOVES.includes(m.move as Move) ? { type: 'pick', move: m.move as Move } : null;
    default:
      return null;
  }
}
