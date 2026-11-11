import type Phaser from 'phaser';
import { VOLUME_MAX, type Settings, type SettingsStore } from '../platform/settings';
import {
  musicFileKey,
  SFX,
  SFX_GAIN,
  sfxFileKeys,
  type MusicKey,
  type SfxKey,
  type SfxPlayer,
} from './sounds';

/**
 * Loudness of each bus at full volume, so effects sit on top of the music without jumping out of
 * it (they were about 14 dB over it; now about 9).
 */
const BUS = { music: 0.7, sfx: 0.7 } as const;
const FADE_IN_MS = 200;

/** Gain for a volume step: a curve, so the low steps are still audible but get quiet fast. */
export function busGain(settings: Settings, bus: 'music' | 'sfx'): number {
  if (settings.muted) return 0;
  const step = bus === 'music' ? settings.musicVolume : settings.sfxVolume;
  return BUS[bus] * (step / VOLUME_MAX) ** 1.5;
}

interface Fade {
  sound: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.NoAudioSound;
  from: number;
  to: number;
  startMs: number;
  durMs: number;
  stopAtEnd: boolean;
}

type Track = { key: MusicKey; sound: Fade['sound'] };

/**
 * Plays sound effects and music on two buses (music, sfx) with mute and saved volumes.
 * Sound effects with variations play a random one. Music cross-fades between tracks and waits
 * for the browser to allow sound (the first tap or key press) before it starts.
 */
export class AudioService implements SfxPlayer {
  private track: Track | null = null;
  private wanted: MusicKey | null = null;
  private startAt: number | null = null;
  private fades: Fade[] = [];
  private now = 0;

  constructor(
    private readonly game: Phaser.Game,
    private readonly settings: SettingsStore,
  ) {
    game.events.on('step', (time: number) => this.step(time));
    this.addLimiter();
    game.sound.on('unlocked', () => this.startWanted());
    // WebAudio suspends its clock on blur. One-shots started while suspended
    // would otherwise accumulate and all begin when the context resumes.
    const discardEffects = () => {
      for (const key of Object.keys(SFX) as SfxKey[])
        for (const file of sfxFileKeys(key)) for (const sound of game.sound.getAll(file)) sound.destroy();
    };
    game.events.on('blur', discardEffects);
    game.events.on('hidden', discardEffects);
    settings.onChange(() => this.applyVolumes());
  }

  /** The music track playing now, if any (for the smoke tests). */
  get music(): MusicKey | null {
    return this.track?.key ?? null;
  }

  play(key: SfxKey, opts: { detune?: number; volume?: number } = {}): void {
    const gain = busGain(this.settings.value, 'sfx') * (SFX_GAIN[key] ?? 1) * (opts.volume ?? 1);
    const manager = this.game.sound as Partial<Phaser.Sound.WebAudioSoundManager>;
    if (
      gain <= 0 ||
      this.game.sound.locked ||
      manager.gameLostFocus ||
      (typeof document !== 'undefined' && document.hidden) ||
      (manager.context && manager.context.state !== 'running')
    )
      return;
    const files = sfxFileKeys(key);
    const file = files[Math.floor(Math.random() * files.length)];
    if (!file || !this.game.cache.audio.exists(file)) return;
    this.game.sound.play(file, { volume: gain, detune: opts.detune ?? 0 });
  }

  /**
   * Switch the music to this track (null: silence). The old track fades out; the new one starts
   * after `delayMs`. Asking for the track that is already playing changes nothing.
   */
  playMusic(key: MusicKey | null, opts: { delayMs?: number; fadeOutMs?: number } = {}): void {
    if (key === this.wanted && (key === null || this.track?.key === key || this.startAt !== null)) return;
    this.wanted = key;
    this.startAt = null;
    if (this.track) {
      this.fadeTo(this.track.sound, 0, opts.fadeOutMs ?? 400, true);
      this.track = null;
    }
    if (key === null) return;
    this.startAt = this.now + (opts.delayMs ?? 0);
  }

  /**
   * A limiter on the way out: when several sounds land at once (a hit, the whoosh, the music)
   * their sum would clip into a harsh, louder crackle. It only acts on those peaks.
   */
  private addLimiter(): void {
    const manager = this.game.sound as Partial<Phaser.Sound.WebAudioSoundManager>;
    const { context, masterVolumeNode: master } = manager;
    if (!context || !master) return; // HTML5 audio or no audio: nothing to route
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 2;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.15;
    master.disconnect();
    master.connect(limiter);
    limiter.connect(context.destination);
  }

  private startWanted(): void {
    const key = this.wanted;
    if (!key || this.track || this.game.sound.locked) return;
    const file = musicFileKey(key);
    if (!this.game.cache.audio.exists(file)) return;
    // the volume must go to play() too: play() with no config resets the sound to full volume,
    // which came out as a loud burst on every screen change, even with sound off
    const sound = this.game.sound.add(file, { loop: true, volume: 0 });
    sound.play({ loop: true, volume: 0 });
    this.track = { key, sound };
    this.fadeTo(sound, busGain(this.settings.value, 'music'), FADE_IN_MS, false, 0);
  }

  private step(time: number): void {
    this.now = time;
    if (this.startAt !== null && time >= this.startAt) {
      this.startAt = null;
      this.startWanted();
    }
    this.fades = this.fades.filter((f) => {
      const t = Math.min(1, (time - f.startMs) / f.durMs);
      f.sound.setVolume(f.from + (f.to - f.from) * t);
      if (t < 1) return true;
      if (f.stopAtEnd) f.sound.destroy();
      return false;
    });
  }

  private fadeTo(
    sound: Fade['sound'],
    to: number,
    durMs: number,
    stopAtEnd: boolean,
    from = sound.volume,
  ): void {
    this.fades = this.fades.filter((f) => f.sound !== sound);
    this.fades.push({
      sound,
      from,
      to,
      startMs: this.now,
      durMs: Math.max(1, durMs),
      stopAtEnd,
    });
  }

  private applyVolumes(): void {
    if (!this.track) return;
    this.fades = this.fades.filter((f) => f.sound !== this.track?.sound);
    this.track.sound.setVolume(busGain(this.settings.value, 'music'));
  }
}
