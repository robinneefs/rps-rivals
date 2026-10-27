import type { Side } from '@rps/core';
import type Phaser from 'phaser';
import { Tex } from '../assets/keys';
import type { PickChip } from '../assets/placeholders/icons';
import { STAGE } from '../config/layout';
import { palette, sideColors } from '../config/palette';
import { tuning } from '../config/tuning';
import { PixelText } from './PixelText';

const SIDES = ['p1', 'p2'] as const;
/** Just above the fighters' heads: the name, the arrow under it, and the pick chip on top (y = its top edge). */
const TAG = { nameY: 101, arrowY: 109, chipY: 81, chipLowY: 103 } as const;

/**
 * Over each fighter's head: a "YOU" / "RIVAL" tag in the side's colour with an arrow pointing down
 * at them (the first round), and while picking a chip with your move or the rival's "?". Dumb: the
 * director says when.
 */
export class TagView {
  private readonly names: Record<Side, PixelText>;
  private readonly arrows: Record<Side, PixelText>;
  private readonly chips: Record<Side, Phaser.GameObjects.Image>;
  private tagsOn = false;
  private bob = 0;
  private blink: Phaser.Time.TimerEvent | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    labels: Record<Side, string>,
  ) {
    const text = (side: Side, y: number, s: string) =>
      new PixelText(scene, STAGE.fighterX[side], y, s, {
        color: sideColors[side],
        align: 'center',
        outline: palette.ink,
      }).setVisible(false);
    this.names = { p1: text('p1', TAG.nameY, labels.p1), p2: text('p2', TAG.nameY, labels.p2) };
    this.arrows = { p1: text('p1', TAG.arrowY, '▼'), p2: text('p2', TAG.arrowY, '▼') };
    this.chips = {
      p1: this.chip(STAGE.fighterX.p1),
      p2: this.chip(STAGE.fighterX.p2),
    };
    const timer = scene.time.addEvent({
      delay: tuning.identity.bobMs,
      loop: true,
      callback: () => {
        this.bob = this.bob ? 0 : tuning.identity.bobPx;
        this.place();
      },
    });
    scene.events.once('shutdown', () => timer.remove());
  }

  /** The name tags and arrows on or off. */
  showTags(on: boolean): void {
    this.stopBlink();
    this.tagsOn = on;
    for (const side of SIDES) {
      this.names[side].setVisible(on);
      this.arrows[side].setVisible(on);
    }
    this.place();
  }

  /** The tags show once more and blink out: a last reminder before they go for the match. */
  blinkOut(): void {
    this.showTags(true);
    const { blinkTimes, blinkMs } = tuning.identity;
    let left = blinkTimes * 2;
    this.blink = this.scene.time.addEvent({
      delay: blinkMs,
      repeat: left - 1,
      callback: () => {
        left--;
        const on = left > 0 && left % 2 === 0;
        for (const side of SIDES) {
          this.names[side].setVisible(on);
          this.arrows[side].setVisible(on);
        }
        if (left === 0) this.showTags(false);
      },
    });
  }

  /** A chip over a fighter: a move (yours), "unknown" (the rival locked in), "waiting", or null for none. */
  setChip(side: Side, chip: PickChip | null): void {
    this.chips[side].setVisible(chip !== null);
    if (chip) this.chips[side].setFrame(chip);
  }

  hideChips(): void {
    for (const side of SIDES) this.setChip(side, null);
  }

  private chip(x: number): Phaser.GameObjects.Image {
    return this.scene.add.image(x, TAG.chipY, Tex.pickChips, 'waiting').setOrigin(0.5, 0).setVisible(false);
  }

  private stopBlink(): void {
    this.blink?.remove();
    this.blink = null;
  }

  private place(): void {
    for (const side of SIDES) {
      this.names[side].setY(TAG.nameY + this.bob);
      this.arrows[side].setY(TAG.arrowY + this.bob);
      // with no tag under it the chip sits lower, right over the head
      this.chips[side].setY((this.tagsOn ? TAG.chipY : TAG.chipLowY) + this.bob);
    }
  }
}
