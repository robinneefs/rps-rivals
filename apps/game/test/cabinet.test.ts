import { describe, expect, it } from 'vitest';
import {
  ESSENTIAL,
  fitCabinet,
  SCREEN,
  PIXEL_SCREEN,
  PIXEL_SCREEN_INSET,
  stickDirection,
} from '../src/cabinet/geometry';
import { MONITOR } from '../src/config/layout';
import { SettingsStore, type KeyValueStore } from '../src/platform/settings';
import { optionsMenu } from '../src/menus/optionsMenu';

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
  it('sizes the cabinet around integer device-pixel monitor blocks, including fractional DPR', () => {
    for (const dpr of [1, 1.25, 1.5, 2, 3])
      for (const [width, height] of [
        [390, 664],
        [600, 1000],
        [1280, 720],
        [320, 568],
      ]) {
        const fit = fitCabinet({ x: 0, y: 0, width: width!, height: height! }, true, dpr);
        const pixels = (PIXEL_SCREEN.width * fit.scale * dpr) / 192;
        expect(pixels).toBeCloseTo(Math.round(pixels), 10);
        expect(Math.round(pixels)).toBeGreaterThanOrEqual(1);
        expect((PIXEL_SCREEN.height * fit.scale * dpr) / 240).toBeCloseTo(pixels, 10);
        for (const edge of [
          fit.left + (SCREEN.x + PIXEL_SCREEN_INSET) * fit.scale,
          fit.top + SCREEN.y * fit.scale,
        ])
          expect(edge * dpr).toBeCloseTo(Math.round(edge * dpr), 10);
        expect(ESSENTIAL.width * fit.scale).toBeLessThanOrEqual(width! + 1 / dpr);
        expect(ESSENTIAL.height * fit.scale).toBeLessThanOrEqual(height! + 1 / dpr);
      }
  });
});

describe('stickDirection', () => {
  const dir = (dx: number, dy: number) => stickDirection(dx, dy, 18, 30);

  it('does nothing inside the deadzone', () => {
    expect(dir(10, -12)).toEqual({ x: 0, y: 0 });
  });

  it('snaps to straight directions and diagonals', () => {
    expect(dir(30, 0)).toEqual({ x: 1, y: 0 });
    expect(dir(0, -30)).toEqual({ x: 0, y: -1 });
    expect(dir(-25, 25)).toEqual({ x: -1, y: 1 });
    expect(dir(22, -20)).toEqual({ x: 1, y: -1 });
  });

  it('a swipe that leans a little stays on its axis', () => {
    // 25 degrees off straight up / straight left: no diagonal
    expect(dir(13, -28)).toEqual({ x: 0, y: -1 });
    expect(dir(-28, 13)).toEqual({ x: -1, y: 0 });
  });
});

const memoryStore = (
  initial: Record<string, string> = {},
): KeyValueStore & { data: Record<string, string> } => {
  const data = { ...initial };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
};

describe('SettingsStore', () => {
  it('keeps Haptics directly below Pixel Perfect, whether enabled or disabled', () => {
    const noop = () => {};
    for (const vibration of [false, true]) {
      const items = optionsMenu(
        { ...new SettingsStore(null).value, vibration },
        {
          toggleCrt: noop,
          togglePixelPerfect: noop,
          toggleVibration: noop,
          toggleSound: noop,
          stepVolume: noop,
          back: noop,
        },
      );
      expect(items.slice(0, 3).map((item) => item.id)).toEqual(['crt', 'pixelPerfect', 'vibration']);
      expect(items[2]).toMatchObject({ label: 'HAPTICS', tag: vibration ? 'ON' : 'OFF', enabled: true });
    }
  });
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

  it('ignores broken or unknown saved values, and accepts the restored pixel-perfect preference', () => {
    expect(new SettingsStore(memoryStore({ 'rps-fighter.settings': '{nope' })).value.crt).toBe(true);
    const old = new SettingsStore(
      memoryStore({ 'rps-fighter.settings': '{"scaling":"pixelPerfect","crt":"maybe","muted":true}' }),
    ).value;
    expect(old.crt).toBe(true);
    expect(old.muted).toBe(true);
    expect('scaling' in old).toBe(false);
    const store = memoryStore();
    const current = new SettingsStore(store);
    current.set('pixelPerfect', true);
    expect(new SettingsStore(store).value.pixelPerfect).toBe(true);
    expect(
      new SettingsStore(memoryStore({ 'rps-fighter.settings': '{"pixelPerfect":"yes"}' })).value.pixelPerfect,
    ).toBe(false);
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
