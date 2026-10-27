import Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { MONITOR } from '../config/layout';
import { homeEntranceFrame, HOME_ENTRANCE } from '../config/homeEntrance';
import { palette } from '../config/palette';
import { tuning } from '../config/tuning';
import { getContext } from './context';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';

/** Native studio ident: slow menu-style pop, one clipped sheen, then the reversed pop. */
export class LogoScene extends Phaser.Scene {
  private logo!: Phaser.GameObjects.Image;
  private sheen!: Phaser.GameObjects.Image;
  private elapsed = 0;
  private baseY = 0;
  private left = false;
  private reducedMotion!: MediaQueryList;

  constructor() {
    super(SceneKey.logo);
  }

  create(): void {
    const { input } = getContext(this);
    useMonitorCamera(this).setBackgroundColor(palette.black);
    this.elapsed = 0;
    this.left = false;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.logo = this.add.image(0, 0, Tex.logo).setOrigin(0);
    const x = Math.floor((MONITOR.width - this.logo.width) / 2);
    this.baseY = Math.floor((MONITOR.height - this.logo.height) / 2);
    this.logo.setPosition(x, this.baseY).setAlpha(0);
    this.sheen = this.add.image(x, this.baseY, Tex.logoSheen, 'sheen0').setOrigin(0).setAlpha(0);
    const off = input.on('action', () => this.leave());
    this.input.once('pointerdown', () => this.leave());
    this.events.once('shutdown', off);
    this.draw();
  }

  override update(_time: number, delta: number): void {
    if (document.hidden || this.left) return;
    this.elapsed += Math.min(delta, 100);
    this.draw();
  }

  private draw(): void {
    const { delayMs, popMs, holdMs, sheenDelayMs, sheenMs } = tuning.intro;
    const age = this.elapsed - delayMs;
    const exitAt = popMs + holdMs;
    if (age >= exitAt + popMs) {
      this.logo.setAlpha(0);
      this.sheen.setAlpha(0);
      this.leave();
      return;
    }
    // Reuse the menu's exact easing/bounce shape, stretched to a slower duration.
    // Sampling it backwards gives the exit its matching anticipation, lift and fade.
    const duration = HOME_ENTRANCE.fallMs + HOME_ENTRANCE.reboundMs + HOME_ENTRANCE.settleMs;
    const progress = age < 0 ? 0 : age < popMs ? age / popMs : age < exitAt ? 1 : 1 - (age - exitAt) / popMs;
    const state = homeEntranceFrame(HOME_ENTRANCE.delayMs + progress * duration, 0);
    this.logo.setY(this.baseY + (this.reducedMotion.matches ? 0 : state.offsetY)).setAlpha(state.alpha);
    const sheenAge = age - popMs - sheenDelayMs;
    const shining = !this.reducedMotion.matches && sheenAge >= 0 && sheenAge < sheenMs;
    this.sheen.setY(this.logo.y).setAlpha(shining ? 1 : 0);
    if (shining) this.sheen.setFrame(`sheen${Math.min(23, Math.floor((sheenAge / sheenMs) * 24))}`);
  }

  private leave(): void {
    if (this.left) return;
    this.left = true;
    getContext(this).flow.toHome();
  }
}
