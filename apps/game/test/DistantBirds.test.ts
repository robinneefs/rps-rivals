import type Phaser from 'phaser';
import { expect, it } from 'vitest';
import { createDistantBirds } from '../src/views/DistantBirds';

it('sends overlapping flocks frequently, keeps them below the HUD, and hides them with reduced motion', () => {
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
  expect(draw(1100, false)).toBe(false);
  expect(draw(10000, false)).toBe(true);
  expect(rows).toHaveLength(21);
  expect(Math.min(...rows)).toBeGreaterThanOrEqual(48);
  expect(Math.max(...rows)).toBeLessThan(90);
  expect(draw(22000, false)).toBe(true);
  expect(rows.length).toBeGreaterThanOrEqual(18);
  expect(draw(10000, true)).toBe(false);
  expect(rows).toHaveLength(0);
  expect(draw(46000, false)).toBe(true);
});

it('alternates flock sizes, formations and directions at the same seven-second cadence', () => {
  let dots: [number, number][] = [];
  let flocks: [number, number][][] = [];
  const graphics = {
    setName() {
      return this;
    },
    clear() {
      flocks = [];
      return this;
    },
    fillStyle() {
      dots = [];
      flocks.push(dots);
      return this;
    },
    fillRect(x: number, y: number) {
      dots.push([x, y]);
      return this;
    },
  };
  const draw = createDistantBirds(
    { add: { graphics: () => graphics } } as unknown as Phaser.Scene,
    'harbor-birds',
  );
  const sizes: number[] = [];
  const directions: number[] = [];
  const formations: string[] = [];
  for (let flock = 0; flock < 4; flock++) {
    const time = 1200 + flock * 7000 + 5000;
    draw(time, false);
    const current = flocks.at(-1)!;
    sizes.push(current.length / 3);
    const centers = current.filter((_, index) => index % 3 === 0);
    formations.push(JSON.stringify(centers.map(([x, y]) => [x - centers[0]![0], y - centers[0]![1]])));
    const before = centers[0]![0];
    draw(time + 1000, false);
    directions.push(Math.sign(flocks.at(-1)![0]![0] - before));
    expect(flocks.flat().every(([, y]) => y >= 48 && y < 90)).toBe(true);
  }
  expect(new Set(sizes).size).toBe(4);
  expect(new Set(formations).size).toBe(4);
  expect(directions).toEqual([1, -1, 1, -1]);
});
