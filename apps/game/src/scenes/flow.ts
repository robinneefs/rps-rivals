import type { MatchState, Side, PlayableCharacterId } from '@rps/core';
import type Phaser from 'phaser';
import type { AudioService } from '../audio/AudioService';
import type { MusicKey } from '../audio/sounds';
import { createSession } from '../session/createSession';
import type { MatchSession, MatchSetup } from '../session/MatchSession';
import type { OnlineSession } from '../session/OnlineSession';
import { MONITOR_SCENES, SceneKey } from './keys';
import type { TransitionScene } from './TransitionScene';
import { VersusView } from '../views/VersusView';
import { stageFor } from '../config/stages';
import { getContext } from './context';
import { tuning } from '../config/tuning';

/** The music each screen plays (Result switches to the menu loop after the win or lose jingle). */
const SCENE_MUSIC: Record<string, MusicKey | null> = {
  [SceneKey.logo]: null,
  [SceneKey.home]: 'menu',
  [SceneKey.options]: 'menu',
  [SceneKey.characterSelect]: 'menu',
  [SceneKey.howTo]: 'menu',
  [SceneKey.lobby]: 'menu',
  // FightScene selects the theme from its actual seeded/overridden stage.
};

/** How long the result jingle plays before the menu music comes back. */
const RESULT_MUSIC_DELAY_MS = 2200;

export interface FightData {
  setup: MatchSetup;
  session: MatchSession;
  versus?: VersusView;
}
export interface CharacterSelectData {
  setup: MatchSetup;
  session?: OnlineSession;
}

export interface ResultData extends FightData {
  winner: Side;
  state: MatchState;
}

/**
 * The one place that changes screens: Logo -> Home -> Fight -> Result -> (Retry -> Fight | Home),
 * Home <-> Options, Home <-> How to play, and Home -> Lobby -> Fight for online matches.
 * Scenes never start each other by key. Owns the current match session's lifetime.
 */
export class SceneFlow {
  private session: MatchSession | null = null;
  private busy = false;
  selectedCharacter: PlayableCharacterId = 'taiko';
  get transitioning(): boolean {
    return this.busy;
  }

  constructor(
    private readonly game: Phaser.Game,
    private readonly audio: AudioService,
  ) {}

  /** The match being played or just finished, if any. */
  get activeSession(): MatchSession | null {
    return this.session;
  }

  toLogo(): void {
    this.show(SceneKey.logo);
  }

  toHome(): void {
    this.wipe(() => {
      this.endSession();
      this.show(SceneKey.home);
    });
  }

  toOptions(): void {
    this.wipe(() => this.show(SceneKey.options));
  }

  toHowTo(): void {
    this.wipe(() => this.show(SceneKey.howTo));
  }

  /** Online: create or join a room. The lobby hands its connected session to toFight. */
  toLobby(): void {
    this.wipe(() => this.show(SceneKey.lobby));
  }

  toCharacterSelect(setup: MatchSetup, session?: OnlineSession): void {
    this.wipe(() => {
      if (session !== this.session) this.endSession();
      this.session = session ?? null;
      this.show(SceneKey.characterSelect, { setup, session } satisfies CharacterSelectData);
    });
  }

  /** Starts a match; pass the existing session for a rematch (Retry). */
  toFight(setup: MatchSetup, session?: MatchSession): void {
    if (this.busy) return;
    this.busy = true;
    if (session !== this.session) this.endSession();
    this.session = session ?? createSession(setup);
    const active = this.session;
    const stage = stageFor(active.stageSeed(), new URLSearchParams(location.search).get('stage'));
    const transition = this.game.scene.getScene(SceneKey.transition) as TransitionScene;
    this.game.scene.bringToTop(SceneKey.transition);
    const versus = new VersusView(
      transition,
      active,
      stage.name,
      () => this.show(SceneKey.fight, { setup, session: active, versus } satisfies FightData),
      () => {
        if (!active.endedReason) active.ready();
      },
      () => {
        this.audio.play('clash');
        getContext(transition).cabinetShake.kick(tuning.versus.cabinetPx, tuning.versus.cabinetMs);
      },
      () => {
        this.busy = false;
      },
    );
  }

  /** The result screen opens over the last fight frame (the fight is paused, not stopped). */
  toResult(data: ResultData): void {
    this.game.scene.pause(SceneKey.fight);
    this.game.scene.run(SceneKey.result, data);
    this.audio.playMusic('menu', { delayMs: RESULT_MUSIC_DELAY_MS, fadeOutMs: 250 });
  }

  private show(key: string, data?: object): void {
    for (const k of MONITOR_SCENES) if (k !== key) this.game.scene.stop(k);
    this.game.scene.start(key, data);
    this.game.scene.bringToTop(SceneKey.transition);
    const music = SCENE_MUSIC[key];
    if (music !== undefined) this.audio.playMusic(music);
  }

  private wipe(swap: () => void): void {
    if (this.busy) return;
    this.busy = true;
    const transition = this.game.scene.getScene(SceneKey.transition) as TransitionScene;
    transition.wipe(swap, () => {
      this.busy = false;
    });
  }

  private endSession(): void {
    this.session?.dispose();
    this.session = null;
  }
}
