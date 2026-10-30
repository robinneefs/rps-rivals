import type { Side } from '@rps/core';
import type Phaser from 'phaser';
import { MONITOR } from '../config/layout';
import { moveColors, palette, sideColors } from '../config/palette';
import { tuning } from '../config/tuning';
import { PixelText } from './PixelText';
import { MenuText } from './MenuStyle';

interface BarState {
  shown: number;
  trail: number;
  max: number;
}
const SIDES = ['p1', 'p2'] as const;

/** Classic life bars with compact name ribbons; the stage stays visible between HUD elements. */
export class HudView {
  private readonly gfx: Phaser.GameObjects.Graphics;
  private readonly bars: Record<Side, BarState>;
  private readonly timer: Phaser.GameObjects.Text;
  private readonly prompt: Phaser.GameObjects.Container;
  private readonly arrows: Phaser.GameObjects.Container;
  private readonly triangles: Phaser.GameObjects.Graphics[] = [];
  private waveStartedAt = 0;
  private readonly ready: Record<Side, PixelText>;
  private readonly timerFace: Phaser.GameObjects.Graphics;
  private timerMs: number | null = null;
  private timerSecond = -1;
  private readonly timerBeat = { kick: 0 };
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
      new PixelText(scene, x, 7, characters[side], {
        ...style,
        align,
        color: palette.text,
        shadow: 0x6b4525,
      });
      const playerX = side === 'p1' ? 4 : 188;
      // A coloured extrusion gives the small player labels an arcade-lettering lift.
      new PixelText(scene, playerX + 1, 34, names[side], {
        align,
        color: sideColors[side],
        outline: 0x08080e,
        edgePx: 1,
      });
      this.ready[side] = new PixelText(scene, playerX, 32, names[side], {
        ...style,
        align,
        color: side === 'p1' ? 0xffd5ca : 0xc4faff,
        outline: 0x101018,
        shadow: 0x08080e,
      });
    }
    this.timerFace = scene.add.graphics();
    // Draw a full-size typeface directly, rather than enlarging the tiny pixel glyphs.
    this.timer = scene.add
      .text(MONITOR.width / 2, 3, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#100d1c',
        strokeThickness: 1,
        resolution: 2,
      })
      .setOrigin(0.5, 0)
      .setVisible(false);
    this.prompt = scene.add.container(MONITOR.width / 2, 56).setVisible(false);
    // Match the round title's native menu font, gold face and one-pixel outline.
    for (const [dx, dy, color] of [
      [1, 2, palette.shadow],
      [-1, 0, palette.ink],
      [1, 0, palette.ink],
      [0, -1, palette.ink],
      [0, 1, palette.ink],
      [0, 0, palette.gold],
    ]) {
      const label = new MenuText(scene, dx!, dy!, 'PICK YOUR MOVE', color!);
      this.prompt.add(label.image);
    }
    this.arrows = scene.add.container(0, 0).setVisible(false);
    (['rock', 'paper', 'scissors'] as const).forEach((move, i) => {
      const x = MONITOR.width / 2 + (i - 1) * 32;
      const graphic = scene.add.graphics();
      this.arrows.add(graphic);
      this.triangles.push(graphic);
      const triangle = (dx: number, dy: number, color: number) => {
        graphic.fillStyle(color, 1);
        for (let row = 0; row < 6; row++) graphic.fillRect(x - 5 + row + dx, 76 + row + dy, 11 - row * 2, 1);
      };
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) if (dx || dy) triangle(dx, dy, palette.ink);
      triangle(0, 0, moveColors[move].main);
    });
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const wave = () => {
      if (!this.arrows.visible) return;
      const t = tuning.hud;
      const elapsed = Math.max(0, scene.game.loop.time - this.waveStartedAt);
      this.prompt.setAlpha(
        reducedMotion.matches || elapsed % t.pickPromptFlickerMs < t.pickPromptFlickerMs * 0.75 ? 1 : 0,
      );
      this.triangles.forEach((triangle, i) => {
        const phase = (elapsed - i * t.pickBounceStaggerMs + t.pickBounceCycleMs) % t.pickBounceCycleMs;
        const height = phase < t.pickBounceMs ? Math.sin((phase / t.pickBounceMs) * Math.PI) : 0;
        triangle.setY(reducedMotion.matches ? 0 : -Math.round(height * t.pickBouncePx));
      });
    };
    // Keep this cosmetic cue looping even when the review harness holds the match frame.
    scene.game.events.on('step', wave);
    scene.events.once('shutdown', () => scene.game.events.off('step', wave));
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
      if (!this.slamHide) {
        this.timer.setVisible(false);
        this.timerMs = null;
        this.timerSecond = -1;
        this.timerFace.clear();
        this.scene.tweens.killTweensOf(this.timerBeat);
      }
      return;
    }
    this.slamHide?.remove();
    this.slamHide = null;
    this.timerMs = Math.max(0, msLeft);
    const second = Math.ceil(this.timerMs / 1000);
    this.timer.setText(String(second)).setVisible(true);
    if (second !== this.timerSecond) {
      this.timerSecond = second;
      this.scene.tweens.killTweensOf(this.timerBeat);
      this.timerBeat.kick = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1;
      this.scene.tweens.add({
        targets: this.timerBeat,
        kick: 0,
        duration: second === 1 ? 260 : 200,
        ease: 'Back.easeOut',
        onUpdate: () => this.drawTimer(),
      });
    }
    this.drawTimer();
  }

  private drawTimer(): void {
    const g = this.timerFace.clear();
    if (this.timerMs === null) return;
    const x = MONITOR.width / 2;
    const y = 18;
    const kick = Math.max(0, this.timerBeat.kick);
    const color = this.timerSecond <= 1 ? 0xff493b : this.timerSecond === 2 ? 0xffad39 : 0xffdf70;
    // Fine continuous arcs replace the chunky square countdown segments.
    g.fillStyle(0x100d1c, 0.94).fillCircle(x, y, 15);
    g.lineStyle(1, 0x62536c, 0.8).strokeCircle(x, y, 15);
    const remaining = Math.max(0, Math.min(1, this.timerMs / 3000));
    if (remaining > 0) {
      g.lineStyle(2.5, color, 1);
      g.beginPath();
      g.arc(x, y, 16, -Math.PI / 2, -Math.PI / 2 + remaining * Math.PI * 2, false);
      g.strokePath();
      const angle = -Math.PI / 2 + remaining * Math.PI * 2;
      g.fillStyle(0xfff4d5).fillCircle(x + Math.cos(angle) * 16, y + Math.sin(angle) * 16, 1);
    }
    if (kick > 0) {
      g.lineStyle(1, color, kick * 0.6).strokeCircle(x, y, 17 + (1 - kick) * 5);
    }
    this.timer.setTint(kick > 0.65 ? 0xffffff : color).setY(3 - Math.round(kick * 2));
  }

  slamTimer(): void {
    this.slamHide?.remove();
    this.scene.tweens.killTweensOf(this.timerBeat);
    this.timerMs = 0;
    this.timerSecond = 0;
    this.timerBeat.kick = 0;
    this.timer.setText('0').setVisible(true);
    this.drawTimer();
    this.slamHide = this.scene.time.delayedCall(tuning.hud.timerSlamHoldMs, () => {
      this.timer.setVisible(false);
      this.timerMs = null;
      this.timerFace.clear();
      this.slamHide = null;
    });
  }

  setReady(side: Side, ready: boolean): void {
    this.ready[side].setColor(ready ? palette.white : side === 'p1' ? 0xffd5ca : 0xc4faff);
    this.draw();
  }

  showPrompt(on: boolean): void {
    if (on && !this.arrows.visible) {
      this.waveStartedAt = this.scene.game.loop.time;
      this.prompt.setAlpha(1);
      this.triangles.forEach((triangle) => triangle.setY(0));
    }
    this.prompt.setVisible(on);
    this.arrows.setVisible(on);
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
    // Pixel-stepped corners give the HUD softer forms without blurred edges.
    const rounded = (x: number, y: number, w: number, h: number, color: number, alpha = 1) => {
      g.fillStyle(color, alpha);
      g.fillRect(x + 2, y, w - 4, h);
      g.fillRect(x + 1, y + 1, w - 2, h - 2);
      g.fillRect(x, y + 2, w, h - 4);
    };
    for (const side of SIDES) {
      const rect = (px: number, y: number, w: number, h: number, color: number) =>
        g.fillStyle(color).fillRect(side === 'p1' ? px - 4 : MONITOR.width - px - w + 4, y, w, h);
      // Soft name capsules with a small player-colour inset.
      const nameX = side === 'p1' ? 1 : 116;
      rounded(nameX, 4, 75, 12, 0x25252d, 0.95);
      rect(10, 4, 62, 1, 0x777782);
      rect(6, 8, 2, 4, sideColors[side]);
      const x = side === 'p1' ? 2 : 116;
      const bar = this.bars[side];
      const width = (health: number) => Math.round((70 * Math.max(0, Math.min(bar.max, health))) / bar.max);
      const fill = width(bar.shown);
      const trail = width(bar.trail);
      const anchor = (w: number) => (side === 'p1' ? x + 2 : x + 72 - w);
      rounded(x - 1, 16, 76, 12, 0x101426);
      rounded(x, 17, 74, 10, 0x8b9db5);
      rounded(x + 1, 18, 72, 8, 0x18263d);
      if (trail > fill) g.fillStyle(palette.hpTrail).fillRect(anchor(trail), 19, trail, 6);
      const low = this.isLow(bar);
      const colour = this.flashing(side)
        ? palette.white
        : low
          ? this.pulse
            ? 0xffa078
            : palette.hpRed
          : 0xffd04a;
      g.fillStyle(colour).fillRect(anchor(fill), 19, fill, 6);
      g.fillStyle(low ? 0xffbf9b : 0xfff3a0).fillRect(anchor(fill), 19, fill, 1);
      g.fillStyle(low ? 0x9e3434 : 0xc67b1c).fillRect(anchor(fill), 24, fill, 1);
      for (let i = 0; i < this.roundsToWin; i++) {
        const px = side === 'p1' ? 71 - i * 9 : 121 + i * 9;
        const won = i < this.roundsWon[side];
        g.fillStyle(0x101426).fillRect(px - 3, 31, 7, 7);
        g.fillStyle(won ? 0xffdc72 : 0x35536e).fillRect(px - 2, 32, 5, 5);
        if (won) g.fillStyle(0xfff3bd).fillRect(px - 2, 32, 5, 1);
      }
    }
  }
}
