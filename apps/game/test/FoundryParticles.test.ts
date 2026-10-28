import type Phaser from 'phaser';
import { expect, it } from 'vitest';
import { createFoundryParticles } from '../src/views/FoundryParticles';

it('keeps stronger smoke/embers bounded below the HUD and absent with reduced motion', () => {
  const marks: { width: number; height: number; alpha: number }[] = [];
  let alpha = 0;
  const graphics = () => ({
    setName() {
      return this;
    },
    clear() {
      return this;
    },
    setBlendMode() {
      return this;
    },
    fillStyle(_color: number, value: number) {
      alpha = value;
      return this;
    },
    fillRect(_x: number, _y: number, width: number, height: number) {
      marks.push({ width, height, alpha });
      return this;
    },
  });
  const draw = createFoundryParticles({ add: { graphics } } as unknown as Phaser.Scene);
  expect(draw(0, false)).toEqual({ smoke: [], sparks: [] });
  let smokeSeen = false,
    sparksSeen = false;
  for (let time = 0; time < 60000; time += 75) {
    const state = draw(time, false);
    smokeSeen ||= state.smoke.length > 0;
    sparksSeen ||= state.sparks.length > 0;
    expect(state.smoke.length).toBeLessThanOrEqual(8);
    expect(state.sparks.length).toBeLessThanOrEqual(10);
    for (const p of [...state.smoke, ...state.sparks]) {
      expect(p.y).toBeGreaterThanOrEqual(58);
      expect(p.x).toBeGreaterThanOrEqual(100);
      expect(p.x).toBeLessThanOrEqual(154);
      expect(Number.isInteger(p.x) && Number.isInteger(p.y)).toBe(true);
    }
  }
  expect(smokeSeen && sparksSeen).toBe(true);
  expect(marks.every((m) => m.width <= 24 && m.height <= 2 && m.alpha <= 0.65)).toBe(true);
  expect(marks.some((m) => m.width >= 14 && m.alpha >= 0.3)).toBe(true);
  expect(draw(3000, true)).toEqual({ smoke: [], sparks: [] });
});
