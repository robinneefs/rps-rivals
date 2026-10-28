import { describe, expect, it } from 'vitest';
import { busGain } from '../src/audio/AudioService';
import { audioFiles, SFX, sfxFileKeys } from '../src/audio/sounds';
import { stageFor } from '../src/config/stages';
import {
  DEFAULT_SETTINGS,
  SettingsStore,
  stepVolume,
  VOLUME_MAX,
  type KeyValueStore,
} from '../src/platform/settings';

// every file under public/assets/audio, as paths relative to public/
const FILES = new Set(
  Object.keys(import.meta.glob('../public/assets/audio/**/*')).map((p) => p.replace('../public/', '')),
);

const memoryStore = (data: Record<string, string> = {}): KeyValueStore => ({
  getItem: (k) => data[k] ?? null,
  setItem: (k, v) => {
    data[k] = v;
  },
});

describe('sound files', () => {
  it('loads a dedicated storm theme and retains the original rooftop theme', () => {
    expect(stageFor(0, 'storm-field').music).toBe('storm');
    expect(stageFor(0, 'rooftop').music ?? 'fight').toBe('fight');
    expect(audioFiles().find((file) => file.key === 'music.storm')?.urls).toEqual([
      'assets/audio/music/stage-under-the-storm.ogg',
      'assets/audio/music/stage-under-the-storm.mp3',
    ]);
  });
  it('every sound the game loads exists (run tools/audio/make-audio.mjs after adding one)', () => {
    for (const { urls } of audioFiles()) for (const url of urls) expect(FILES.has(url), url).toBe(true);
  });

  it('a sound with variations has one file per variation', () => {
    expect(sfxFileKeys('hitRock')).toEqual(['sfx.hitRock_1', 'sfx.hitRock_2', 'sfx.hitRock_3']);
    expect(sfxFileKeys('ko')).toEqual(['sfx.ko']);
    const total = Object.values(SFX).reduce((a, b) => a + b, 0);
    expect(audioFiles().filter((f) => f.key.startsWith('sfx.'))).toHaveLength(total);
  });
});

describe('volumes', () => {
  it('mute silences both buses; volume 0 silences one', () => {
    expect(busGain({ ...DEFAULT_SETTINGS, muted: true }, 'music')).toBe(0);
    expect(busGain({ ...DEFAULT_SETTINGS, muted: true }, 'sfx')).toBe(0);
    expect(busGain({ ...DEFAULT_SETTINGS, musicVolume: 0 }, 'music')).toBe(0);
    expect(busGain({ ...DEFAULT_SETTINGS, musicVolume: 0 }, 'sfx')).toBeGreaterThan(0);
  });

  it('gets louder with each step and stays at or under 1', () => {
    let last = -1;
    for (let v = 0; v <= VOLUME_MAX; v++) {
      const g = busGain({ ...DEFAULT_SETTINGS, sfxVolume: v }, 'sfx');
      expect(g).toBeGreaterThan(last);
      expect(g).toBeLessThanOrEqual(1);
      last = g;
    }
  });

  it('steps stay in range; select wraps from the top to off', () => {
    expect(stepVolume(VOLUME_MAX, 1)).toBe(VOLUME_MAX);
    expect(stepVolume(0, -1)).toBe(0);
    expect(stepVolume(VOLUME_MAX, 1, true)).toBe(0);
    expect(stepVolume(3, 1, true)).toBe(4);
  });

  it('sound settings are remembered, and bad saved values fall back to the defaults', () => {
    const data: Record<string, string> = {};
    const store = new SettingsStore(memoryStore(data));
    store.set('muted', true);
    store.set('musicVolume', 3);
    const again = new SettingsStore(memoryStore(data)).value;
    expect(again.muted).toBe(true);
    expect(again.musicVolume).toBe(3);
    expect(again.sfxVolume).toBe(DEFAULT_SETTINGS.sfxVolume);

    const bad = new SettingsStore(
      memoryStore({ 'rps-fighter.settings': '{"muted":"yes","musicVolume":42,"sfxVolume":2.5}' }),
    ).value;
    expect(bad.muted).toBe(DEFAULT_SETTINGS.muted);
    expect(bad.musicVolume).toBe(DEFAULT_SETTINGS.musicVolume);
    expect(bad.sfxVolume).toBe(DEFAULT_SETTINGS.sfxVolume);
  });
});
