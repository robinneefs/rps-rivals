// One shared palette for all placeholder art and UI (pixel-perfect rule 6).
// Real art should come from the same colours; tools can check exported images against it.
export const palette = {
  ink: 0x1a0f2e,
  black: 0x07040f,
  white: 0xffffff,
  text: 0xf6f0ff,
  dim: 0x6e6096,
  lilac: 0xc9b8ff,
  pink: 0xff2fbf,
  cyan: 0x3ff0ff,
  gold: 0xffb321,
  red: 0xff3b6b,
  shadow: 0x5a0b4a,
  panel: 0x140a2a,
  panelEdge: 0x4a2f86,
  select: 0x3a1458,
  hpGreen: 0x5cff7a,
  hpYellow: 0xffd94a,
  hpRed: 0xff3b6b,
  hpBack: 0x2a1648,
  hpTrail: 0xffffff,
  room: 0x0b0716,
  roomLine: 0x150d2a,
} as const;

/** Colour per move: cabinet buttons, move icons and labels. */
export const moveColors = {
  rock: { main: 0xff3b6b, shade: 0xb01846 },
  paper: { main: 0xffb321, shade: 0xc46c14 },
  scissors: { main: 0x3ff0ff, shade: 0x1496be },
} as const;

/**
 * Fighter colours. p1: a strong brawler in a red shirt over a white undershirt and blue jeans.
 * p2: a martial artist in a teal wrap top with white trim, gold sash, navy pants and white boots.
 */
export const fighterColors = {
  p1: {
    kind: 'brawler',
    skin: 0xf0b088,
    skinShade: 0xb8724e,
    hair: 0x3a2418,
    hairLight: 0x6a4430,
    top: 0xe0303a,
    topShade: 0x96182a,
    under: 0xf6f2ff,
    underShade: 0xc4bcd8,
    legs: 0x3d6fc4,
    legsShade: 0x26468a,
    legsLight: 0x7aa4e4,
    belt: 0x5a3a24,
    buckle: 0xffb321,
    shoes: 0x4a2c1c,
    shoesShade: 0x2a180e,
  },
  p2: {
    kind: 'striker',
    skin: 0xf2c098,
    skinShade: 0xc0805c,
    hair: 0x2b1838,
    hairLight: 0x5e3c80,
    top: 0x22b4c4,
    topShade: 0x136f86,
    under: 0xf6f2ff,
    underShade: 0xc4bcd8,
    legs: 0x2c2a5c,
    legsShade: 0x1a1838,
    legsLight: 0x4a4890,
    belt: 0xffb321,
    buckle: 0xc46c14,
    shoes: 0xf6f2ff,
    shoesShade: 0xa99bd6,
  },
} as const;

/**
 * Each side's UI colour, taken from its fighter's top (lightened so text reads on the dark screen):
 * name tags, health bar frames, round pips, the over-the-head tags and the verdict all use it, so a
 * bar and its fighter read as one thing.
 */
export const sideColors = { p1: 0xff5a52, p2: 0x2fd6e6 } as const;

export const css = (color: number): string => '#' + color.toString(16).padStart(6, '0');
