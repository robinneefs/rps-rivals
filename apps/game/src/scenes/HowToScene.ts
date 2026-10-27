import { defaultRules, type Move } from '@rps/core';
import Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { MONITOR } from '../config/layout';
import { moveColors, palette } from '../config/palette';
import { addMenuBackdrop } from '../views/MenuBackdrop';
import { PixelText } from '../views/PixelText';
import { getContext } from './context';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';

/**
 * The moves round a circle, each arrow pointing from a move to the one it beats: rock (top) beats
 * scissors (right), scissors beats paper (left), paper beats rock. Badge centres, and where each
 * move's name and damage go.
 */
const RING: readonly { move: Move; x: number; y: number; label: 'right' | 'below' }[] = [
  { move: 'rock', x: 96, y: 46, label: 'right' },
  { move: 'scissors', x: 148, y: 90, label: 'below' },
  { move: 'paper', x: 44, y: 90, label: 'below' },
];
/** Arrows between the badges (from, to), in the same order: each ends at the move it beats. */
const ARROWS: readonly [number, number, number, number][] = [
  [116, 58, 133, 72],
  [124, 90, 68, 90],
  [59, 72, 76, 58],
];

/** A one-card How to play: the circle of which move beats which and how hard each hits, then the few rules. Any button goes back. */
export class HowToScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.howTo);
  }

  create(): void {
    const { flow, input, audio } = getContext(this);
    useMonitorCamera(this);
    const cx = MONITOR.width / 2;
    addMenuBackdrop(this);
    this.add.tileSprite(0, 0, MONITOR.width, MONITOR.height, Tex.dither).setOrigin(0);
    new PixelText(this, cx, 8, 'HOW TO PLAY', {
      size: 2,
      color: palette.cyan,
      align: 'center',
      outline: palette.ink,
      shadow: palette.shadow,
    });

    // the circle of who beats whom
    const g = this.add.graphics();
    for (const [x0, y0, x1, y1] of ARROWS) arrow(g, x0, y0, x1, y1, palette.gold);
    for (const { move, x, y, label } of RING) {
      this.add.image(x, y, Tex.badges, `${move}-normal`);
      const [tx, ty, align] =
        label === 'right' ? [x + 24, y - 10, 'left' as const] : [x, y + 22, 'center' as const];
      new PixelText(this, tx, ty, move.toUpperCase(), {
        color: moveColors[move].main,
        align,
        shadow: palette.ink,
      });
      new PixelText(this, tx, ty + 9, `${defaultRules.damage[move]} DAMAGE`, {
        color: palette.gold,
        align,
        shadow: palette.ink,
      });
    }

    const lines = [
      'EACH BEATS THE ONE IT POINTS AT',
      'PICK WITH THE BUTTONS 1 2 3',
      'BEFORE THE TIMER RUNS OUT',
      'NO PICK? ONE IS PICKED FOR YOU',
      'SAME MOVE: CLASH - NO DAMAGE',
      `WIN ${defaultRules.roundsToWin} ROUNDS TO WIN THE MATCH`,
    ];
    this.add.rectangle(0, 131, MONITOR.width, lines.length * 11 + 6, palette.panel, 0.85).setOrigin(0);
    lines.forEach(
      (line, i) =>
        new PixelText(this, cx, 135 + i * 11, line, {
          color: i === 0 ? palette.text : i === lines.length - 1 ? palette.gold : palette.lilac,
          align: 'center',
          shadow: palette.ink,
        }),
    );
    const prompt = new PixelText(this, cx, 205, 'PRESS ANY BUTTON', {
      color: palette.text,
      align: 'center',
      shadow: palette.ink,
    });
    this.time.addEvent({ delay: 450, loop: true, callback: () => prompt.setVisible(!prompt.visible) });

    let leaving = false;
    const off = input.on('action', (a) => {
      if (leaving || !this.scene.isActive()) return;
      if (a.type !== 'pick' && a.type !== 'confirm' && a.type !== 'back') return;
      leaving = true;
      audio.play('menuBack');
      flow.toHome();
    });
    this.input.on('pointerdown', () => {
      if (leaving) return;
      leaving = true;
      audio.play('menuBack');
      flow.toHome();
    });
    this.events.once('shutdown', off);
  }
}

/**
 * A 2 px arrow on the pixel grid from (x0, y0) to (x1, y1) with an ink outline: the shaft stepped
 * pixel by pixel (no smooth lines), and a head of two short strokes swept back from the tip.
 */
function arrow(
  g: Phaser.GameObjects.Graphics,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: number,
): void {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const ux = (x1 - x0) / len;
  const uy = (y1 - y0) / len;
  const dots: [number, number][] = [];
  const stroke = (ax: number, ay: number, bx: number, by: number) => {
    const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let i = 0; i <= n; i++) {
      const t = n ? i / n : 0;
      dots.push([Math.round(ax + (bx - ax) * t), Math.round(ay + (by - ay) * t)]);
    }
  };
  // the head: 6 px strokes back from the tip, turned 40 degrees either way
  const head = 6;
  const cos = Math.cos(0.7);
  const sin = Math.sin(0.7);
  stroke(x0, y0, x1, y1);
  stroke(
    x1,
    y1,
    Math.round(x1 - (ux * cos - uy * sin) * head),
    Math.round(y1 - (uy * cos + ux * sin) * head),
  );
  stroke(
    x1,
    y1,
    Math.round(x1 - (ux * cos + uy * sin) * head),
    Math.round(y1 - (uy * cos - ux * sin) * head),
  );
  // the whole outline first, so no stroke's outline cuts into another's colour
  g.fillStyle(palette.ink);
  for (const [x, y] of dots) g.fillRect(x - 1, y - 1, 4, 4);
  g.fillStyle(color);
  for (const [x, y] of dots) g.fillRect(x, y, 2, 2);
}
