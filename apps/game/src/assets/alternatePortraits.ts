import type Phaser from 'phaser';
import type { CharacterId } from '@rps/core';
import { characterPresentation } from '../config/characters';
import { cacheAlternateAtlas } from './alternatePalettes';
import {
  type RGB,
  shade,
  IVORY,
  WHITE,
  RED,
  BLACK,
  BLUE,
  BLONDE,
  OLIVE,
  MUSTARD,
  STEEL_BLUE,
} from './paletteRamps';

type Point = readonly [number, number];
function inside(x: number, y: number, polygon: readonly Point[]): boolean {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!,
      b = polygon[j]!;
    if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) hit = !hit;
  }
  return hit;
}

// Material boundaries, rather than brightness cutoffs, include the painted
// midtones and deep fabric shadows without swallowing adjacent fingers or faces.
const TAIKO_BAND: readonly Point[] = [
  [109, 46],
  [123, 48],
  [140, 57],
  [170, 60],
  [166, 77],
  [148, 72],
  [137, 65],
  [111, 57],
];
const TAIKO_FRONT_WRAP: readonly Point[] = [
  [0, 93],
  [16, 102],
  [67, 88],
  [77, 112],
  [46, 120],
  [40, 130],
  [67, 132],
  [56, 145],
  [29, 153],
  [9, 140],
  [0, 122],
];
const TAIKO_BACK_WRAP: readonly Point[] = [
  [169, 94],
  [187, 97],
  [192, 115],
  [192, 163],
  [165, 162],
  [166, 136],
  [177, 127],
];
const RIOT_FRINGE: readonly Point[] = [
  [130, 40],
  [151, 40],
  [157, 66],
  [149, 85],
  [138, 90],
  [138, 64],
];
const RIOT_LEFT_FRINGE: readonly Point[] = [
  [109, 59],
  [130, 58],
  [122, 72],
  [110, 83],
];
const RIOT_RIGHT_FRINGE: readonly Point[] = [
  [153, 64],
  [166, 74],
  [166, 100],
  [155, 104],
  [152, 88],
];
const TAIKO_EAR: readonly Point[] = [
  [110, 58],
  [117, 61],
  [119, 73],
  [115, 86],
  [108, 80],
  [106, 67],
];
const MOUTHS: Record<CharacterId, readonly Point[]> = {
  riot: [
    [117, 96],
    [139, 99],
    [136, 108],
    [126, 110],
    [119, 104],
  ],
  taiko: [
    [128, 89],
    [151, 90],
    [153, 101],
    [133, 103],
  ],
  anchor: [
    [119, 89],
    [145, 91],
    [143, 104],
    [130, 106],
  ],
};
const ANCHOR_FRONT_WRAP: readonly Point[] = [
  [0, 96],
  [13, 84],
  [37, 82],
  [59, 95],
  [80, 116],
  [61, 120],
  [43, 119],
  [39, 129],
  [25, 135],
  [14, 141],
  [3, 141],
];
const ANCHOR_BACK_WRAP: readonly Point[] = [
  [174, 90],
  [187, 96],
  [192, 107],
  [192, 162],
  [174, 161],
  [170, 149],
  [176, 128],
  [178, 119],
];

/** Portrait-specific material masks, repeated in each 192px breathing frame.
 * Never use combat-pose coordinates on the larger, independently painted portraits.
 */
