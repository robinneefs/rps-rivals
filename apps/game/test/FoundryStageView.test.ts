import type Phaser from 'phaser';
import { afterEach, expect, it, vi } from 'vitest';
import { addFoundryStage } from '../src/views/FoundryStageView';
afterEach(() => vi.unstubAllGlobals());
it('turns slowly through a full revolution, animates fire/glow, freezes and cleans up', () => {
  const media = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal('window', { matchMedia: () => media });
  const names: string[] = [];
  const object = () => ({
    setOrigin() {
      return this;
    },
    setName(n: string) {
      names.push(n);
      return this;
    },
    setFrame() {
      return this;
    },
    setBlendMode() {
      return this;
    },
    setAlpha() {
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
  });
  let tick = () => {},
    shutdown = () => {};
  let state: { gearFrame: number; fireFrame: number; glowAlpha: number; elapsed: number };
  const remove = vi.fn();
  const scene = {
    add: { image: object, graphics: object },
    data: {
      set: (_: string, s: typeof state) => {
        state = s;
      },
    },
    time: {
      addEvent: (event: { callback: () => void }) => {
        tick = event.callback;
        return { remove };
      },
    },
    events: {
      once: (_: string, fn: () => void) => {
        shutdown = fn;
      },
    },
  };
  addFoundryStage(scene as unknown as Phaser.Scene);
  const gears = new Set<number>(),
    fires = new Set<number>();
  let previous = 0;
  for (let i = 0; i < 1250; i++) {
    tick();
    gears.add(state!.gearFrame);
    fires.add(state!.fireFrame);
    expect((state!.gearFrame - previous + 360) % 360).toBeLessThanOrEqual(1);
    previous = state!.gearFrame;
    expect(state!.glowAlpha).toBeGreaterThanOrEqual(0.04 - 1e-8);
    expect(state!.glowAlpha).toBeLessThanOrEqual(0.2 + 1e-8);
  }
  expect(gears.size).toBe(360);
  expect(fires.size).toBe(12);
  expect(names.indexOf('foundry-occluders')).toBeGreaterThan(names.indexOf('foundry-gear'));
  media.matches = true;
  media.addEventListener.mock.calls[0]![1]();
  expect(state!).toMatchObject({ gearFrame: 0, fireFrame: 0, glowAlpha: 0.12, elapsed: 0 });
  shutdown();
  expect(remove).toHaveBeenCalledOnce();
  expect(media.removeEventListener).toHaveBeenCalledOnce();
});
