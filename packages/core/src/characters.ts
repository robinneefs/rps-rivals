import type { Side, Move, RulesConfig } from './rules/types';

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
/** All-rounder, fragile scissors specialist, and high-health rock specialist. */
export const CHARACTER_DAMAGE: Record<CharacterId, Record<Move, number>> = {
  taiko: { rock: 25, paper: 25, scissors: 25 },
  riot: { rock: 15, paper: 15, scissors: 35 },
  anchor: { rock: 50, paper: 5, scissors: 5 },
};
export const CHARACTER_HEALTH: Record<CharacterId, number> = { taiko: 100, riot: 80, anchor: 120 };
export function characterStats(character: CharacterId, rules: RulesConfig) {
  return {
    damage: rules.characterDamage?.[character] ?? rules.damage,
    hp: rules.characterHealth?.[character] ?? rules.startHealth,
  };
}
/** Copy the chosen damage profiles so later selection/tuning cannot alter an active match. */
export function rulesForFighters(rules: RulesConfig, fighters: Fighters): RulesConfig {
  return {
    ...rules,
    healthBySide: { p1: characterStats(fighters.p1, rules).hp, p2: characterStats(fighters.p2, rules).hp },
    damageBySide: {
      p1: { ...characterStats(fighters.p1, rules).damage },
      p2: { ...characterStats(fighters.p2, rules).damage },
    },
  };
}
export const isPlayableCharacter = (value: unknown): value is PlayableCharacterId =>
  value === 'taiko' || value === 'riot' || value === 'anchor';
export const initialCharacterSelection = (): CharacterSelection => ({
  fighters: { ...DEFAULT_FIGHTERS },
  confirmed: { p1: false, p2: false },
});
