import type Phaser from 'phaser';
import type { CharacterId, Side } from '@rps/core';
import { CHARACTERS, characterPresentation } from '../config/characters';
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

// Hair shares dark blue shades with boots and outlines. These head regions in the
// approved 160px poses prevent a hair recolor from affecting the rest of the outfit.
const ANCHOR_HEAD = [
  [42, 42, 98, 77],
  [42, 42, 98, 77],
  [42, 42, 98, 77],
  [40, 40, 92, 79],
  [43, 48, 99, 87],
  [42, 44, 99, 84],
  [8, 129, 55, 158],
  [38, 40, 100, 77],
  [35, 64, 96, 94],
] as const;

const ANCHOR_TANK = [
  [68, 75, 95, 96],
  [68, 75, 95, 96],
  [68, 75, 95, 96],
  [65, 73, 93, 97],
  [67, 78, 98, 100],
  [64, 75, 96, 100],
  [49, 137, 82, 153],
  [69, 74, 96, 91],
  [61, 88, 89, 110],
] as const;

// White source fabric is shared by wrist wraps and tiny tunic highlights. Limit
// red wrap recoloring to the actual wrists in each approved pose (not the chest).
const TAIKO_WRISTS = [
  [
    [57, 87, 72, 103],
    [97, 86, 113, 105],
  ],
  [
    [57, 87, 72, 103],
    [97, 86, 113, 105],
  ],
  [
    [57, 87, 72, 103],
    [111, 77, 120, 87],
  ],
  [[78, 70, 96, 85]],
  [[101, 81, 116, 97]],
  [
    [44, 93, 57, 107],
    [78, 82, 90, 93],
  ],
  [[81, 140, 94, 155]],
  [
    [54, 50, 67, 70],
    [98, 88, 113, 108],
  ],
  [
    [36, 91, 48, 104],
    [62, 83, 72, 91],
  ],
] as const;

function inRegion(x: number, y: number, region: readonly number[] | undefined): boolean {
  return !!region && x >= region[0]! && x <= region[2]! && y >= region[1]! && y <= region[3]!;
}

export const alternateTexture = (base: string): string => `${base}-alternate`;

/** Match sides are authoritative, including when the local online player is P2. */
export function combatTexture(fighters: Record<Side, CharacterId>, side: Side): string {
  const base = characterPresentation(fighters[side]).combat;
  return side === 'p2' && fighters.p1 === fighters.p2 ? alternateTexture(base) : base;
}

/** Material-specific ramps keep shaded whites readable and protect warm skin colors.
 * Width locates the approved atlas poses for details that share source colors.
 */
