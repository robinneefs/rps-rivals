import { Emitter } from '@rps/core';

/** Volumes are steps from 0 (off) to VOLUME_MAX. */
export const VOLUME_MAX = 10;

export interface Settings {
  /** Sound off altogether (music and effects); the volumes are kept for when it's back on. */
  muted: boolean;
  musicVolume: number;
  sfxVolume: number;
  /** The CRT screen look: scanlines, glow and rounded corners on the monitor (WebGL only). */
  crt: boolean;
  /** The phone buzzes along with the screen shake (only on phones that can vibrate). */
  vibration: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  muted: false,
  musicVolume: 6,
  sfxVolume: 8,
  crt: true,
  vibration: true,
};

/** The part of the Web Storage API we use (localStorage now, Capacitor Preferences later). */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>;

const KEY = 'rps-fighter.settings';

/** Player settings, remembered between visits. Storage failing (private mode, blocked) is never fatal. */
export class SettingsStore {
  private readonly events = new Emitter<{ change: Settings }>();
  private current: Settings;

  constructor(private readonly store: KeyValueStore | null) {
    this.current = load(store);
  }

  get value(): Settings {
    return this.current;
  }

  set<K extends keyof Settings>(key: K, value: Settings[K]): void {
    if (this.current[key] === value) return;
    this.current = { ...this.current, [key]: value };
    try {
      this.store?.setItem(KEY, JSON.stringify(this.current));
    } catch {
      // not saved; the setting still applies for this visit
    }
    this.events.emit('change', this.current);
  }

  onChange(fn: (settings: Settings) => void): () => void {
    return this.events.on('change', fn);
  }
}

function load(store: KeyValueStore | null): Settings {
  try {
    const raw = store?.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const saved = JSON.parse(raw) as Partial<Settings>;
    return {
      muted: typeof saved.muted === 'boolean' ? saved.muted : DEFAULT_SETTINGS.muted,
      musicVolume: volume(saved.musicVolume, DEFAULT_SETTINGS.musicVolume),
      sfxVolume: volume(saved.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
      crt: typeof saved.crt === 'boolean' ? saved.crt : DEFAULT_SETTINGS.crt,
      vibration: typeof saved.vibration === 'boolean' ? saved.vibration : DEFAULT_SETTINGS.vibration,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function volume(saved: unknown, fallback: number): number {
  return Number.isInteger(saved) && (saved as number) >= 0 && (saved as number) <= VOLUME_MAX
    ? (saved as number)
    : fallback;
}

/** One volume step up or down, kept in 0..VOLUME_MAX; `wrap` goes from the top back to 0 (menu select). */
export function stepVolume(v: number, dir: 1 | -1, wrap = false): number {
  const next = v + dir;
  if (wrap && next > VOLUME_MAX) return 0;
  return Math.max(0, Math.min(VOLUME_MAX, next));
}

/** localStorage if the browser lets us use it. */
export function browserStore(): KeyValueStore | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
