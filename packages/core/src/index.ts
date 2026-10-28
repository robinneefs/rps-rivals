// The public API of @rps/core. Nothing else is imported from outside the package.
export {
  PLAYABLE_CHARACTERS,
  DEFAULT_FIGHTERS,
  isPlayableCharacter,
  initialCharacterSelection,
  type CharacterId,
  type PlayableCharacterId,
  type Fighters,
  type CharacterSelection,
} from './characters';
export type { ExchangeOutcome, MatchState, Move, Picks, RuleEvent, RulesConfig, Side } from './rules/types';
export { MOVES, SIDES } from './rules/types';
export { opponentOf } from './rules/sides';
export {
  applyExchange,
  createMatchState,
  isFinalRound,
  isRoundOver,
  resolveExchange,
  startNextRound,
} from './rules/exchange';
export { defaultRules, defaultTimings, type PhaseTimings } from './config';
export { Referee, type Phase, type RefereeEvents } from './referee/referee';
export { mathRandomRng, seededRng, type Cancel, type Clock, type Rng } from './referee/clock';
export { Emitter, type Unsubscribe } from './referee/emitter';
export {
  isRoomCode,
  parseClientMessage,
  PROTOCOL_VERSION,
  randomRoomCode,
  ROOM_CODE_LENGTH,
  ROOM_CODE_LETTERS,
  type ClientMessage,
  type JoinError,
  type ServerMessage,
} from './online/protocol';
