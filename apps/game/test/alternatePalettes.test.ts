import { describe, expect, it } from 'vitest';
import { combatTexture, swapClothingPalette } from '../src/assets/alternatePalettes';
import { CHARACTERS } from '../src/config/characters';

describe('mirror match palettes', () => {
  for (const character of CHARACTERS) {
    it(`${character.id}: only P2 receives the alternate in a mirror match`, () => {
      const fighters = { p1: character.id, p2: character.id };
      expect(combatTexture(fighters, 'p1')).toBe(character.combat);
      expect(combatTexture(fighters, 'p2')).toBe(`${character.combat}-alternate`);
      const other = CHARACTERS.find((c) => c.id !== character.id)!;
      expect(combatTexture({ p1: other.id, p2: character.id }, 'p2')).toBe(character.combat);
    });
  }

  function recolor(id: 'taiko' | 'riot' | 'anchor', rgb: readonly number[], x = 0, y = 0) {
    const offset = (y * 480 + x) * 4;
    const pixels = new Uint8ClampedArray(offset + 4);
    pixels.set([...rgb, 255], offset);
    swapClothingPalette(pixels, id);
    return [...pixels.slice(offset, offset + 3)];
  }

  it('preserves skin shadows, outlines and transparent pixels', () => {
    for (const character of CHARACTERS) {
      for (const rgb of [
        [255, 174, 110],
        [244, 100, 52],
        [180, 65, 39],
        [1, 7, 23],
      ])
        expect(recolor(character.id, rgb, 80, 80)).toEqual(rgb);
      const transparent = new Uint8ClampedArray([209, 26, 38, 0]);
      swapClothingPalette(transparent, character.id);
      expect([...transparent]).toEqual([209, 26, 38, 0]);
    }
  });

  it('gives Taiko shaded ivory clothing, red headband and wraps, and a charcoal belt', () => {
    const light = recolor('taiko', [209, 26, 38]);
    const shadow = recolor('taiko', [136, 10, 23]);
    expect(light[0]).toBeGreaterThan(200);
    expect(light[0]).toBeLessThan(240);
    expect(light[0]! - light[2]!).toBeLessThan(25);
    expect(shadow[0]).toBeLessThan(light[0]!);
    for (const rgb of [
      [255, 70, 0],
      [253, 248, 240],
    ]) {
      const red = recolor('taiko', rgb, 80, 90);
      expect(red[0]).toBeGreaterThan(red[1]! * 3);
    }
    expect(Math.max(...recolor('taiko', [255, 185, 0]))).toBeLessThan(70);
    expect(recolor('taiko', [253, 248, 240], 50, 145)).toEqual([253, 248, 240]);
  });

  it('gives Riot blue purple areas, white yellow areas and golden blonde hair', () => {
    const blue = recolor('riot', [135, 35, 220]);
    expect(blue[2]).toBeGreaterThan(blue[0]! * 2);
    const white = recolor('riot', [253, 199, 43]);
    expect(Math.min(...white)).toBeGreaterThan(220);
    const blonde = recolor('riot', [98, 48, 33]);
    expect(blonde[0]).toBeGreaterThan(210);
    expect(blonde[1]).toBeGreaterThan(170);
    expect(recolor('riot', [54, 45, 48])).toEqual([54, 45, 48]);
  });

  it('gives Anchor olive trousers, a mustard top, dark wraps and steel-blue hair', () => {
    const olive = recolor('anchor', [247, 64, 24]);
    expect(olive[1]).toBeGreaterThan(olive[0]!);
    expect(olive[0]).toBeGreaterThan(olive[2]!);
    for (const [rgb, x, y] of [
      [[0, 105, 140], 75, 80],
      [[45, 47, 54], 80, 85],
    ] as const) {
      const mustard = recolor('anchor', rgb, x, y);
      expect(mustard[0]).toBeGreaterThan(mustard[2]! * 2);
      expect(mustard[1]).toBeGreaterThan(mustard[2]! * 2);
    }
    expect(Math.max(...recolor('anchor', [253, 248, 240], 60, 90))).toBeLessThan(70);
    const hair = recolor('anchor', [24, 29, 42], 65, 60);
    expect(hair[2]).toBeGreaterThan(140);
    expect(recolor('anchor', [24, 29, 42], 50, 145)).toEqual([24, 29, 42]);
    // The victory pose's tank top must not be mistaken for hair.
    const tank = recolor('anchor', [45, 47, 54], 240, 405);
    expect(tank[0]).toBeGreaterThan(tank[2]! * 2);
  });
});
