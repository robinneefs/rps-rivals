import { describe, expect, it } from 'vitest';
import { ESSENTIAL, fitCabinet, SCREEN, stickDirection } from '../src/cabinet/geometry';
import { MONITOR } from '../src/config/layout';
import { SettingsStore, type KeyValueStore } from '../src/platform/settings';

describe('fitCabinet', () => {
  const area = (width: number, height: number) => ({ x: 0, y: 0, width, height });

  it('fills the width of an upright phone, with or without the browser bars', () => {
    for (const [w, h] of [
      [390, 660], // iPhone, Safari bars showing
      [390, 844], // iPhone, full height
      [412, 790], // Android Chrome
      [360, 690], // small Android
    ] as const) {
      const f = fitCabinet(area(w, h));
      expect(f.scale).toBeCloseTo(w / ESSENTIAL.width);
      expect(f.left + ESSENTIAL.x * f.scale).toBeCloseTo(0);
      // all of the essential part is on screen
      expect(f.top + ESSENTIAL.y * f.scale).toBeGreaterThanOrEqual(-1e-9);
      expect(f.top + (ESSENTIAL.y + ESSENTIAL.height) * f.scale).toBeLessThanOrEqual(h + 1e-9);
    }
  });

  it('fills the height of a desktop window, centred', () => {
    const f = fitCabinet(area(1920, 969));
    expect(f.scale).toBeCloseTo(969 / ESSENTIAL.height);
    expect(f.top + ESSENTIAL.y * f.scale).toBeCloseTo(0);
    const mid = f.left + (ESSENTIAL.x + ESSENTIAL.width / 2) * f.scale;
    expect(mid).toBeCloseTo(960);
  });

  it('stays inside a safe area that does not start at the corner', () => {
    const f = fitCabinet({ x: 0, y: 47, width: 390, height: 763 });
    expect(f.top + ESSENTIAL.y * f.scale).toBeGreaterThanOrEqual(47);
  });

  it('keeps the screen opening at the monitor shape', () => {
    expect(SCREEN.width / SCREEN.height).toBeCloseTo(MONITOR.width / MONITOR.height, 2);
  });
});

describe('stickDirection', () => {
  it('does nothing inside the deadzone', () => {
    expect(stickDirection(3, -4, 10)).toEqual({ x: 0, y: 0 });
  });

  it('snaps to the 8 directions', () => {
    expect(stickDirection(20, 0, 10)).toEqual({ x: 1, y: 0 });
    expect(stickDirection(0, -20, 10)).toEqual({ x: 0, y: -1 });
    expect(stickDirection(-20, 18, 10)).toEqual({ x: -1, y: 1 });
    expect(stickDirection(-20, 3, 10)).toEqual({ x: -1, y: 0 });
    expect(stickDirection(15, -16, 10)).toEqual({ x: 1, y: -1 });
  });
});

const memoryStore = (
  initial: Record<string, string> = {},
): KeyValueStore & { data: Record<string, string> } => {
  const data = { ...initial };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
};

describe('SettingsStore', () => {
  it('defaults to the CRT screen on', () => {
    expect(new SettingsStore(memoryStore()).value.crt).toBe(true);
    expect(new SettingsStore(null).value.crt).toBe(true);
  });

  it('remembers a choice between visits', () => {
    const store = memoryStore();
    const first = new SettingsStore(store);
    const seen: boolean[] = [];
    first.onChange((s) => seen.push(s.crt));
    first.set('crt', false);
    expect(seen).toEqual([false]);
    expect(new SettingsStore(store).value.crt).toBe(false);
  });

  it('ignores broken or unknown saved values, and the old scaling setting', () => {
    expect(new SettingsStore(memoryStore({ 'rps-fighter.settings': '{nope' })).value.crt).toBe(true);
    const old = new SettingsStore(
      memoryStore({ 'rps-fighter.settings': '{"scaling":"pixelPerfect","crt":"maybe","muted":true}' }),
    ).value;
    expect(old.crt).toBe(true);
    expect(old.muted).toBe(true);
    expect('scaling' in old).toBe(false);
  });

  it('still applies a setting when storage refuses to save', () => {
    const s = new SettingsStore({
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    });
    s.set('crt', false);
    expect(s.value.crt).toBe(false);
  });
});
