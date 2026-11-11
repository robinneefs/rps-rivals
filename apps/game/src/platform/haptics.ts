import { isNativeApp, nativeImpact } from './native';

/** How hard a buzz feels where the phone can tell (Android app); the web only has on/off and length. */
export type HapticLevel = 'light' | 'medium' | 'heavy';

/**
 * Something that can buzz the phone. `pattern` is buzz / pause / buzz ... in ms, like the
 * Vibration API; `level` is how strong the first buzz is (later ones are light).
 */
export interface HapticBackend {
  play(pattern: readonly number[], level: HapticLevel): void;
}

export interface HapticTuning {
  /** Buzz length per pixel of screen shake. */
  msPerPx: number;
  /** No buzz is shorter (shorter ones aren't felt on many phones) or longer than this. */
  minMs: number;
  maxMs: number;
  /** Shake of this many px or less is a light buzz, up to mediumUpToPx medium, above that heavy. */
  lightUpToPx: number;
  mediumUpToPx: number;
  /** A buzz this soon after a stronger one is dropped, so shakes started together don't stack. */
  quietAfterMs: number;
  /** The K.O. rumble: buzz, pause, buzz in ms (each buzz kept within maxMs). */
  koPattern: readonly number[];
}

/**
 * Phone vibration that follows the screen shake: the bigger the shake, the longer and stronger the
 * buzz, always capped so it never gets harsh. Off when the player turns VIBRATION off in Options,
 * on phones that can't vibrate, and while the game is in the background.
 */
export class Haptics {
  private lastAt = -Infinity;
  private lastPx = 0;

  constructor(
    private readonly backend: HapticBackend | null,
    private readonly enabled: () => boolean,
    private readonly tuning: HapticTuning,
    private readonly now: () => number = () => performance.now(),
    private readonly visible: () => boolean = () => typeof document === 'undefined' || !document.hidden,
  ) {}

  /** True when this device exposes a vibration backend. */
  get supported(): boolean {
    return this.backend !== null;
  }

  /** A buzz to go with a screen shake of `shakePx` pixels. */
  shake(shakePx: number): void {
    if (shakePx <= 0) return;
    const t = this.tuning;
    const ms = clamp(Math.round(shakePx * t.msPerPx), t.minMs, t.maxMs);
    this.play(shakePx, [ms], level(shakePx, t));
  }

  /** The K.O. rumble, the strongest the game gets. */
  ko(): void {
    const t = this.tuning;
    const pattern = t.koPattern.map((ms, i) => (i % 2 === 0 ? clamp(ms, t.minMs, t.maxMs) : Math.max(0, ms)));
    this.play(Infinity, pattern, 'heavy');
  }

  /** A short buzz when VIBRATION is turned on, so the player feels what they picked. */
  preview(): void {
    this.lastAt = -Infinity;
    this.shake(this.tuning.mediumUpToPx);
  }

  private play(strength: number, pattern: number[], lvl: HapticLevel): void {
    if (!this.backend || !this.enabled() || !this.visible()) return;
    const at = this.now();
    if (at - this.lastAt < this.tuning.quietAfterMs && strength <= this.lastPx) return;
    this.lastAt = at;
    this.lastPx = strength;
    try {
      this.backend.play(pattern, lvl);
    } catch {
      // a phone refusing to vibrate is never a problem for the game
    }
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function level(px: number, t: HapticTuning): HapticLevel {
  return px <= t.lightUpToPx ? 'light' : px <= t.mediumUpToPx ? 'medium' : 'heavy';
}

/**
 * The best way this device has to vibrate: inside the Android app the Capacitor Haptics plugin
 * (which can buzz softer or harder), in a phone browser the Vibration API (Android Chrome, Firefox;
 * not iPhone Safari), and nothing on a desktop.
 */
export function deviceHaptics(): HapticBackend | null {
  if (typeof window === 'undefined') return null;
  if (isNativeApp()) {
    return {
      play(pattern, lvl) {
        // one impact per buzz; the pauses set when each one lands
        let at = 0;
        pattern.forEach((ms, i) => {
          if (i % 2 === 0) setTimeout(() => nativeImpact(i === 0 ? lvl : 'light'), at);
          at += ms;
        });
      },
    };
  }
  const touch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
  if (touch && typeof navigator.vibrate === 'function') {
    return { play: (pattern) => void navigator.vibrate([...pattern]) };
  }
  return null;
}
