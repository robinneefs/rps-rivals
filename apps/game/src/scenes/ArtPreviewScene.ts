import Phaser from 'phaser';
import { FighterView } from '../views/FighterView';
import { paintPreviewHud, PREVIEW_HUD, type PreviewMoment } from './ArtPreviewHud';
import { getContext } from './context';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';
import { mountPreviewGrid } from './PreviewGrid';

const SPRITES = [
  { file: 'taiko-prompt-a', label: 'A - Coarse arcade' },
  { file: 'taiko-prompt-b', label: 'B - Explicit grid' },
  { file: 'taiko-prompt-c', label: 'C - Flat shapes' },
  { file: 'taiko-grid-v3', label: 'Grid redraw' },
  { file: 'taiko-idle-v2', label: 'Previous generation' },
  { file: 'taiko-idle-v1', label: 'Earlier sprite' },
];
const STAGE = 'experiment-rooftop-192';

/** Isolated native 192x240 mockup with 100px fighters. */
export class ArtPreviewScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.artPreview);
  }

  preload(): void {
    for (const { file } of SPRITES)
      this.load.image(`experiment-${file}-192`, `assets/experiments/${file}-192.png`);
    this.load.image(STAGE, 'assets/experiments/rooftop-192.png');
  }

  create(): void {
    const { input, audio, cabinet } = getContext(this);
    const camera = useMonitorCamera(this);
    camera.resetPostPipeline();
    const overlays = [...cabinet.screen.children].filter((el) => el !== this.game.canvas) as HTMLElement[];
    const visibility = overlays.map((el) => el.style.visibility);
    overlays.forEach((el) => (el.style.visibility = 'hidden'));
    audio.playMusic(null);
    for (const { file } of SPRITES)
      this.textures.get(`experiment-${file}-192`).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.add.image(0, 0, STAGE).setOrigin(0);
    const positions = { p1: 52, p2: 140 } as const;
    const old = {
      p1: new FighterView(this, 'p1', positions.p1, 220),
      p2: new FighterView(this, 'p2', positions.p2, 220),
    };
    const fresh = (x: number, flipped: boolean) =>
      this.add
        .image(x, 221, `experiment-${SPRITES[0]!.file}-192`)
        .setDisplayOrigin(48, 108)
        .setFlipX(flipped);
    const fighters = { p1: fresh(positions.p1, false), p2: fresh(positions.p2, true) };
    if (!this.textures.exists(PREVIEW_HUD)) this.textures.createCanvas(PREVIEW_HUD, 192, 240);
    this.add.image(0, 0, PREVIEW_HUD).setOrigin(0);
    let mode = 'paper';
    let spriteIndex = 2;
    let moment: PreviewMoment = 'pick';
    const refresh = () => {
      const selected = SPRITES[spriteIndex]!;
      for (const side of ['p1', 'p2'] as const) {
        fighters[side].setTexture(`experiment-${selected.file}-192`);
        fighters[side].setDisplayOrigin(48, 108);
        fighters[side].setScale(1);
      }
      pixelImage.src = `assets/experiments/${selected.file}-192.png`;
      pixelImage.style.width = '288px';
      pixelImage.style.height = '336px';
      explanation.textContent =
        selected.file === 'taiko-grid-v3'
          ? 'Legacy grid redraw resampled to 100px for comparison. Inspection enlarged 3x.'
          : 'Prepared from the generated source at 100px tall, displayed at 1:1. Inspection enlarged 3x.';
      old.p1.sprite.setVisible(mode !== 'paper');
      old.p2.sprite.setVisible(mode === 'scissors');
      fighters.p1.setVisible(mode === 'paper');
      fighters.p2.setVisible(mode !== 'scissors');
      paintPreviewHud(
        this,
        [mode === 'paper' ? 'TAIKO' : 'OLD', mode === 'scissors' ? 'OLD' : 'TAIKO'],
        moment,
      );
    };
    const off = input.on('action', (action) => {
      if (action.type === 'pick') {
        mode = action.move;
        refresh();
      }
    });
    const controls = document.createElement('div');
    controls.setAttribute('aria-label', 'Art preview controls');
    Object.assign(controls.style, {
      position: 'fixed',
      left: '12px',
      bottom: '12px',
      zIndex: '30',
      padding: '12px',
      background: '#100c22ed',
      color: '#fff',
      border: '1px solid #8e80ac',
      borderRadius: '8px',
      font: '14px system-ui',
      maxWidth: 'calc(100vw - 48px)',
    });
    const select = (label: string, choices: string[], changed: (index: number) => void) => {
      const row = document.createElement('label');
      row.textContent = label + ' ';
      row.style.display = 'block';
      row.style.margin = '5px 0';
      const field = document.createElement('select');
      field.setAttribute('aria-label', label);
      choices.forEach((choice) => field.add(new Option(choice)));
      field.addEventListener('keydown', (event) => event.stopPropagation());
      field.addEventListener('change', () => {
        changed(field.selectedIndex);
        refresh();
      });
      row.append(field);
      controls.append(row);
      return field;
    };
    const spriteSelect = select(
      'Sprite',
      SPRITES.map((sprite) => sprite.label),
      (index) => (spriteIndex = index),
    );
    spriteSelect.selectedIndex = spriteIndex;
    select(
      'Moment',
      ['Picking', 'Rock wins', 'K.O.'],
      (index) => (moment = (['pick', 'hit', 'ko'] as const)[index]!),
    );
    const hint = document.createElement('div');
    hint.textContent = 'Native 192 x 240 · 100px fighters';
    hint.style.fontSize = '12px';
    controls.append(hint);
    const sheetLink = document.createElement('a');
    sheetLink.href = '?art=taiko-sheet';
    sheetLink.textContent = 'Open Taiko sprite sheet';
    Object.assign(sheetLink.style, { display: 'block', color: '#64e0ff', marginTop: '6px' });
    controls.append(sheetLink);
    const inspection = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'Inspect exact game sprite';
    summary.style.cursor = 'pointer';
    const pixelImage = document.createElement('img');
    pixelImage.src = 'assets/experiments/taiko-prompt-a.png';
    pixelImage.alt = 'Exact prepared Taiko sprite, enlarged without smoothing';
    Object.assign(pixelImage.style, {
      display: 'block',
      width: '192px',
      height: '240px',
      imageRendering: 'pixelated',
      background: '#4c5363',
      marginTop: '8px',
    });
    const explanation = document.createElement('div');
    explanation.textContent = '54 x 75 figure, shown 1:1 in game. This view is enlarged 3x.';
    explanation.style.maxWidth = '230px';
    inspection.append(summary, pixelImage, explanation);
    controls.append(inspection);
    document.body.append(controls);
    this.events.once('shutdown', () => {
      off();
      controls.remove();
      overlays.forEach((el, i) => (el.style.visibility = visibility[i]!));
    });
    refresh();
    mountPreviewGrid(this, controls, 192);
  }
}
