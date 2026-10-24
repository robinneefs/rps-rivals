import type { Side } from '@rps/core';
import type Phaser from 'phaser';
import { GLYPH } from '../assets/glyphs';
import type { FontSize } from '../assets/keys';
import { MONITOR } from '../config/layout';
import { palette, sideColors } from '../config/palette';
import { tuning } from '../config/tuning';
import { lighten } from '../assets/placeholders/icons';
import { shade } from '../assets/placeholders/PixelBuffer';
import { frameRect } from '../util/gfx';
import { PixelText } from './PixelText';

const BAR = { y: 6, w: 116, h: 12, inset: 6 } as const;
const PIP = { y: 23, size: 5, gap: 3 } as const;
/** Where the timer's first second is centred; later seconds drift down from here. */
const TIMER = { x: MONITOR.width / 2, y: 15 } as const;
const MAX_FONT = 7;
/** "PICK YOUR MOVE" sits on the floor under the fighters, the arrows to the buttons below it. */
const PROMPT = { y: 326, arrowsY: 343 } as const;

interface BarState {
  shown: number; // what the bar shows now (animates toward the target)
  trail: number; // white trail that follows behind after a short delay
  max: number;
}

/**
 * Health bars, round pips, timer, names, "READY" markers and the pick prompt. Names, bar frames and
 * pips are in each side's colour. Shows what it's told.
 */
const SIDES = ['p1', 'p2'] as const;

export class HudView {
  private readonly gfx: Phaser.GameObjects.Graphics;
  /** The timer: one text per font size inside a box that moves, shakes and tilts as a whole. */
  private readonly timerBox: Phaser.GameObjects.Container;
  private readonly timerTexts = new Map<FontSize, PixelText>();
  private readonly timerSlam: PixelText;
  private startSecs = 0;
  private lastSecs = 0;
  private timerSize: FontSize = 4;
  private popUntil = 0;
  private boxY: number = TIMER.y;
  private slamHide: Phaser.Time.TimerEvent | null = null;
  private readonly prompt: PixelText;
  private readonly arrows: PixelText;
  /** While above scene time, that side's bar flashes white (it was just hit). */
  private readonly flashUntil: Record<Side, number> = { p1: 0, p2: 0 };
  private readonly ready: Record<Side, PixelText>;
  private readonly bars: Record<Side, BarState>;
  private roundsWon: Record<Side, number> = { p1: 0, p2: 0 };
  private roundsToWin = 2;
  /** Flips every lowPulseMs: a bar at low health glows brighter and its frame turns red. */
  private pulse = false;