export function swapClothingPalette(pixels: Uint8ClampedArray, character: CharacterId, width = 480): void {
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] === 0) continue;
    const r = pixels[i]!,
      g = pixels[i + 1]!,
      b = pixels[i + 2]!;
    const high = Math.max(r, g, b),
      low = Math.min(r, g, b),
      chroma = high - low;
    const saturation = high === 0 ? 0 : chroma / high;
    let hue =
      chroma === 0
        ? 0
        : 60 * (high === r ? (g - b) / chroma : high === g ? (b - r) / chroma + 2 : (r - g) / chroma + 4);
    hue = (hue + 360) % 360;
    const pixel = i / 4,
      x = (pixel % width) % 160,
      y = Math.floor(pixel / width) % 160;
    const pose = Math.floor(Math.floor(pixel / width) / 160) * 3 + Math.floor((pixel % width) / 160);
    let color: RGB | undefined;
    if (character === 'taiko') {
      // Warm interpolation specks inside the tunic are fabric, not headband/skin.
      if (
        [0, 1, 2, 7].includes(pose) &&
        x >= 75 &&
        x <= 84 &&
        y >= 82 &&
        y <= 92 &&
        saturation > 0.7 &&
        high > 90 &&
        (hue < 45 || hue >= 330)
      )
        color = shade(high, 65, 235, IVORY);
      else if (saturation > 0.65 && high > 55 && (hue >= 330 || hue <= 7))
        color = shade(high, 65, 235, IVORY);
      else if (saturation > 0.82 && r > g * 2.5 && hue > 12 && hue < 28)
        color = shade(high, 90, 255, RED); // orange headband
      else if (saturation > 0.6 && hue >= 28 && hue < 58)
        color = shade(high, 70, 255, BLACK); // gold belt and tunic trim
      else if (
        high > 145 &&
        saturation < 0.35 &&
        TAIKO_WRISTS[pose]?.some((region) => inRegion(x, y, region))
      )
        color = shade(high, 165, 255, RED); // wrist wraps; ankle wraps stay ivory
    } else if (character === 'riot') {
      if (saturation > 0.45 && high > 40 && hue >= 255 && hue <= 305) color = shade(high, 45, 235, BLUE);
      else if (saturation > 0.5 && hue >= 35 && hue <= 65) color = shade(high, 90, 255, WHITE);
      else if (r >= 25 && r < 155 && r > g * 1.4 && g > b * 0.95) color = shade(r, 35, 110, BLONDE);
    } else {
      if (high > 40 && saturation >= 0.82 && hue <= 17) color = shade(high, 65, 250, OLIVE);
      else if (saturation > 0.5 && hue >= 185 && hue <= 215 && high > 45)
        color = shade(high, 45, 145, MUSTARD); // blue vest
      else if (saturation > 0.5 && hue >= 35 && hue <= 60)
        color = shade(high, 90, 255, MUSTARD); // hair tie
      else if (low > 160 && chroma < 65)
        color = shade(high, 165, 255, BLACK); // wrist wraps
      else if (high >= 30 && high < 100 && saturation < 0.5 && inRegion(x, y, ANCHOR_TANK[pose]))
        color = shade(high, 28, 75, MUSTARD);
      else if (high > 20 && high < 95 && b > r * 1.15 && b >= g && saturation > 0.15) {
        const head = ANCHOR_HEAD[pose];
        if (inRegion(x, y, head)) color = shade(high, 18, 47, STEEL_BLUE);
      }
      // The gold buckle becomes charcoal; the small hair tie keeps its mustard.
      if (
        color &&
        saturation > 0.5 &&
        hue >= 35 &&
        hue <= 60 &&
        (pose === 6 ? x > 60 : y > (pose === 7 ? 87 : 93))
      )
        color = shade(high, 90, 255, BLACK);
    }
    if (color) for (let c = 0; c < 3; c++) pixels[i + c] = color[c]!;
  }
}

/** Installed reviewed atlases are reused; generate only when a placeholder lacks an alternate. */
export function generateAlternatePalettes(scene: Phaser.Scene): void {
  for (const character of CHARACTERS)
    cacheAlternateAtlas(scene, character.combat, (pixels, width) =>
      swapClothingPalette(pixels, character.id, width),
    );
}

/** Copy frame metadata along with pixels so recolored atlases stay interchangeable. */
export function cacheAlternateAtlas(
  scene: Phaser.Scene,
  base: string,
  recolor: (pixels: Uint8ClampedArray, width: number) => void,
): string {
  const key = alternateTexture(base);
  if (scene.textures.exists(key)) return key;
  const source = scene.textures.get(base);
  const image = source.getSourceImage() as HTMLImageElement;
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.drawImage(image, 0, 0);
  const data = context.getImageData(0, 0, canvas.width, canvas.height);
  recolor(data.data, canvas.width);
  context.putImageData(data, 0, 0);
  const target = scene.textures.addCanvas(key, canvas)!;
  for (const name of source.getFrameNames()) {
    const frame = source.get(name);
    const copy = target.add(name, 0, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight)!;
    if (frame.trimmed)
      copy.setTrim(frame.realWidth, frame.realHeight, frame.x, frame.y, frame.width, frame.height);
    copy.rotated = frame.rotated;
    if (copy.rotated) copy.updateUVsInverted();
  }
  return key;
}
