import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { addStage } from '../src/views/StageView';
import { MONITOR } from '../src/config/layout';

describe('stage panorama', () => {
  it('pauses and reverses at both edges, never wrapping or leaving the panorama', () => {
    let tick = () => {};
    let shutdown = () => {};
    const offsets: number[] = [];
    const remove = vi.fn();
    const clouds = {
      texture: { getSourceImage: () => ({ width: MONITOR.width }) },
      setOrigin() {
        return this;
      },
      setTilePosition(x: number) {
        offsets.push(x);
      },
    };
    const scene = {
      textures: { get: () => ({ getSourceImage: () => ({ width: MONITOR.width + 4 }) }) },
      add: { tileSprite: () => clouds, image: () => ({ setOrigin() {} }) },
      time: {
        addEvent: (event: { callback: () => void }) => {
          tick = event.callback;
          return { remove };
        },
      },
      events: {
        once: (_event: string, callback: () => void) => {
          shutdown = callback;
        },
      },
    };
    addStage(scene as unknown as Phaser.Scene, {
      id: 'test',
      name: 'Test',
      clouds: { image: '', y: 0, height: 64, stepMs: 200, pauseMs: 600 },
    });
    for (let n = 0; n < 4; n++) tick();
    expect(offsets).toEqual([1, 2, 3, 4]);
    tick();
    tick();
    expect(offsets).toEqual([1, 2, 3, 4]);
    for (let n = 0; n < 4; n++) tick();
    expect(offsets).toEqual([1, 2, 3, 4, 3, 2, 1, 0]);
    tick();
    tick();
    expect(offsets.at(-1)).toBe(0);
    tick();
    expect(offsets.at(-1)).toBe(1);
    for (let n = 0; n < 100; n++) tick();
    expect(offsets.every((x) => x >= 0 && x <= 4 && Number.isInteger(x))).toBe(true);
    expect(offsets.every((x, i) => i === 0 || Math.abs(x - offsets[i - 1]!) === 1)).toBe(true);
    shutdown();
    expect(remove).toHaveBeenCalledOnce();
  });
});
