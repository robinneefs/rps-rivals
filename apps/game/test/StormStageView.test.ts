import type Phaser from 'phaser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STAGES } from '../src/config/stages';
import { addStormStage } from '../src/views/StormStageView';

afterEach(() => vi.unstubAllGlobals());

function fixture(reduced = false) {
  const media = { matches: reduced };
  vi.stubGlobal('window', { matchMedia: () => media });
  const data = new Map<string, unknown>();
  const objects: { name: string; frame: number; alpha: number }[] = [];
  const object = () => {
    const item = {
      name: '',
      frame: 0,
      alpha: 1,
      setOrigin() {
        return this;
      },
      setFlipY() {
        return this;
      },
      setTintFill() {
        return this;
      },
      setName(name: string) {
        this.name = name;
        return this;
      },
      setFrame(frame: number) {
        this.frame = frame;
        return this;
      },
      setAlpha(alpha: number) {
        this.alpha = alpha;
        return this;
      },
      setTilePosition() {
        return this;
      },
      clear() {
        return this;
      },
      lineStyle() {
        return this;
      },
      lineBetween() {
        return this;
      },
      fillStyle() {
        return this;
      },
      fillRect() {
        return this;
      },
    };
    objects.push(item);
    return item;
  };
  let tick = () => {};
  let shutdown = () => {};
  const remove = vi.fn();
  const scene = {
    add: { rectangle: object, tileSprite: object, graphics: object, image: object },
    data: { set: (key: string, value: unknown) => data.set(key, value) },
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
  const addForeground = addStormStage(scene as unknown as Phaser.Scene, STAGES[1]!, 12);
  objects.push({ name: 'fighter', frame: 0, alpha: 1 });
  addForeground();
  return {
    objects,
    media,
    tick: () => tick(),
    shutdown: () => shutdown(),
    remove,
    state: () =>
      data.get('stageEffects') as { frame: number; strikes: number; lightning: boolean; cloudOffset: number },
  };
}

describe('storm stage lifecycle', () => {
  it('places grass above fighters, animates, strikes occasionally and cleans its clock on shutdown', () => {
    const f = fixture();
    expect(f.objects.findIndex((o) => o.name === 'storm-foreground')).toBeGreaterThan(
      f.objects.findIndex((o) => o.name === 'fighter'),
    );
    const frames = new Set<number>();
    const strikeTimes: number[] = [];
    let lastStrikeCount = 0;
    let sawLightning = false;
    for (let i = 0; i < 400; i++) {
      f.tick();
      frames.add(f.state().frame);
      sawLightning ||= f.state().lightning;
      if (f.state().strikes > lastStrikeCount) {
        strikeTimes.push((i + 2) * 60);
        lastStrikeCount = f.state().strikes;
      }
      expect(f.state().cloudOffset).toBeGreaterThanOrEqual(48);
      expect(f.state().cloudOffset).toBeLessThanOrEqual(144);
    }
    expect(frames.size).toBe(12);
    expect(sawLightning).toBe(true);
    expect(f.state().strikes).toBeGreaterThanOrEqual(3);
    expect(f.state().strikes).toBeLessThanOrEqual(5);
    expect(strikeTimes[0]).toBeGreaterThanOrEqual(2400);
    expect(strikeTimes[0]).toBeLessThanOrEqual(3660);
    for (let i = 1; i < strikeTimes.length; i++) {
      const interval = strikeTimes[i]! - strikeTimes[i - 1]!;
      expect(interval).toBeGreaterThanOrEqual(4500);
      expect(interval).toBeLessThanOrEqual(8040);
    }
    f.shutdown();
    expect(f.remove).toHaveBeenCalledOnce();
  });

  it('suppresses animated weather and lightning for reduced motion, including live preference changes', () => {
    const f = fixture(true);
    for (let i = 0; i < 300; i++) f.tick();
    expect(f.state()).toMatchObject({ frame: 0, cloudOffset: 96, strikes: 0, lightning: false });
    f.media.matches = false;
    for (let i = 0; i < 300; i++) f.tick();
    expect(f.state().strikes).toBeGreaterThan(0);
    f.media.matches = true;
    f.tick();
    expect(f.state()).toMatchObject({ frame: 0, lightning: false });
  });

  it('starts centered and drifts slowly right and left within the middle half of the panorama', () => {
    const f = fixture();
    expect(f.state().cloudOffset).toBe(96);
    const offsets = [f.state().cloudOffset];
    for (let i = 0; i < 8000; i++) {
      f.tick();
      offsets.push(f.state().cloudOffset);
    }
    expect(Math.min(...offsets)).toBe(48);
    expect(Math.max(...offsets)).toBe(144);
    expect(offsets.every((x, i) => i === 0 || Math.abs(x - offsets[i - 1]!) <= 1)).toBe(true);
    expect(offsets[100]).toBeGreaterThanOrEqual(92); // At most four pixels in six seconds.
    expect(offsets.at(-1)).toBe(96);
  });
});
