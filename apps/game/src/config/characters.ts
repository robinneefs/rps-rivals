import { type CharacterId, isPlayableCharacter } from '@rps/core';
import { Tex } from '../assets/keys';
import { HOME_CHARACTERS } from '../assets/homeArt';

/** All identities use their own approved combat atlas. */
export const CHARACTERS = [
  { id: 'taiko', name: 'TAIKO', faceX: 134, combat: Tex.fighterP1 },
  { id: 'riot', name: 'RIOT', faceX: 137, combat: Tex.fighterP2 },
  { id: 'anchor', name: 'ANCHOR', faceX: 140, combat: Tex.fighterAnchor },
] as const;
export function characterPresentation(id: CharacterId) {
  const character = CHARACTERS.find((c) => c.id === id)!;
  return {
    ...character,
    portrait: HOME_CHARACTERS.find((c) => c.id === id)!.texture,
    available: isPlayableCharacter(id),
  };
}