  constructor(
    private readonly scene: Phaser.Scene,
    names: Record<Side, string>,
    maxHealth: number,
  ) {
    this.bars = {
      p1: { shown: maxHealth, trail: maxHealth, max: maxHealth },
      p2: { shown: maxHealth, trail: maxHealth, max: maxHealth },
    };
    this.gfx = scene.add.graphics();
    scene.time.addEvent({
      delay: tuning.hud.lowPulseMs,
      loop: true,
      callback: () => {
        this.pulse = !this.pulse;
        if (SIDES.some((s) => this.isLow(this.bars[s]))) this.draw();
      },
    });
    // the timer box sits on the timer's centre; each text is centred on the box, so the box can
    // move, shake and tilt the digits around their middle
    this.timerBox = scene.add.container(TIMER.x, TIMER.y);
    const big = { align: 'center', outline: palette.ink, shadow: palette.shadow, edgePx: 2 } as const;
    for (let size = 3; size <= MAX_FONT; size++) {
      const s = size as FontSize;
      const text = new PixelText(scene, 0, -(GLYPH.height * s) / 2, '', {
        ...big,
        size: s,
        color: palette.text,
      });
      this.timerBox.add(text.setVisible(false));
      this.timerTexts.set(s, text);
    }
    this.timerSlam = new PixelText(scene, 0, -(GLYPH.height * MAX_FONT) / 2, '0', {
      ...big,
      size: MAX_FONT,
      color: palette.red,
    });
    this.timerBox.add(this.timerSlam.setVisible(false));
    new PixelText(scene, BAR.inset, PIP.y, names.p1, { color: sideColors.p1, shadow: palette.ink });
    new PixelText(scene, MONITOR.width - BAR.inset, PIP.y, names.p2, {
      color: sideColors.p2,
      align: 'right',
      shadow: palette.ink,
    });
    this.ready = {
      p1: new PixelText(scene, BAR.inset, PIP.y + 10, 'READY', {
        color: palette.cyan,
        shadow: palette.ink,
      }).setVisible(false),
      p2: new PixelText(scene, MONITOR.width - BAR.inset, PIP.y + 10, 'READY', {
        color: palette.cyan,
        align: 'right',
        shadow: palette.ink,
      }).setVisible(false),
    };
    this.prompt = new PixelText(scene, MONITOR.width / 2, PROMPT.y, 'PICK YOUR MOVE', {
      size: 2,
      color: palette.text,
      align: 'center',
      outline: palette.ink,
      shadow: palette.shadow,
      edgePx: 1,
    }).setVisible(false);
    this.arrows = new PixelText(scene, MONITOR.width / 2, PROMPT.arrowsY, '▼ PRESS A BUTTON ▼', {
      color: palette.gold,
      align: 'center',
      outline: palette.ink,
    }).setVisible(false);
    // the arrows bob toward the buttons
    scene.time.addEvent({
      delay: tuning.identity.bobMs,
      loop: true,
      callback: () =>
        this.arrows.setY(
          this.arrows.y === PROMPT.arrowsY ? PROMPT.arrowsY + tuning.identity.bobPx : PROMPT.arrowsY,
        ),
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

  /**
   * Seconds left, or null to hide the timer. Called every frame while picking. Each new second is
   * one font size bigger and a few pixels further down (towards the middle of the screen), and pops
   * in one size bigger still. In the last seconds the timer turns gold, then red, and shakes and
   * tilts from side to side.
   */
  setTimer(msLeft: number | null): void {
    const t = tuning.hud;
    if (msLeft === null) {
      this.timerTexts.forEach((text) => text.setVisible(false));
      this.timerBox.setRotation(0);
      this.lastSecs = 0;
      return;
    }
    const now = this.scene.time.now;
    const secs = Math.ceil(msLeft / 1000);
    if (secs !== this.lastSecs) {
      if (this.lastSecs === 0) this.startSecs = secs;
      this.lastSecs = secs;
      const step = Math.max(0, this.startSecs - secs);
      this.timerSize = clampSize(t.timerBaseSize + step * t.timerGrowPerTick);
      this.popUntil = now + t.timerPopMs;
      this.timerTexts.forEach((text) => text.setText(String(secs)));
      // glide to this second's spot
      const target = TIMER.y + step * t.timerDriftPx;
      this.scene.tweens.killTweensOf(this);
      this.scene.tweens.add({
        targets: this,
        boxY: target,
        duration: t.timerPopMs * 2,
        ease: 'Back.easeOut',
      });
    }
    const popping = now < this.popUntil;
    const shown = popping ? clampSize(this.timerSize + 1) : this.timerSize;
    const color =
      msLeft <= t.timerRedMs ? palette.red : msLeft <= t.timerWarnMs ? palette.gold : palette.text;
    this.timerTexts.forEach((text, size) =>
      text.setVisible(size === shown).setColor(popping ? palette.white : color),
    );
    // whole-pixel jitter and a side-to-side tilt, stronger in the last second
    const hard = msLeft <= 1000;
    const amp = hard ? t.timerShakePx * 2 : msLeft <= t.timerRedMs ? t.timerShakePx : 0;
    const step = Math.floor(now / Math.max(1, t.timerShakeEveryMs));
    const jitter = (k: number) => (amp ? ((step * 7 + k * 13) % (amp * 2 + 1)) - amp : 0);
    const tilt = amp ? (step % 2 ? 1 : -1) * t.timerTiltDeg * (hard ? 1.5 : 1) : 0;
    this.timerBox.setPosition(TIMER.x + jitter(1), Math.round(this.boxY) + jitter(2)).setAngle(tilt);
  }

  /** Time ran out: a big red 0 slams down where the last second was and holds for a moment. */
  slamTimer(): void {
    const t = tuning.hud;
    this.slamHide?.remove();
    this.timerTexts.forEach((text) => text.setVisible(false));
    this.timerBox.setAngle(0).setPosition(TIMER.x, Math.round(this.boxY));
    const restY = -(GLYPH.height * MAX_FONT) / 2;
    this.timerSlam.setVisible(true).setY(restY - t.timerSlamDropPx);
    this.scene.tweens.add({
      targets: this.timerSlam,
      y: restY,
      duration: t.timerSlamMs,
      ease: 'Back.easeOut',
      onUpdate: () => this.timerSlam.setY(Math.round(this.timerSlam.y)),
    });
    this.slamHide = this.scene.time.delayedCall(t.timerSlamMs + t.timerSlamHoldMs, () => {
      this.timerSlam.setVisible(false);
      this.boxY = TIMER.y;
    });
  }

  setReady(side: Side, ready: boolean): void {
    this.ready[side].setVisible(ready);
  }

  /** The pick prompt; `arrows` adds the line pointing down at the buttons (the first few picks). */
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
    for (const side of ['p1', 'p2'] as const) {
      const bar = this.bars[side];
      const x = side === 'p1' ? BAR.inset : MONITOR.width - BAR.inset - BAR.w;
      const inner = BAR.w - 2;
      const fillW = Math.round((inner * Math.max(0, bar.shown)) / bar.max);
      const trailW = Math.round((inner * Math.max(0, bar.trail)) / bar.max);
      const y = BAR.y + 1;
      const h = BAR.h - 2;
      g.fillStyle(palette.ink).fillRect(x - 1, BAR.y - 1, BAR.w + 2, BAR.h + 2);
      g.fillStyle(palette.hpBack).fillRect(x + 1, y, inner, h);
      g.fillStyle(shade(palette.hpBack, 0.6)).fillRect(x + 1, y, inner, 2); // the empty bar's inner shadow
      const low = this.isLow(bar);
      const color = low
        ? this.pulse
          ? lighten(palette.hpRed, 0.35)
          : palette.hpRed
        : bar.shown <= bar.max / 2
          ? palette.hpYellow
          : palette.hpGreen;
      // p1's bar is anchored on the left edge, p2's on the right: both drain toward the outside
      const anchor = (w: number) => (side === 'p1' ? x + 1 : x + 1 + inner - w);
      if (trailW > fillW) g.fillStyle(palette.hpTrail).fillRect(anchor(trailW), y, trailW, h);
      if (fillW > 0) {
        // a rounded, lit tube: shine on top, the colour, then two darker bands underneath
        const fx = anchor(fillW);
        g.fillStyle(color).fillRect(fx, y, fillW, h);
        g.fillStyle(lighten(color, 0.45)).fillRect(fx, y + 1, fillW, 2);
        g.fillStyle(0xffffff).fillRect(fx, y + 1, fillW, 1);
        g.fillStyle(shade(color, 0.78)).fillRect(fx, y + h - 3, fillW, 2);
        g.fillStyle(shade(color, 0.55)).fillRect(fx, y + h - 1, fillW, 1);
        // the leading edge glints
        g.fillStyle(lighten(color, 0.7)).fillRect(side === 'p1' ? fx + fillW - 1 : fx, y + 1, 1, h - 2);
      }
      // segment notches every tenth of the bar, over fill and background alike
      for (let i = 1; i < 10; i++) {
        const nx = x + 1 + Math.round((inner * i) / 10);
        g.fillStyle(palette.ink, 0.35).fillRect(nx, y + 3, 1, h - 5);
      }
      const flash = this.flashing(side);
      if (flash) g.fillStyle(palette.white).fillRect(x + 1, y, inner, h);
      const frame = flash || (low && this.pulse) ? palette.white : sideColors[side];
      frameRect(g, x, BAR.y, BAR.w, BAR.h, frame);
      g.fillStyle(lighten(frame, 0.5)).fillRect(x + 1, BAR.y, BAR.w - 2, 1); // frame highlight

      // round pips next to the name, toward the centre
      for (let i = 0; i < this.roundsToWin; i++) {
        const px =
          side === 'p1'
            ? BAR.inset + BAR.w - (i + 1) * (PIP.size + PIP.gap) + PIP.gap
            : MONITOR.width - BAR.inset - BAR.w + i * (PIP.size + PIP.gap);
        const won = i < this.roundsWon[side];
        g.fillStyle(palette.ink).fillRect(px - 1, PIP.y - 1, PIP.size + 2, PIP.size + 2);
        g.fillStyle(won ? sideColors[side] : shade(sideColors[side], 0.3)).fillRect(
          px,
          PIP.y,
          PIP.size,
          PIP.size,
        );
        if (won) g.fillStyle(lighten(sideColors[side], 0.6)).fillRect(px, PIP.y, PIP.size, 1);
      }
    }
  }
}

const clampSize = (n: number): FontSize => Math.max(1, Math.min(MAX_FONT, Math.round(n))) as FontSize;
