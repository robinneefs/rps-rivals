import { moveColors, palette } from '../../config/palette';
import { PixelBuffer, shade, type RGB } from './PixelBuffer';

export const ICON = { frames: ['rock', 'paper', 'scissors', 'unknown'] as const };
export type IconName = (typeof ICON.frames)[number];

/**
 * Flat white move symbols, 22x17, drawn on the cabinet buttons and the reveal badges (the "white
 * icons" style the user picked from docs/rebrand/mockups-round3/4-buttons.png).
 * '#' white, 'o' outline, 't' tint and 's' detail lines, both in tones of the button's colour.
 */
export const SYMBOLS: Record<IconName, string[]> = {
  rock: [
    '........oooooo........',
    '.....oooo####oooo.....',
    '....oo##########oo....',
    '...oo############oo...',
    '...o##############oo..',
    '..oo###############oo.',
    '..o#########ttttttt#o.',
    '.oo########tttttttt#o.',
    '.o#########ttttttttto.',
    '.o##########ttttttttoo',
    'oo###t######tttttttt#o',
    'o##ttttttt##ttttttttto',
    'o#ttttttttttttttttttoo',
    'ootttttttttttttttttoo.',
    '.ootttttttttttttttoo..',
    '..ootttttttttttttoo...',
    '...ooooooooooooooo....',
  ],
  paper: [
    '..oooooooooooooo......',
    '..o############oo.....',
    '..o#############oo....',
    '..o##############oo...',
    '..o###sssssssss###oo..',
    '..o################o..',
    '..o################o..',
    '..o###ssssssssssss#o..',
    '..o################o..',
    '..o################o..',
    '..o###ssssssssssss#o..',
    '..o################o..',
    '..o################o..',
    '..o###ssssssss#####o..',
    '..o################o..',
    '..o################o..',
    '..oooooooooooooooooo..',
  ],
  scissors: [
    '.ooooooo...........ooo',
    '.ottttto.........ooo#o',
    'oot#tttoo.......oo###o',
    'ottoootto.....ooo###oo',
    'ottoottto...ooo###ooo.',
    'ottootttoo.oo####oo...',
    'ootttttttooo###ooo....',
    '.otttttttt####oo......',
    '.oooooottt###ooo......',
    '.otttttttooo###ooo....',
    'oot#ttttoo.oo####oo...',
    'ottoottto...ooo###ooo.',
    'ottoootto.....ooo###oo',
    'ottoootto.......oo###o',
    'ootttttoo........ooo#o',
    '.ottttto...........ooo',
    '.ooooooo..............',
  ],
  unknown: [
    '.......oooooooo.......',
    '......oo######oo......',
    '.....oo###oo###oo.....',
    '.....o###o..o###o.....',
    '.....ooooo..o###o.....',
    '...........oo###o.....',
    '..........oo###oo.....',
    '.........oo###oo......',
    '.........o###oo.......',
    '.........o###o........',
    '.........ooooo........',
    '.........ooooo........',
    '.........o###o........',
    '.........o###o........',
    '.........o###o........',
    '.........ooooo........',
    '......................',
  ],
};
export const SYMBOL_SIZE = { width: 22, height: 17 };

/** The tones a symbol is drawn in; `white` swaps for a dimmed colour on a dimmed button. */
export interface SymbolTones {
  white: RGB;
  outline: RGB;
  tint: RGB;
  detail: RGB;
}

/** Tones for a move's symbol: outline and lines in its dark shade, the tinted parts in a light tone. */
export function symbolTones(name: IconName, dim = false): SymbolTones {
  const c = name === 'unknown' ? { main: palette.dim, shade: palette.panelEdge } : moveColors[name];
  const outline = shade(c.shade, 0.55);
  if (dim)
    return {
      white: shade(c.main, 0.5),
      outline: shade(c.shade, 0.3),
      tint: shade(c.main, 0.42),
      detail: shade(c.shade, 0.3),
    };
  return { white: palette.white, outline, tint: lighten(c.main, 0.55), detail: c.shade };
}

