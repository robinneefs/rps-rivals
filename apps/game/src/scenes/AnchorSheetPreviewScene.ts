import Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { MENU_TYPOGRAPHY } from '../config/menuTypography';
import { STAGES } from '../config/stages';
import { getContext } from './context';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';
import { addStage } from '../views/StageView';

const SHEET = 'review-fighter-sheet';
const POSES = ['idle0', 'idle1', 'rock', 'paper', 'scissors', 'hurt', 'ko', 'win', 'kick'];

/** Artwork review only: no character balance, production roster or match-state changes. */
export class AnchorSheetPreviewScene extends Phaser.Scene {
  private readonly reviewRiot = new URLSearchParams(location.search).get('art') === 'riot-sheet';
  private readonly reviewTaiko = new URLSearchParams(location.search).get('art') === 'taiko-sheet';
  constructor() {
    super(SceneKey.sheetPreview);
  }

  preload(): void {
    const stem = this.reviewTaiko ? 'taiko-v2' : this.reviewRiot ? 'riot-v2-first' : 'anchor-v3';
    this.load.atlas(SHEET, `assets/experiments/${stem}.png`, `assets/experiments/${stem}.json`);
  }

  create(): void {
    const name = this.reviewTaiko ? 'TAIKO' : this.reviewRiot ? 'RIOT' : 'ANCHOR';
    useMonitorCamera(this);
    getContext(this).audio.playMusic(null);
    addStage(this, STAGES[0]!);
    const title = this.add
      .bitmapText(96, 18, MENU_TYPOGRAPHY.fontKey, `${name} / TAIKO`, 16)
      .setOrigin(0.5, 0);
    this.add
      .bitmapText(96, 36, MENU_TYPOGRAPHY.fontKey, 'ART REVIEW', 16)
      .setOrigin(0.5, 0)
      .setTint(0xffdb70);
    const leftShadow = this.add.rectangle(54, 220, 48, 4, 0x050014);
    this.add.rectangle(138, 220, 40, 4, 0x050014);
    const anchor = this.add.image(54, 221, SHEET, 'idle0').setDisplayOrigin(80, 156);
    const rival = this.add.image(138, 221, Tex.fighterP1, 'idle0').setDisplayOrigin(64, 124).setFlipX(true);
    const panel = document.createElement('div');
    panel.setAttribute(
      'aria-label',
      `${this.reviewTaiko ? 'Taiko' : this.reviewRiot ? 'Riot' : 'Anchor'} sprite review`,
    );
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
    const field = (label: string, options: string[]) => {
      const row = document.createElement('label');
      row.style.display = 'block';
      row.style.margin = '5px 0';
      row.append(`${label} `);
      const select = document.createElement('select');
      select.setAttribute('aria-label', label);
      options.forEach((value) => select.add(new Option(value)));
      select.addEventListener('keydown', (event) => event.stopPropagation());
      row.append(select);
      panel.append(row);
      return select;
    };
    const pose = field('Pose', POSES);
    const playback = field('Playback', ['Idle loop', 'All poses', 'Hold pose']);
    const comparison = field('Compare with', ['Taiko', 'Riot']);
    const status = document.createElement('div');
    status.textContent = `Native size: ${name} ${this.reviewRiot || this.reviewTaiko ? 100 : 114}px / rivals 100px. Same floor. Current CRT.`;
    panel.append(status);
    const home = document.createElement('a');
    home.href = '/';
    home.textContent = 'Back to game';
    home.style.color = '#64e0ff';
    panel.append(home);
    document.body.append(panel);
    let index = 0;
    const show = (next: number) => {
      index = next;
      anchor.setFrame(POSES[index]!).setDisplayOrigin(80, 156);
      // Show the whole extended silhouette inside the monitor, including the KO and leaning kick.
      anchor.setX(index === 8 ? 67 : index === 6 ? (this.reviewRiot || this.reviewTaiko ? 60 : 70) : 54);
      leftShadow.setX(anchor.x - (index === 8 ? 30 : 0)).setSize(index === 8 ? 20 : 48, 4);
      pose.selectedIndex = index;
    };
    pose.addEventListener('change', () => {
      playback.selectedIndex = 2;
      show(pose.selectedIndex);
    });
    comparison.addEventListener('change', () => {
      const riot = comparison.selectedIndex === 1;
      rival.setTexture(riot ? Tex.fighterP2 : Tex.fighterP1, 'idle0').setDisplayOrigin(64, 124);
      title.setText(`${name} / ${riot ? 'RIOT' : 'TAIKO'}`);
    });
    const timer = this.time.addEvent({
      delay: 650,
      loop: true,
      callback: () => {
        if (playback.selectedIndex === 0) show(index === 0 ? 1 : 0);
        else if (playback.selectedIndex === 1) show((index + 1) % POSES.length);
      },
    });
    this.events.once('shutdown', () => {
      timer.remove();
      panel.remove();
    });
  }
}
