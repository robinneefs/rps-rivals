import type Phaser from 'phaser';
import { expect, it } from 'vitest';
import { createDistantBirds } from '../src/views/DistantBirds';

it('flies higher in shared sky space, stays clear of the HUD, and disappears between visits or with reduced motion', () => {
  const rows: number[] = [];
  const graphics = {
    setName() {
      return this;
    },
    clear() {
      rows.length = 0;
      return this;
    },
    fillStyle() {
      return this;
    },
    fillRect(_x: number, y: number) {
      rows.push(y);
      return this;
    },
  };
  const draw = createDistantBirds({ add: { graphics: () => graphics } } as unknown as Phaser.Scene, 'test');
  expect(draw(5900, false)).toBe(false);
  expect(draw(10000, false)).toBe(true);
  expect(rows).toHaveLength(9);
  expect(Math.min(...rows)).toBeGreaterThanOrEqual(63);
  expect(Math.max(...rows)).toBe(70);
  expect(draw(22000, false)).toBe(false);
  expect(rows).toHaveLength(0);
  expect(draw(10000, true)).toBe(false);
  expect(draw(46000, false)).toBe(true);
});