/** Draws a symbol with its top-left at (x, y). */
export function drawSymbol(b: PixelBuffer, name: IconName, x: number, y: number, tones: SymbolTones): void {
  const map: Record<string, RGB> = { '#': tones.white, o: tones.outline, t: tones.tint, s: tones.detail };
  SYMBOLS[name].forEach((row, ry) =>
    [...row].forEach((ch, rx) => {
      const c = map[ch];
      if (c !== undefined) b.px(x + rx, y + ry, c);
    }),
  );
}

/** Mixes a colour towards white by `f` (0 = unchanged, 1 = white). */
export function lighten(c: RGB, f: number): RGB {
  const ch = (v: number) => Math.round(v + (255 - v) * f);
  return (ch((c >> 16) & 255) << 16) | (ch((c >> 8) & 255) << 8) | ch(c & 255);
}

/** Reveal badges: a move's symbol on a disk with a starburst behind it, plus an all-white flash frame. */
export const BADGE = {
  size: 40,
  moves: ['rock', 'paper', 'scissors'] as const,
  states: ['normal', 'flash'] as const,
};

/** One row per move, one column per state (normal, flash). */
export function paintBadges(): PixelBuffer {
  const s = BADGE.size;
  const b = new PixelBuffer(s * BADGE.states.length, s * BADGE.moves.length);
  const c0 = s / 2;
  BADGE.moves.forEach((name, row) => {
    const colors = moveColors[name];
    const y0 = row * s;
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++) {
        const dx = x + 0.5 - c0;
        const dy = y + 0.5 - c0;
        const d = Math.hypot(dx, dy);
        const a = Math.atan2(dy, dx);
        // eight-point burst: rays peak at 18 px, valleys sit just outside the disk
        const ray = 14 + 4 * Math.abs(Math.cos(4 * a + Math.PI / 8)) ** 3;
        let c: number | null = null;
        if (d <= 12) {
          // bevel: light on the upper left rim, dark on the lower right
          const rim = d > 10;
          const lit = dx + dy < -4;
          c = rim
            ? lit
              ? lighten(colors.main, 0.45)
              : dx + dy > 4
                ? colors.shade
                : colors.main
            : colors.main;
        } else if (d <= 13) c = palette.ink;
        else if (d <= ray) c = d > ray - 1.5 ? colors.shade : palette.gold;
        if (c !== null) b.px(x, y0 + y, c);
      }
    drawSymbol(b, name, c0 - 11, y0 + c0 - 9, symbolTones(name));
    b.outline(palette.ink, 0, y0, s, s);
    // the flash frame is the same silhouette in white
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++) if (b.isSet(x, y0 + y)) b.px(s + x, y0 + y, palette.white);
  });
  return b;
}

/**
 * Pick chips: a move's symbol on its own with an ink outline, shown over a fighter's head while
 * picking. `unknown` is the rival's locked-in "?"; `waiting` is the same "?" dimmed (no pick yet).
 */
export const PICK_CHIP = {
  width: SYMBOL_SIZE.width + 2,
  height: SYMBOL_SIZE.height + 2,
  frames: ['rock', 'paper', 'scissors', 'unknown', 'waiting'] as const,
};
export type PickChip = (typeof PICK_CHIP.frames)[number];

/** One column per chip frame. */
export function paintPickChips(): PixelBuffer {
  const { width: w, height: h } = PICK_CHIP;
  const b = new PixelBuffer(w * PICK_CHIP.frames.length, h);
  PICK_CHIP.frames.forEach((frame, i) => {
    const name: IconName = frame === 'waiting' ? 'unknown' : frame;
    drawSymbol(b, name, i * w + 1, 1, symbolTones(name, frame === 'waiting'));
    b.outline(palette.ink, i * w, 0, w, h);
  });
  return b;
}
