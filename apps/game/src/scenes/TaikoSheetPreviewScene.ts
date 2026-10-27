import Phaser from 'phaser';
import { paintPreviewHud, PREVIEW_HUD } from './ArtPreviewHud';
import { getContext } from './context';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';
import { mountPreviewGrid } from './PreviewGrid';

const SHEET = 'experiment-taiko-flat-sheet-192';
const STAGE = 'experiment-rooftop-192';
const FRAMES = ['idle0', 'idle1', 'rock', 'paper', 'scissors', 'hurt', 'ko', 'win', 'kick'] as const;
const LABELS = [
  'Idle 1',
  'Idle 2',
  'Rock / punch',
  'Paper / block',
  'Scissors / shove',
  'Hurt',
  'K.O.',
  'Win',
  'Kick',
];

/** Development-only atlas review; the extra kick pose does not change the game's RPS rules. */
export class TaikoSheetPreviewScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.sheetPreview);
  }

  preload(): void {
    this.load.atlas(
      SHEET,
      'assets/experiments/taiko-flat-sheet-192.png',
      'assets/experiments/taiko-flat-sheet-192.json',
    );
    this.load.image(STAGE, 'assets/experiments/rooftop-192.png');
  }

  create(): void {
    const { cabinet, audio, input } = getContext(this);
    const camera = useMonitorCamera(this);
    camera.resetPostPipeline();
    const overlays = [...cabinet.screen.children].filter((el) => el !== this.game.canvas) as HTMLElement[];
    const visibility = overlays.map((el) => el.style.visibility);
    overlays.forEach((el) => (el.style.visibility = 'hidden'));
    audio.playMusic(null);
    this.textures.get(SHEET).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.add.image(0, 0, STAGE).setOrigin(0);
    const leftShadow = this.add.ellipse(96, 220, 40, 4, 0x101426);
    const rightShadow = this.add.ellipse(127, 220, 40, 4, 0x101426).setVisible(false);
    const left = this.add.image(96, 221, SHEET, 'idle0').setDisplayOrigin(64, 124);
    const right = this.add
      .image(127, 221, SHEET, 'idle0')
      .setDisplayOrigin(64, 124)
      .setFlipX(true)
      .setVisible(false);
    if (!this.textures.exists(PREVIEW_HUD)) this.textures.createCanvas(PREVIEW_HUD, 192, 240);
    this.add.image(0, 0, PREVIEW_HUD).setOrigin(0);
    paintPreviewHud(this, ['TAIKO', 'TAIKO'], 'pick');

    const panel = document.createElement('div');
    panel.setAttribute('aria-label', 'Sprite sheet preview');
    Object.assign(panel.style, {
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
    const row = (label: string, element: HTMLElement) => {
      const holder = document.createElement('label');
      holder.textContent = label + ' ';
      holder.style.display = 'block';
      holder.style.margin = '5px 0';
      holder.append(element);
      panel.append(holder);
    };
    const pose = document.createElement('select');
    pose.setAttribute('aria-label', 'Pose');
    LABELS.forEach((label) => pose.add(new Option(label)));
    row('Pose', pose);
    const playback = document.createElement('select');
    playback.setAttribute('aria-label', 'Playback');
    ['Idle loop', 'All poses', 'Hold pose'].forEach((label) => playback.add(new Option(label)));
    row('Playback', playback);
    const mirror = document.createElement('input');
    mirror.type = 'checkbox';
    row('Two fighters', mirror);
    const status = document.createElement('output');
    status.style.display = 'block';
    panel.append(status);
    const note = document.createElement('div');
    note.textContent = 'Native 192 x 240 · 100px idle · K kick';
    note.style.fontSize = '12px';
    panel.append(note);
    const link = document.createElement('a');
    link.href = '?art=taiko';
    link.textContent = 'Back to art comparisons';
    link.style.color = '#64e0ff';
    panel.append(link);
    document.body.append(panel);
    let index = 0;
    const show = (next: number) => {
      index = next;
      const frame = FRAMES[index]!;
      left.setFrame(frame).setDisplayOrigin(64, 124);
      right.setFrame(frame).setDisplayOrigin(64, 124);
      leftShadow.setX(left.x - (frame === 'kick' ? 27 : 0));
      rightShadow.setX(right.x + (frame === 'kick' ? 27 : 0));
      pose.selectedIndex = index;
      status.textContent = `${frame} · ${index + 1} / 9`;
    };
    pose.addEventListener('change', () => {
      playback.selectedIndex = 2;
      show(pose.selectedIndex);
    });
    mirror.addEventListener('change', () => {
      left.setX(mirror.checked ? 65 : 96);
      leftShadow.setX(left.x);
      right.setVisible(mirror.checked);
      rightShadow.setVisible(mirror.checked);
      show(index);
    });
    // Keep the page's input router from treating a select's arrow keys as cabinet actions.
    for (const field of [pose, playback])
      field.addEventListener('keydown', (event) => event.stopPropagation());
    const loop = this.time.addEvent({
      delay: 450,
      loop: true,
      callback: () => {
        if (playback.selectedIndex === 0) show(index === 0 ? 1 : 0);
        else if (playback.selectedIndex === 1) show((index + 1) % FRAMES.length);
      },
    });
    const hold = (frame: number) => {
      playback.selectedIndex = 2;
      show(frame);
    };
    const offInput = input.on('action', (action) => {
      if (action.type === 'pick') hold(({ rock: 2, paper: 3, scissors: 4 } as const)[action.move]);
    });
    this.input.keyboard?.on('keydown-K', () => hold(8));
    this.events.once('shutdown', () => {
      loop.remove();
      offInput();
      panel.remove();
      overlays.forEach((el, i) => (el.style.visibility = visibility[i]!));
    });
    show(0);
    mountPreviewGrid(this, panel, 192);
  }
}
