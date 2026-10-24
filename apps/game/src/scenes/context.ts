import { Emitter, type Move } from '@rps/core';
import type Phaser from 'phaser';
import type { AudioService } from '../audio/AudioService';
import type { CabinetView } from '../cabinet/CabinetView';
import type { CabinetShake } from '../fx/cabinetShake';
import type { InputRouter } from '../input/InputRouter';
import type { Haptics } from '../platform/haptics';
import type { SettingsStore } from '../platform/settings';
import type { SceneFlow } from './flow';

/** Which cabinet button is lit (the player's current pick), shared by the fight and the cabinet. */
export class CabinetLights {
  private readonly events = new Emitter<{ change: Move | null }>();
  private current: Move | null = null;

  get selected(): Move | null {
    return this.current;
  }

  select(move: Move | null): void {
    if (move === this.current) return;
    this.current = move;
    this.events.emit('change', move);
  }

  onChange(fn: (move: Move | null) => void): () => void {
    return this.events.on('change', fn);
  }
}

/** The services every scene gets. Built once in main.ts; no global singletons. */
export interface GameContext {
  input: InputRouter;
  /** The cabinet round the monitor (a page layer): its size, buttons and joystick. */
  cabinet: CabinetView;
  settings: SettingsStore;
  flow: SceneFlow;
  lights: CabinetLights;
  audio: AudioService;
  cabinetShake: CabinetShake;
  haptics: Haptics;
}

const KEY = 'gameContext';

export function setContext(game: Phaser.Game, ctx: GameContext): void {
  game.registry.set(KEY, ctx);
}

export function getContext(scene: Phaser.Scene): GameContext {
  return scene.registry.get(KEY) as GameContext;
}
