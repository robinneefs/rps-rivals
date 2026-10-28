import type Phaser from 'phaser';
import { afterEach, expect, it, vi } from 'vitest';
import { addHarborStage } from '../src/views/HarborStageView';

afterEach(() => vi.unstubAllGlobals());

it('bounds native motion, pins rope ends, honors live reduced motion and cleans up', () => {
  const media = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal('window', { matchMedia: () => media });
  const items: { name: string; y: number; alpha: number }[] = [];
  let tick = () => {},
    shutdown = () => {};
  const remove = vi.fn();
  let state: {
    boatY: number;
    elapsed: number;
    reducedMotion: boolean;
    waterFrame: number;
    birdsVisible: boolean;
  };
  const scene = {
    add: {
      graphics: () => ({
        setName() {
          return this;
        },
        clear() {
          return this;
        },
        fillStyle() {
          return this;
        },
        fillRect() {
          return this;
        },
      }),
      image: () => {
        const item = {
          name: '',
          y: 0,
          alpha: 1,
          setOrigin() {
            return this;
          },
          setName(name: string) {
            this.name = name;
            return this;
          },
          setCrop() {
            return this;
          },
          setFrame() {
            return this;
          },
          setY(y: number) {
            this.y = y;
            return this;
          },
          setAlpha(alpha: number) {
            this.alpha = alpha;
            return this;
          },
        };
        items.push(item);
        return item;
      },
    },
    data: {
      set: (_: string, value: typeof state) => {
        state = value;
      },
    },
    time: {
      addEvent: (event: { callback: () => void }) => {
        tick = event.callback;
        return { remove };
      },
    },
    events: {
      once: (_: string, callback: () => void) => {
        shutdown = callback;
      },
    },
  };
  addHarborStage(scene as unknown as Phaser.Scene);
  const bobs = new Set<number>();
  const waterFrames = new Set<number>();
  let sawBirds = false;
  for (let i = 0; i < 180; i++) {
    tick();
    bobs.add(state!.boatY);
    waterFrames.add(state!.waterFrame);
    sawBirds ||= state!.birdsVisible;
    expect(items.every((item) => Number.isInteger(item.y) && Math.abs(item.y) <= 2)).toBe(true);
    const rope = items.filter((item) => item.name === 'harbor-rope-span');
    expect([rope[0]!.y, rope[6]!.y]).toEqual([0, 0]);
  }
  expect([...bobs].sort()).toEqual([-1, 0, 1]);
  expect(waterFrames.size).toBe(12);
  expect(sawBirds).toBe(true);
  media.matches = true;
  media.addEventListener.mock.calls[0]![1]();
  expect(items.every((item) => item.y === 0 && item.alpha === 1)).toBe(true);
  tick();
  expect(state!.elapsed).toBe(0);
  expect(state!.waterFrame).toBe(0);
  expect(state!.birdsVisible).toBe(false);
  shutdown();
  expect(remove).toHaveBeenCalledOnce();
  expect(media.removeEventListener).toHaveBeenCalledWith('change', media.addEventListener.mock.calls[0]![1]);
});
