import { describe, expect, it } from 'vitest';
import { swapPortraitPalette } from '../src/assets/alternatePortraits';
import type { CharacterId } from '@rps/core';

function sample(character: CharacterId, rgb: number[], x: number, y: number, frame = 0) {
  const offset = (y * 576 + frame * 192 + x) * 4;
  const pixels = new Uint8ClampedArray(offset + 4);
  pixels.set([...rgb, 190], offset);
  swapPortraitPalette(pixels, character, 576);
  expect(pixels[offset + 3]).toBe(190);
  return [...pixels.slice(offset, offset + 3)];
}

describe('alternate victory portrait material masks', () => {
  for (const frame of [0, 1, 2]) {
    it(`frame ${frame}: preserves mouths and Taiko's ear while completing hair and headband edges`, () => {
      for (const [id, x, y] of [
        ['riot', 128, 103],
        ['taiko', 140, 96],
        ['anchor', 134, 97],
      ] as const)
        for (const rgb of [
          [245, 240, 230],
          [125, 115, 105],
          [185, 90, 40],
        ])
          expect(sample(id, rgb, x, y, frame)).toEqual(rgb);
      const ear = [220, 100, 20];
      expect(sample('taiko', ear, 112, 68, frame)).toEqual(ear);
      const band = sample('taiko', [240, 180, 90], 92, 54, frame);
      expect(band[0]).toBeGreaterThan(band[1]! * 3);
      for (const [x, y] of [
        [118, 69],
        [158, 88],
      ]) {
        const hair = sample('riot', [110, 60, 38], x!, y!, frame);
        expect(hair[0]).toBeGreaterThan(160);
      }
    });
    it(`frame ${frame}: includes fringe and fabric midtones without recoloring fingertips`, () => {
      const fringe = sample('riot', [116, 60, 35], 143, 75, frame);
      expect(fringe[0]).toBeGreaterThan(160);
      const headband = sample('taiko', [180, 100, 40], 157, 66, frame);
      expect(headband[0]).toBeGreaterThan(headband[1]! * 3);
      const wrap = sample('taiko', [135, 119, 105], 20, 115, frame);
      expect(wrap[0]).toBeGreaterThan(wrap[1]! * 3);
      const glove = sample('anchor', [100, 94, 90], 25, 130, frame);
      expect(Math.max(...glove)).toBeLessThan(45);
      expect(sample('taiko', [240, 160, 80], 45, 56, frame)).toEqual([240, 160, 80]);
    });
    it(`frame ${frame}: matches the combat outfit colors`, () => {
      const ivory = sample('taiko', [200, 15, 32], 140, 140, frame);
      expect(ivory[0]).toBeGreaterThan(200);
      expect(ivory[0]).toBeLessThan(240);
      expect(sample('taiko', [255, 140, 0], 60, 30, frame)[0]).toBeGreaterThan(180);
      expect(Math.max(...sample('taiko', [255, 140, 0], 75, 175, frame))).toBeLessThan(70);
      const blue = sample('riot', [140, 20, 240], 90, 130, frame);
      expect(blue[2]).toBeGreaterThan(blue[0]! * 2);
      expect(Math.min(...sample('riot', [255, 210, 30], 125, 145, frame))).toBeGreaterThan(220);
      expect(sample('riot', [150, 80, 35], 130, 35, frame)[0]).toBeGreaterThan(180);
      const hair = sample('anchor', [65, 44, 31], 90, 45, frame);
      expect(hair[2]).toBeGreaterThan(hair[0]!);
      const top = sample('anchor', [0, 115, 145], 90, 125, frame);
      expect(top[0]).toBeGreaterThan(top[2]! * 2);
      expect(Math.max(...sample('anchor', [240, 230, 220], 40, 115, frame))).toBeLessThan(70);
    });
    it(`frame ${frame}: protects skin and eyes beside recolored materials`, () => {
      expect(sample('riot', [255, 210, 30], 130, 90, frame)).toEqual([255, 210, 30]);
      expect(sample('anchor', [190, 110, 50], 100, 100, frame)).toEqual([190, 110, 50]);
      expect(sample('anchor', [230, 115, 45], 100, 183, frame)).toEqual([230, 115, 45]);
      expect(sample('taiko', [255, 255, 255], 138, 80, frame)).toEqual([255, 255, 255]);
    });
  }
  it('leaves transparent RGB and alpha unchanged', () => {
    for (const id of ['taiko', 'riot', 'anchor'] as const) {
      const pixels = new Uint8ClampedArray([200, 0, 10, 0]);
      swapPortraitPalette(pixels, id, 576);
      expect([...pixels]).toEqual([200, 0, 10, 0]);
    }
  });
});