export function swapPortraitPalette(pixels: Uint8ClampedArray, character: CharacterId, width: number): void {
  for (let i = 0; i < pixels.length; i += 4) {
    if (!pixels[i + 3]) continue;
    const r = pixels[i]!,
      g = pixels[i + 1]!,
      b = pixels[i + 2]!;
    const high = Math.max(r, g, b),
      low = Math.min(r, g, b),
      chroma = high - low;
    const saturation = high ? chroma / high : 0;
    let hue = chroma
      ? 60 * (high === r ? (g - b) / chroma : high === g ? (b - r) / chroma + 2 : (r - g) / chroma + 4)
      : 0;
    hue = (hue + 360) % 360;
    const x = ((i / 4) % width) % 192,
      y = Math.floor(i / 4 / width) % 240;
    // Facial features keep their original pixels, including teeth and skin
    // shadows that share colors with fabric or hair. Applied to every frame.
    if (inside(x, y, MOUTHS[character]) || (character === 'taiko' && inside(x, y, TAIKO_EAR))) continue;
    let color: RGB | undefined;
    if (character === 'taiko') {
      const band =
        inside(x, y, TAIKO_BAND) ||
        (x < 110 && y < 52) ||
        (x >= 87 && x < 110 && y >= 48 && y < 60) ||
        (x >= 75 && x < 110 && y >= 58 && y < 73);
      const wraps = inside(x, y, TAIKO_FRONT_WRAP) || inside(x, y, TAIKO_BACK_WRAP);
      if (wraps && high >= 55 && saturation < 0.4) color = shade(high, 55, 255, RED);
      else if (band && saturation > 0.45 && hue >= 8 && hue < 65 && high > 45)
        color = shade(high, 45, 255, RED);
      else if (saturation > 0.55 && high > 40 && (hue >= 340 || hue < 10))
        color = shade(high, 45, 220, IVORY);
      else if (saturation > 0.88 && hue >= 10 && hue < 40 && y < 87) color = shade(high, 65, 255, RED);
      else if (saturation > 0.85 && hue >= 10 && hue < 60 && y >= 110) color = shade(high, 55, 255, BLACK);
      else if (low >= 100 && saturation < 0.22 && y >= 89) color = shade(high, 110, 255, RED);
    } else if (character === 'riot') {
      if (saturation > 0.4 && high > 35 && hue >= 255 && hue <= 305) color = shade(high, 35, 235, BLUE);
      else if (saturation > 0.78 && hue >= 35 && hue <= 65 && (y > 111 || x < 85 || x > 165))
        color = shade(high, 65, 255, WHITE);
      else if (
        y < 110 &&
        (y < 63 ||
          x < 111 ||
          x > 159 ||
          inside(x, y, RIOT_FRINGE) ||
          inside(x, y, RIOT_LEFT_FRINGE) ||
          inside(x, y, RIOT_RIGHT_FRINGE)) &&
        r > 22 &&
        r < 210 &&
        r > g * 1.2 &&
        g >= b * 0.85
      )
        color = shade(r, 35, 195, BLONDE);
    } else {
      const wraps = inside(x, y, ANCHOR_FRONT_WRAP) || inside(x, y, ANCHOR_BACK_WRAP);
      if (wraps && high >= 45 && saturation < 0.4) color = shade(high, 45, 255, BLACK);
      else if (saturation > 0.5 && hue >= 175 && hue <= 220 && high > 35)
        color = shade(high, 35, 170, MUSTARD);
      else if (y >= 127 && high >= 25 && high < 125 && saturation < 0.35)
        color = shade(high, 20, 110, MUSTARD);
      else if (y < 115 && (y < 62 || x < 111 || x > 157) && high > 23 && r < 130 && r >= g && g >= b * 0.85)
        color = shade(high, 23, 120, STEEL_BLUE);
      else if (low > 115 && saturation < 0.25 && y >= 85) color = shade(high, 115, 255, BLACK);
      else if (saturation > 0.85 && hue >= 25 && hue <= 60 && y < 110) color = shade(high, 50, 245, MUSTARD);
      else if (saturation > 0.75 && hue < 25 && y >= 198) color = shade(high, 45, 220, OLIVE);
      else if (saturation > 0.65 && hue >= 25 && hue <= 65 && y >= 190) color = shade(high, 45, 245, BLACK);
    }
    if (color) for (let c = 0; c < 3; c++) pixels[i + c] = color[c]!;
  }
}

export function cacheAlternatePortrait(scene: Phaser.Scene, character: CharacterId): string {
  return cacheAlternateAtlas(scene, characterPresentation(character).portrait, (pixels, width) =>
    swapPortraitPalette(pixels, character, width),
  );
}
