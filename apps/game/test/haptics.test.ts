import { describe, expect, it } from 'vitest';
import { tuning } from '../src/config/tuning';
import { Haptics, type HapticBackend, type HapticLevel } from '../src/platform/haptics';
import { SettingsStore, type KeyValueStore } from '../src/platform/settings';

function recorder() {
  const calls: { pattern: number[]; level: HapticLevel }[] = [];
  const backend: HapticBackend = {
    play: (pattern, level) => void calls.push({ pattern: [...pattern], level }),
  };
  return { calls, backend };
}

function setup(opts: { on?: boolean; visible?: boolean } = {}) {
  const { calls, backend } = recorder();
  let now = 0;
  const haptics = new Haptics(
    backend,
    () => opts.on ?? true,
    tuning.haptics,
    () => now,
    () => opts.visible ?? true,
  );
  return { calls, haptics, advance: (ms: number) => (now += ms) };
}

describe('vibration', () => {
  it('applies the saved preference immediately to previews, shakes and K.O.s', () => {
    const settings = new SettingsStore(null);
    const { calls, backend } = recorder();
    const haptics = new Haptics(backend, () => settings.value.vibration, tuning.haptics);
    settings.set('vibration', false);
    haptics.preview();
    haptics.shake(4);
    haptics.ko();
    expect(calls).toHaveLength(0);
    settings.set('vibration', true);
    haptics.preview();
    expect(calls).toHaveLength(1);
    haptics.ko();
    expect(calls).toHaveLength(2);
    settings.set('vibration', false);
    haptics.preview();
    haptics.ko();
    expect(calls).toHaveLength(2);
  });
  it('buzzes longer and harder for a bigger shake, within the cap', () => {
    const { calls, haptics, advance } = setup();
    for (const px of [1, 2, 3, 4, 50]) {
      haptics.shake(px);
      advance(1000);
    }
    const ms = calls.map((c) => c.pattern[0] ?? 0);
    expect(ms).toEqual([...ms].sort((a, b) => a - b));
    expect(Math.min(...ms)).toBeGreaterThanOrEqual(tuning.haptics.minMs);
    expect(Math.max(...ms)).toBe(tuning.haptics.maxMs);
    expect(calls.map((c) => c.level)).toEqual(['light', 'medium', 'medium', 'heavy', 'heavy']);
  });

  it('the K.O. rumble is heavy and every buzz in it stays within the cap', () => {
    const { calls, haptics } = setup();
    haptics.ko();
    expect(calls[0]?.level).toBe('heavy');
    calls[0]?.pattern.forEach((ms, i) => {
      if (i % 2 === 0) expect(ms).toBeLessThanOrEqual(tuning.haptics.maxMs);
    });
  });

  it('a weaker buzz right after a stronger one is dropped; a stronger one still comes through', () => {
    const { calls, haptics, advance } = setup();
    haptics.shake(3);
    advance(10);
    haptics.shake(1);
    expect(calls).toHaveLength(1);
    haptics.shake(4);
    expect(calls).toHaveLength(2);
    advance(tuning.haptics.quietAfterMs);
    haptics.shake(1);
    expect(calls).toHaveLength(3);
  });

  it('stays still when turned off, in the background, or on a device that cannot vibrate', () => {
    const off = setup({ on: false });
    off.haptics.shake(4);
    off.haptics.ko();
    expect(off.calls).toHaveLength(0);
    const hidden = setup({ visible: false });
    hidden.haptics.shake(4);
    expect(hidden.calls).toHaveLength(0);
    const none = new Haptics(null, () => true, tuning.haptics);
    expect(none.supported).toBe(false);
    expect(() => none.shake(4)).not.toThrow();
  });

  it('is on by default and the setting is remembered', () => {
    const data: Record<string, string> = {};
    const store: KeyValueStore = { getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
    expect(new SettingsStore(store).value.vibration).toBe(true);
    new SettingsStore(store).set('vibration', false);
    expect(new SettingsStore(store).value.vibration).toBe(false);
  });
});
