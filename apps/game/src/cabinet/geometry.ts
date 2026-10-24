import type { Move } from '@rps/core';

/**
 * Where everything sits on the v2.0 cabinet, in cabinet units: pixels of the original cabinet
 * body art (941 wide). The files themselves are saved bigger (see tools/art/build-cabinet.py); the
 * page scales them all by one factor, so these numbers are all a layout needs.
 */
export const BODY = { width: 941, height: 2372, src: 'assets/cabinet/body.webp' } as const;

/** The opening the monitor canvas fills (4:5, the game's 288 x 360). */
export const SCREEN = { x: 162, y: 322, width: 616, height: 767 } as const;

export const MARQUEE = {
  x: 101,
  y: 43,
  width: 739,
  height: 180,
  src: 'assets/cabinet/marquee.webp',
} as const;

/**
 * The part of the cabinet that must always be on screen: marquee to the front lip of the control
 * panel, without the cabinet's outer trim. It is fitted to the window; the art round it (room above,
 * the base below, the sides) fills whatever space is left.
 */
export const ESSENTIAL = { x: 20, y: 14, width: 901, height: 1406 } as const;

/**
 * The buttons (approved layout, 2026-10-24): 148 units wide, centres 160 apart, the bottom of the
 * ring at ringBottomY. Each frame is the ring and cap with a few pixels round them, pressed and up the
 * same size, so a press only swaps the image.
 */
export const BUTTON = {
  x: { rock: 395, paper: 555, scissors: 715 } as Record<Move, number>,
  ringBottomY: 1258,
  /** The art: frame size in file pixels, and how wide the button itself is in it. */
  frame: { width: 354, height: 256, bottomPad: 6, buttonWidth: 344 },
  width: 148,
  labelTopY: 1261,
  /** Label files are cut tight round the text; this many units per file pixel. */
  labelScale: 0.2548,
} as const;

/** The joystick frames: the base is in the same spot in all nine, at `base` (file pixels). */
export const JOYSTICK = {
  x: 225,
  /** The bottom edge of the base, and its width (as approved in the preview, 2026-10-24). */
  baseBottomY: 1271,
  baseWidth: 151,
  /** The art: square frames, the base's centre and bottom edge at `base`, `baseWidth` across. */
  frame: { size: 560, base: { x: 280, y: 430 }, baseWidth: 245 },
} as const;

/** Tap zones: the whole control panel, split between the joystick and the three buttons. */
export const PANEL = {
  top: 1110,
  bottom: 1420,
  joystick: { left: 20, right: 310 },
  buttons: {
    rock: { left: 310, right: 475 },
    paper: { left: 475, right: 635 },
    scissors: { left: 635, right: 921 },
  } as Record<Move, { left: number; right: number }>,
} as const;

/** Where the cabinet is on the page: `scale` CSS pixels per cabinet unit, and its top-left corner. */
export interface CabinetFit {
  scale: number;
  left: number;
  top: number;
}

/**
 * Fits the cabinet into the visible part of the window (CSS pixels, inside the safe area). The
 * essential part fills the width on an upright phone or the height on a desktop, centred; nothing
 * of it is ever cut off.
 */
export function fitCabinet(area: { x: number; y: number; width: number; height: number }): CabinetFit {
  const scale = Math.min(area.width / ESSENTIAL.width, area.height / ESSENTIAL.height);
  return {
    scale,
    left: area.x + (area.width - ESSENTIAL.width * scale) / 2 - ESSENTIAL.x * scale,
    top: area.y + (area.height - ESSENTIAL.height * scale) / 2 - ESSENTIAL.y * scale,
  };
}

/**
 * The joystick direction for a drag of (dx, dy) CSS pixels. Nothing inside the deadzone; past it,
 * within axisSnapDeg of straight up, down, left or right counts as that direction alone, so an
 * up swipe that leans a little never turns into up-left. Only a clearly diagonal drag is diagonal.
 */
export function stickDirection(
  dx: number,
  dy: number,
  deadzone: number,
  axisSnapDeg: number,
): { x: -1 | 0 | 1; y: -1 | 0 | 1 } {
  if (Math.hypot(dx, dy) < deadzone) return { x: 0, y: 0 };
  const sign = (v: number) => (v > 0 ? 1 : -1) as -1 | 1;
  // angle from the nearest horizontal, 0 (flat) to 90 (straight up or down)
  const fromFlat = (Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI;
  if (fromFlat < axisSnapDeg) return { x: sign(dx), y: 0 };
  if (fromFlat > 90 - axisSnapDeg) return { x: 0, y: sign(dy) };
  return { x: sign(dx), y: sign(dy) };
}
