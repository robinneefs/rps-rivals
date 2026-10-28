import type { Side } from './rules/types';

/** Combat identities shared by selection, sessions and the server. */
export type CharacterId = 'taiko' | 'riot' | 'anchor';
export const PLAYABLE_CHARACTERS = ['taiko', 'riot', 'anchor'] as const;
export type PlayableCharacterId = (typeof PLAYABLE_CHARACTERS)[number];
export type Fighters = Record<Side, PlayableCharacterId>;
export interface CharacterSelection {
  fighters: Fighters;
  confirmed: Record<Side, boolean>;
}
export const DEFAULT_FIGHTERS: Fighters = { p1: 'taiko', p2: 'riot' };
export const isPlayableCharacter = (value: unknown): value is PlayableCharacterId =>
  value === 'taiko' || value === 'riot' || value === 'anchor';
export const initialCharacterSelection = (): CharacterSelection => ({
  fighters: { ...DEFAULT_FIGHTERS },
  confirmed: { p1: false, p2: false },
});
