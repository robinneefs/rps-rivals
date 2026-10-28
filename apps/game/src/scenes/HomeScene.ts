import Phaser from 'phaser';
import { HOME_CHARACTERS, homeLabelTexture, HomeTex, type HomeLayout } from '../assets/homeArt';
import { homeMenu } from '../menus/homeMenu';
import { homeEntranceFrame } from '../config/homeEntrance';
import { HomeMenuView } from '../views/HomeMenuView';
import { getContext } from './context';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';
import { addPortraitBreathing } from '../fx/portraitBreathing';
import { portraitBreathAmount } from '../config/portraitBreathing';

/** Layered action menu on the same native pixel grid as the fight. */
export class HomeScene extends Phaser.Scene {
  private layout!: HomeLayout;
  private background!: Phaser.GameObjects.Image;
  private character!: Phaser.GameObjects.Image;
  private elapsed = 0;
  private reducedMotion!: MediaQueryList;
  private menu!: HomeMenuView;
  private logoHoverStart: number | null = null;
  private title!: Phaser.GameObjects.Image;
  private entranceTargets: { image: Phaser.GameObjects.Image; y: number; alpha: number }[] = [];
  private entranceFinished = false;
  private steadyPortrait = false;
  private portraitMotion: ReturnType<typeof addPortraitBreathing> = null;
  private portraitId = 'riot';
  get portraitState() {
    return {
      id: this.portraitId,
      steady: this.steadyPortrait,
      amount: this.reducedMotion.matches ? 0 : portraitBreathAmount(this.elapsed),
      frame: this.character.frame.name,
    };
  }
  constructor() {
    super(SceneKey.home);
  }

  create(): void {
    const { flow, input, lights, audio } = getContext(this);
    useMonitorCamera(this);
    lights.select(null);
    this.layout = this.cache.json.get(HomeTex.layout) as HomeLayout;
    this.elapsed = 0;
    this.logoHoverStart = null;
    this.entranceFinished = false;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.background = this.add.image(0, 0, HomeTex.background, 'speed0').setOrigin(0);
    const { character, logo, paint } = this.layout;
    const selected = HOME_CHARACTERS[Math.floor(Math.random() * HOME_CHARACTERS.length)]!;
    this.portraitId = selected.id;
    this.character = this.add.image(character.x, character.y, selected.texture, 'rest').setOrigin(0);
    this.steadyPortrait = true;
    this.portraitMotion = addPortraitBreathing(this, this.character, selected.id);
    const title = (this.title = this.add.image(logo.x, logo.y, HomeTex.logo).setOrigin(0));
    if (!this.textures.exists('home-angled-backdrop')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x291b52);
      g.fillPoints(
        [
          { x: 0, y: 7 },
          { x: 224, y: 30 },
          { x: 224, y: 120 },
          { x: 0, y: 120 },
        ],
        true,
      );
      g.fillStyle(0xe95079);
      g.fillPoints(
        [
          { x: 0, y: 3 },
          { x: 224, y: 26 },
          { x: 224, y: 30 },
          { x: 0, y: 9 },
        ],
        true,
      );
      for (let i = 0; i < 5; i++) {
        const y = 42 + i * 15;
        g.fillPoints(
          [
            { x: 0, y },
            { x: 28, y: y - 7 },
            { x: 17, y: y - 1 },
            { x: 0, y: y + 4 },
          ],
          true,
        );
        g.fillPoints(
          [
            { x: 224, y: y + 7 },
            { x: 198, y: y + 15 },
            { x: 212, y: y + 7 },
          ],
          true,
        );
      }
      g.generateTexture('home-angled-backdrop', 224, 120);
      g.destroy();
    }
    const panel = this.add.image(paint.x, paint.y, 'home-angled-backdrop').setOrigin(0);
    this.menu = new HomeMenuView(
      this,
      homeMenu(flow),
      this.layout,
      input,
      audio,
      homeLabelTexture(new URLSearchParams(window.location.search).get('homeFont')),
      () => this.finishEntrance(),
    );
    this.entranceTargets = [
      { image: panel, y: paint.y, alpha: 1 },
      { image: this.character, y: character.y, alpha: 1 },
      { image: title, y: logo.y, alpha: 1 },
      ...this.menu.entranceTargets,
    ];
    this.menu.setEntranceReady(false);
    if (this.reducedMotion.matches) this.finishEntrance();
    else this.updateEntrance();
  }

  override update(_time: number, delta: number): void {
    if (document.hidden) return;
    if (this.reducedMotion.matches) {
      this.finishEntrance();
      this.background.setFrame('speed0');
      this.character.setFrame('rest');
      this.portraitMotion?.update(0, true);
      this.title.setY(this.layout.logo.y);
      return;
    }
    this.elapsed += Math.min(delta, 100);
    this.updateEntrance();
    if (this.logoHoverStart !== null) {
      // A continuous 2px bob, snapped to the native grid with no pause between cycles.
      const phase = ((this.elapsed - this.logoHoverStart) / 2400) * Math.PI * 2;
      this.title.setY(this.layout.logo.y + Math.round(Math.sin(phase) * 2));
    }
    const bg = this.layout.background;
    this.background.setFrame(`speed${bg.frames[Math.floor(this.elapsed / bg.frameMs) % bg.frames.length]}`);
    this.character.setFrame('rest');
    this.portraitMotion?.update(this.elapsed, false);
  }

  private finishEntrance(): void {
    if (this.entranceFinished) return;
    this.entranceFinished = true;
    this.entranceTargets.forEach(({ image, y, alpha }) => image.setY(y).setAlpha(alpha));
    this.character.setX(this.layout.character.x);
    this.menu.setEntranceReady(true);
    this.menu.syncEntranceCursor();
    this.logoHoverStart ??= this.elapsed;
  }

  private updateEntrance(): void {
    if (this.entranceFinished) return;
    let finished = true;
    this.entranceTargets.forEach(({ image, y, alpha }, i) => {
      const state = homeEntranceFrame(this.elapsed, i);
      image.setY(y + state.offsetY).setAlpha(alpha * state.alpha);
      if (i === 1) image.setX(this.layout.character.x + state.offsetX);
      if (!state.complete) finished = false;
      if (i === 2 && state.complete) this.logoHoverStart ??= this.elapsed;
    });
    this.menu.syncEntranceCursor();
    if (finished) this.finishEntrance();
  }
}
