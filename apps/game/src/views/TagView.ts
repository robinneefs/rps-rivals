import { drawMoveCoin } from './moveCoin';
import type { Side } from '@rps/core';
import type Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { MENU_TYPOGRAPHY } from '../config/menuTypography';
import type { PickChip } from '../assets/placeholders/icons';
import { STAGE } from '../config/layout';
import { palette, sideColors } from '../config/palette';
import { tuning } from '../config/tuning';
import { PixelText } from './PixelText';

const SIDES = ['p1', 'p2'] as const;
/** Just above the fighters' heads: the name, the arrow under it, and the pick chip on top (y = its top edge). */
const TAG = { nameY: 88, arrowY: 98, chipY: 64, chipLowY: 103 } as const;
const markerColors = { p1: 0xff2020, p2: sideColors.p2 } as const;
const MOVE_CIRCLE = { x: { p1: 28, p2: 164 }, y: 105, radius: 25 } as const;

/**
 * Over each fighter's head: a "YOU" / "RIVAL" tag in the side's colour with an arrow pointing down
 * at them (the first round), and while picking a chip with your move or the rival's "?". Dumb: the
 * director says when.
 */
export class TagView {
  private readonly names: Record<Side, PixelText>;
  private readonly arrows: Record<Side, Phaser.GameObjects.Graphics>;
  private readonly chips: Record<Side, Phaser.GameObjects.Image>;
  private readonly circles: Record<Side, Phaser.GameObjects.Graphics>;
  private readonly circlePops: Partial<Record<Side, Phaser.Tweens.Tween>> = {};
  private readonly chipValues: Partial<Record<Side, PickChip>> = {};
  private tagsOn = false;
  private bob = 0;
  private blink: Phaser.Time.TimerEvent | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    labels: Record<Side, string>,
  ) {
    const text = (side: Side, y: number, s: string) =>
      new PixelText(scene, STAGE.fighterX[side], y, s, {
        color: markerColors[side],
        align: 'center',
        outline: palette.ink,
      }).setVisible(false);
    this.names = { p1: text('p1', TAG.nameY, labels.p1), p2: text('p2', TAG.nameY, labels.p2) };
    const arrow = (side: Side) => {
      const width = this.names[side].textWidth;
      const g = scene.add.graphics().setPosition(STAGE.fighterX[side], TAG.arrowY).setVisible(false);
      const left = -Math.floor(width / 2);
      // Draw in native game pixels, including the outline; no display-resolution overlay.
      const shape = (dx: number, dy: number, color: number) => {
        g.fillStyle(color, 1);
        g.fillRect(left + dx, dy, width, 3);
        g.fillRect(left + dx, 4 + dy, width, 3);
        for (let row = 0; row < Math.ceil(width / 2); row++)
          g.fillRect(left + row + dx, 8 + row + dy, width - row * 2, 1);
      };
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) shape(dx, dy, 0x000000);
      shape(0, 0, markerColors[side]);
      return g;
    };
    // The local marker always reads YOU, including when the local side is P2.
    this.names[labels.p1 === 'YOU' ? 'p1' : 'p2'].setText('YOU');
    this.arrows = { p1: arrow('p1'), p2: arrow('p2') };
    this.circles = {
      p1: scene.add.graphics().setName('move-circle-p1').setVisible(false),
      p2: scene.add.graphics().setName('move-circle-p2').setVisible(false),
    };
    this.chips = {
      p1: this.chip(MOVE_CIRCLE.x.p1),
      p2: this.chip(MOVE_CIRCLE.x.p2),
    };
    // These are stage-backed UI: fighters and foreground effects overlap their lower edge.
    const behindFighters = scene.children.getByName('shadow-p1');
    if (behindFighters)
      for (const side of SIDES) {
        scene.children.moveBelow(this.circles[side], behindFighters);
        scene.children.moveBelow(this.chips[side], behindFighters);
      }
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

  /** Identify only the local fighter until FIGHT; colour follows the actual player side. */
  showYou(side: Side): void {
    this.showTags(false);
    this.tagsOn = true;
    this.names[side].setText('YOU').setName('intro-you-label').setVisible(true);
    this.arrows[side].setName('intro-you-arrow').setVisible(true);
    this.place();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let on = true;
    this.blink = this.scene.time.addEvent({
      delay: tuning.identity.introFlickerMs,
      loop: true,
      callback: () => {
        on = !on;
        this.arrows[side].setVisible(on);
      },
    });
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
    const entering = chip !== null && !this.circles[side].visible;
    this.circlePops[side]?.stop();
    this.chips[side].setVisible(chip !== null);
    this.circles[side].clear().setVisible(chip !== null);
    if (!chip) {
      delete this.chipValues[side];
      return;
    }
    this.chipValues[side] = chip;
    const handKey = `move-hand-${chip}`;
    const hand = this.scene.textures.exists(handKey);
    const hidden = chip === 'waiting' || chip === 'unknown';
    if (hidden) {
      const key = 'move-question-menu-bold-v4';
      if (!this.scene.textures.exists(key)) {
        const texture = this.scene.textures.createCanvas(key, 24, 24)!;
        const context = texture.getContext();
        const font = this.scene.cache.bitmapFont.get(MENU_TYPOGRAPHY.fontKey);
        const glyph = font.data.chars[63];
        // Bitmap fonts add glyph frames; use the full source image, not its first glyph frame.
        const frame = this.scene.textures.getFrame(font.texture, '__BASE');
        const width = glyph.width * 2;
        const height = glyph.height * 2;
        const x = Math.floor((24 - width - 1) / 2) + 2;
        const y = Math.floor((24 - height) / 2);
        context.imageSmoothingEnabled = false;
        // Actual menu glyph at an integer 2× scale; a one-pixel overprint adds weight.
        for (const offset of [0, 1])
          context.drawImage(
            frame.source.image as CanvasImageSource,
            frame.cutX + glyph.x,
            frame.cutY + glyph.y,
            glyph.width,
            glyph.height,
            x + offset,
            y,
            width,
            height,
          );
        texture.refresh();
      }
      this.chips[side].setTexture(key).setTint(chip === 'waiting' ? 0x888890 : 0xe4e4ea);
    } else if (hand) this.chips[side].setTexture(handKey).clearTint();
    else this.chips[side].setTexture(Tex.pickChips, chip);
    if (!hidden) this.chips[side].clearTint();
    const scale = hand || hidden ? 1 : 2;
    this.chips[side].setScale(scale);
    const width = this.chips[side].width * scale;
    const height = this.chips[side].height * scale;
    this.drawCircle(side, chip, MOVE_CIRCLE.radius, false);
    if (!entering || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const pop = { radius: 7 };
    const render = () => {
      const radius = Math.round(pop.radius);
      this.drawCircle(side, chip, radius, radius < 20);
      this.chips[side].setDisplaySize(Math.round((width * radius) / 25), Math.round((height * radius) / 25));
    };
    render();
    this.circlePops[side] = this.scene.tweens.add({
      targets: pop,
      radius: MOVE_CIRCLE.radius,
      duration: tuning.identity.circlePopMs,
      ease: 'Back.easeOut',
      onUpdate: render,
      onComplete: () => {
        this.chips[side].setScale(scale);
        this.drawCircle(side, chip, MOVE_CIRCLE.radius, false);
      },
    });
  }

  /** A small rim flash and size kick on each visible countdown beat. */
  tick(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (const side of SIDES) {
      const chip = this.chipValues[side];
      if (!chip || !this.circles[side].visible || this.circlePops[side]?.isPlaying()) continue;
      const image = this.chips[side];
      const scale = image.scaleX;
      const beat = { kick: 1 };
      const render = () => {
        const radius = MOVE_CIRCLE.radius + Math.round(beat.kick * tuning.identity.coinTickPx);
        this.drawCircle(side, chip, radius, beat.kick > 0.6);
        image.setScale((scale * radius) / MOVE_CIRCLE.radius);
      };
      render();
      this.circlePops[side] = this.scene.tweens.add({
        targets: beat,
        kick: 0,
        duration: tuning.identity.coinTickMs,
        ease: 'Cubic.easeOut',
        onUpdate: render,
        onComplete: () => {
          image.setScale(scale);
          this.drawCircle(side, chip, MOVE_CIRCLE.radius, false);
        },
      });
    }
  }

  private drawCircle(side: Side, chip: PickChip, radius: number, flash: boolean): void {
    const g = this.circles[side].clear();
    const x = MOVE_CIRCLE.x[side];
    const y = MOVE_CIRCLE.y;
    drawMoveCoin(g, chip, x, y, radius, flash);
  }

  hideChips(): void {
    for (const side of SIDES) this.setChip(side, null);
  }

  private chip(x: number): Phaser.GameObjects.Image {
    return this.scene.add
      .image(x, MOVE_CIRCLE.y, Tex.pickChips, 'waiting')
      .setOrigin(0.5)
      .setScale(2)
      .setVisible(false);
  }

  private stopBlink(): void {
    this.blink?.remove();
    this.blink = null;
  }

  private place(): void {
    const bob = Math.round(this.bob);
    for (const side of SIDES) {
      this.names[side].setY(TAG.nameY + bob);
      this.arrows[side].setY(TAG.arrowY + bob);
      this.chips[side].setY(MOVE_CIRCLE.y);
    }
  }
}
