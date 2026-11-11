import { describe, expect, it } from 'vitest';
import { textInkOrigin } from '../src/util/textInkOrigin';

function glyph(width: number, height: number, ink: [number, number, number, number] | null) {
  const data = new Uint8ClampedArray(width * height * 4);
  if (ink) {
    const [left, top, right, bottom] = ink;
    for (let y = top; y <= bottom; y++)
      for (let x = left; x <= right; x++) data[(y * width + x) * 4 + 3] = 255;
  }
  return {
    width,
    height,
    getContext: () => ({ getImageData: () => ({ data }) }),
  } as unknown as HTMLCanvasElement;
}

describe('countdown ink centring', () => {
  it('ignores extra mobile-font ascender space and asymmetric side bearings', () => {
    expect(textInkOrigin(glyph(40, 60, [8, 20, 27, 51]), 2)).toEqual({ x: 9, y: 18 });
    expect(textInkOrigin(glyph(40, 60, [2, 8, 21, 39]), 2)).toEqual({ x: 6, y: 12 });
  });
  it('handles narrow digits and odd ink widths without rounding away half pixels', () => {
    expect(textInkOrigin(glyph(32, 40, [11, 5, 15, 24]), 1)).toEqual({ x: 13.5, y: 15 });
  });
  it('centres an empty canvas safely', () => {
    expect(textInkOrigin(glyph(20, 30, null), 2)).toEqual({ x: 5, y: 7.5 });
  });
});
