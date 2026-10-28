import type { Side } from '@rps/core';
import type Phaser from 'phaser';
import { MONITOR } from '../config/layout';
import { palette, sideColors } from '../config/palette';
import { tuning } from '../config/tuning';
import { PixelText } from './PixelText';

interface BarState {
  shown: number;
  trail: number;
  max: number;
}
const SIDES = ['p1', 'p2'] as const;

/** Live native-resolution HUD, with sky behind the labels and no persistent move legend. */
export class HudView {
  private readonly gfx: Phaser.GameObjects.Graphics;
  private readonly bars: Record<Side, BarState>;
  private readonly timer: PixelText;
  private readonly prompt: PixelText;
  private readonly arrows: PixelText;
  private readonly ready: Record<Side, PixelText>;
  private readonly flashUntil: Record<Side, number> = { p1: 0, p2: 0 };
  private roundsWon: Record<Side, number> = { p1: 0, p2: 0 };
  private roundsToWin = 2;
  private pulse = false;
  private slamHide: Phaser.Time.TimerEvent | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    names: Record<Side, string>,
    maxHealth: number | Record<Side, number>,
    characters: Record<Side, string> = { p1: 'TAIKO', p2: 'RIOT' },
  ) {
    const health = typeof maxHealth === 'number' ? { p1: maxHealth, p2: maxHealth } : maxHealth;
    this.bars = {
      p1: { shown: health.p1, trail: health.p1, max: health.p1 },
      p2: { shown: health.p2, trail: health.p2, max: health.p2 },
    };
    this.gfx = scene.add.graphics();
    const style = { outline: palette.ink, edgePx: 1 } as const;
    this.ready = {} as Record<Side, PixelText>;
    for (const side of SIDES) {
      const x = side === 'p1' ? 6 : 186;
      const align = side === 'p1' ? 'left' : 'right';
      new PixelText(scene, x, 5, characters[side], {
        ...style,
        align,
        color: palette.text,
      });
      this.ready[side] = new PixelText(scene, x, 33, names[side], {
        ...style,
        align,
        color: sideColors[side],
      });
    }
    this.timer = new PixelText(scene, MONITOR.width / 2, 6, '', {
      ...style,
      size: 3,
      align: 'center',
      color: palette.text,
    }).setVisible(false);
    this.prompt = new PixelText(scene, MONITOR.width / 2, 56, 'PICK YOUR MOVE', {
      ...style,
      align: 'center',
      color: palette.gold,
    }).setVisible(false);
    this.arrows = new PixelText(scene, MONITOR.width / 2, 70, '1 ROCK  2 PAPER  3 SCISSORS', {
      ...style,
      align: 'center',
      color: palette.text,
    }).setVisible(false);
    scene.time.addEvent({
      delay: tuning.hud.lowPulseMs,
      loop: true,
      callback: () => {
        this.pulse = !this.pulse;
        if (SIDES.some((side) => this.isLow(this.bars[side]))) this.draw();
      },
    });
    this.draw();
  }

  setRounds(roundsWon: Record<Side, number>, roundsToWin: number): void {
    this.roundsWon = { ...roundsWon };
    this.roundsToWin = roundsToWin;
    this.draw();
  }

  /** Jump straight to these values (new round). */
  resetHealth(health: Record<Side, number>): void {
    for (const side of ['p1', 'p2'] as const) {
      this.scene.tweens.killTweensOf(this.bars[side]);
      this.bars[side].shown = health[side];
      this.bars[side].trail = health[side];
    }
    this.draw();
  }

  /** Drain toward the health the session reported; a white trail follows. */
  setHealth(side: Side, health: number): void {
    const bar = this.bars[side];
    this.scene.tweens.killTweensOf(bar);
    this.scene.tweens.add({
      targets: bar,
      shown: health,
      duration: tuning.hud.drainMs,
      ease: 'Cubic.easeOut',
      onUpdate: () => this.draw(),
    });
    this.scene.tweens.add({
      targets: bar,
      trail: health,
      delay: tuning.hud.trailDelayMs + tuning.hud.drainMs / 2,
      duration: tuning.hud.drainMs,
      ease: 'Linear',
      onUpdate: () => this.draw(),
    });
  }

  setTimer(msLeft: number | null): void {
    if (msLeft === null) {
      if (!this.slamHide) this.timer.setVisible(false);
      return;
    }
    this.slamHide?.remove();
    this.slamHide = null;
    this.timer
      .setText(String(Math.ceil(msLeft / 1000)))
      .setVisible(true)
      .setY(6)
      .setColor(msLeft <= tuning.hud.timerRedMs ? palette.red : palette.text);
  }

  slamTimer(): void {
    this.slamHide?.remove();
    this.timer.setText('0').setColor(palette.red).setVisible(true).setY(6);
    this.slamHide = this.scene.time.delayedCall(tuning.hud.timerSlamHoldMs, () => {
      this.timer.setVisible(false);
      this.slamHide = null;
    });
  }

  setReady(side: Side, ready: boolean): void {
    this.ready[side].setColor(ready ? palette.white : sideColors[side]);
  }

  showPrompt(on: boolean, arrows = false): void {
    this.prompt.setVisible(on);
    this.arrows.setVisible(on && arrows);
  }

  /** The bar of the side that was just hit flashes white a few times, so the eye goes to it. */
  flashBar(side: Side): void {
    const t = tuning.hud;
    const ms = t.hitFlashes * t.hitFlashMs * 2;
    this.flashUntil[side] = this.scene.time.now + ms;
    this.scene.time.addEvent({
      delay: t.hitFlashMs,
      repeat: t.hitFlashes * 2,
      callback: () => this.draw(),
    });
  }

  /** On during the "on" half of each flash. */
  private flashing(side: Side): boolean {
    const now = this.scene.time.now;
    const left = this.flashUntil[side] - now;
    if (left <= 0) return false;
    return Math.floor(left / tuning.hud.hitFlashMs) % 2 === 1;
  }

  private isLow(bar: BarState): boolean {
    return bar.shown > 0 && bar.shown <= tuning.hud.lowHealth;
  }

  private draw(): void {
    const g = this.gfx.clear();
    for (const side of SIDES) {
      const x = side === 'p1' ? 6 : 112;
      const bar = this.bars[side];
      const width = (health: number) => Math.round((70 * Math.max(0, Math.min(bar.max, health))) / bar.max);
      const fill = width(bar.shown);
      const trail = width(bar.trail);
      const anchor = (w: number) => (side === 'p1' ? x + 2 : x + 72 - w);
      g.fillStyle(0x101426).fillRect(x - 1, 16, 76, 13);
      g.fillStyle(0xdbe9ec).fillRect(x, 17, 74, 11);
      g.fillStyle(0x18263d).fillRect(x + 1, 18, 72, 9);
      if (trail > fill) g.fillStyle(palette.hpTrail).fillRect(anchor(trail), 19, trail, 7);
      const low = this.isLow(bar);
      const colour = this.flashing(side)
        ? palette.white
        : low
          ? this.pulse
            ? 0xffa078
            : palette.hpRed
          : 0xffd04a;
      g.fillStyle(colour).fillRect(anchor(fill), 19, fill, 7);
      g.fillStyle(low ? 0xffbf9b : 0xfff3a0).fillRect(anchor(fill), 19, fill, 1);
      g.fillStyle(low ? 0x9e3434 : 0xc67b1c).fillRect(anchor(fill), 25, fill, 1);
      for (let i = 0; i < this.roundsToWin; i++) {
        const px = side === 'p1' ? 73 - i * 10 : 112 + i * 10;
        const won = i < this.roundsWon[side];
        g.fillStyle(0x101426).fillRect(px, 32, 7, 7);
        g.fillStyle(won ? 0xffdc72 : 0x35536e).fillRect(px + 1, 33, 5, 5);
        if (won) g.fillStyle(0xfff3bd).fillRect(px + 1, 33, 5, 1);
      }
    }
  }
}
