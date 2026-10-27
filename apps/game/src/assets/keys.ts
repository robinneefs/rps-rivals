// Every texture key in one typed place, so a typo is a compile error instead of a missing sprite.
// Placeholder art is generated under these keys at boot (assets/placeholders/); real sprite sheets
// loaded under the same keys replace it without touching any view.
export const Tex = {
  logo: 'logo',
  logoSheen: 'logo-sheen',
  /** The menus' backdrop and its drifting stripes (fight stages are in config/stages.ts). */
  menuBackdrop: 'menu-backdrop',
  menuStripes: 'menu-stripes',
  fighterP1: 'fighter-p1',
  fighterP2: 'fighter-p2',
  badges: 'move-badges',
  /** Small move symbols over the fighters' heads while picking (your pick, the rival's "?"). */
  pickChips: 'pick-chips',
  dither: 'dither',
  /** The K.O. banner's letters. */
  koLetters: 'ko-letters',
} as const;

/** Frames every fighter sheet provides (Taiko in 128 x 128 cells, facing right). */
export const FighterFrames = ['idle0', 'idle1', 'rock', 'paper', 'scissors', 'hurt', 'ko', 'win'] as const;
export type FighterFrame = (typeof FighterFrames)[number];
/** The real Taiko atlas also contains a kick; legacy placeholder sheets keep their original frames. */
export type FighterPose = FighterFrame | 'kick';
export type FighterAttack = 'punch' | 'kick';

/** Pixel font sizes: 5x7 glyphs drawn at whole multiples (pixel-perfect rule 5); 5 to 7 are for the big timer. */
export const Fonts = {
  s1: 'pixfont-1',
  s2: 'pixfont-2',
  s3: 'pixfont-3',
  s4: 'pixfont-4',
  s5: 'pixfont-5',
  s6: 'pixfont-6',
  s7: 'pixfont-7',
} as const;
export type FontSize = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export const FONT_SIZES: readonly FontSize[] = [1, 2, 3, 4, 5, 6, 7];
export const fontKey = (size: FontSize): string => Fonts[`s${size}`];
