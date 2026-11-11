import type Phaser from 'phaser';
import { afterEach, expect, it, vi } from 'vitest';
import { addCourtyardStage } from '../src/views/CourtyardStageView';
afterEach(() => vi.unstubAllGlobals());

it('pins strings, bounds sway/petals and settles immediately on reduced motion with cleanup', () => {
  const media = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal('window', { matchMedia: () => media });
  const items: { name: string; x: number; y: number; visible: boolean }[] = [];
  const object = () => {
    const item = {
      name: '',
      x: 0,
      y: 0,
      visible: true,
      setOrigin() {
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
      setName(name: string) {
        this.name = name;
        return this;
      },
      setCrop() {
        return this;
      },
      setBlendMode() {
        return this;
      },
      setX(x: number) {
        this.x = x;
        return this;
      },
      setAlpha() {
        return this;
      },
      setVisible(visible: boolean) {
        this.visible = visible;
        return this;
      },
      setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
        return this;
      },
      setFrame() {
        return this;
      },
    };
    items.push(item);
    return item;
  };
  let tick = () => {},
    shutdown = () => {};
  let state: {
    offsets: number[];
    glows: number[];
    elapsed: number;
    petals: { visible: boolean; x: number; y: number }[];
    smoke: { x: number; y: number }[];
  };
  const remove = vi.fn();
  const scene = {
    add: { image: object, sprite: object, graphics: object },
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
      once: (_: string, fn: () => void) => {
        shutdown = fn;
      },
    },
  };
  addCourtyardStage(scene as unknown as Phaser.Scene);
  const offsets = new Set<number>();
  let sawPetals = false,
    maxPetals = 0;
  for (let i = 0; i < 400; i++) {
    tick();
    expect(state!.smoke).toHaveLength(10);
    expect(
      state!.smoke.every((p) => Number.isInteger(p.x) && Number.isInteger(p.y) && p.y >= 76 && p.y <= 107),
    ).toBe(true);
    state!.offsets.forEach((x) => offsets.add(x));
    for (const petal of state!.petals.filter((p) => p.visible)) {
      sawPetals = true;
      expect(petal.y).toBeGreaterThanOrEqual(86);
      expect(Number.isInteger(petal.x) && Number.isInteger(petal.y)).toBe(true);
    }
    maxPetals = Math.max(maxPetals, state!.petals.filter((p) => p.visible).length);
    for (const id of ['left', 'right', 'far-right'])
      expect(items.filter((item) => item.name === `courtyard-lantern-${id}`)[0]!.x).toBe(0);
    expect(state!.glows.every((a) => a >= 0.16 - 1e-8 && a <= 0.44 + 1e-8)).toBe(true);
  }
  expect([...offsets].sort((a, b) => a - b)).toEqual(Array.from({ length: 15 }, (_, i) => i - 7));
  expect(sawPetals).toBe(true);
  expect(maxPetals).toBe(6);
  media.matches = true;
  media.addEventListener.mock.calls[0]![1]();
  expect(state!.offsets).toEqual([0, 0, 0]);
  expect(state!.glows).toEqual([0.3, 0.3, 0.3]);
  expect(state!.petals.some((p) => p.visible)).toBe(false);
  expect(state!.smoke).toEqual([]);
  shutdown();
  expect(remove).toHaveBeenCalledOnce();
  expect(media.removeEventListener).toHaveBeenCalledOnce();
});
