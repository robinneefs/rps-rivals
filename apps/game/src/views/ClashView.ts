import type { Move, ExchangeOutcome, Side } from '@rps/core';
import type Phaser from 'phaser';
import { drawMoveCoin } from './moveCoin';
import { Tex } from '../assets/keys';
import { MONITOR, STAGE } from '../config/layout';
import { moveColors } from '../config/palette';
import { tuning } from '../config/tuning';
import { snap } from '../util/snap';
import { MENU_TYPOGRAPHY } from '../config/menuTypography';

const SIDES = ['p1', 'p2'] as const;
/** Half a badge's width minus the overlap where the two touch at the collision. */
const CONTACT_PX = 24;

/**
 * Move coins wind up with particle trails, accelerate into a burst, and knock the loser away.
 * The director decides when each step plays.
 */
export class ClashView {
  private readonly badges: Record<Side, Phaser.GameObjects.Image>;
  private trails: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private effects: (Phaser.GameObjects.Particles.ParticleEmitter | Phaser.GameObjects.Graphics)[] = [];
  private readonly damage: Phaser.GameObjects.Container;
  private readonly damageLayers: Phaser.GameObjects.BitmapText[] = [];
  private moves: Record<Side, Move> = { p1: 'rock', p2: 'rock' };
  private readonly home: Record<Side, number>;
  private readonly centre = MONITOR.width / 2;
  /** Tweens on plain progress objects (the loser's flight, the damage fall), stopped by hide(). */
  private paths: Phaser.Tweens.Tween[] = [];
  private flights: Phaser.Tweens.Tween[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    const r = tuning.reveal;
    this.createCoinTextures();
    if (!scene.textures.exists('coin-spark-pixel')) {
      const pixel = scene.make.graphics({ x: 0, y: 0 });
      pixel.fillStyle(0xffffff).fillRect(0, 0, 3, 3);
      pixel.generateTexture('coin-spark-pixel', 3, 3);
      pixel.destroy();
    }
    this.home = { p1: STAGE.fighterX.p1 - r.badgeOutPx, p2: STAGE.fighterX.p2 + r.badgeOutPx };
    this.badges = {
      p1: scene.add.image(this.home.p1, r.badgeY, 'attack-coin-rock-normal').setVisible(false),
      p2: scene.add.image(this.home.p2, r.badgeY, 'attack-coin-rock-normal').setVisible(false),
    };
    this.damage = scene.add.container(0, 0).setScale(2).setDepth(10).setVisible(false);
    for (const [dx, dy, color] of [
      [1, 2, 0x6b4525],
      [-1, 0, 0x160c20],
      [1, 0, 0x160c20],
      [0, -1, 0x160c20],
      [0, 1, 0x160c20],
      [0, 0, 0xffffff],
    ]) {
      const layer = scene.add
        .bitmapText(dx!, dy!, MENU_TYPOGRAPHY.fontKey, '', MENU_TYPOGRAPHY.size)
        .setOrigin(0.5, 0)
        .setTint(color!);
      if (color === 0xffffff) layer.setTint(0xfff3a0, 0xfff3a0, 0xc67b1c, 0xc67b1c);
      this.damage.add(layer);
      this.damageLayers.push(layer);
    }
  }

  private createCoinTextures(): void {
    for (const move of ['rock', 'paper', 'scissors'] as const) {
      for (const flash of [false, true]) {
        const key = `attack-coin-${move}-${flash ? 'flash' : 'normal'}`;
        if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
        const face = this.scene.make.graphics({ x: 0, y: 0 });
        drawMoveCoin(face, move, 25, 25, 25, flash);
        const handKey = `move-hand-${move}`;
        const hasHand = this.scene.textures.exists(handKey);
        const hand = this.scene.make.image({
          x: 25,
          y: 25,
          key: hasHand ? handKey : Tex.pickChips,
          frame: hasHand ? undefined : move,
          add: false,
        });
        if (!hasHand) hand.setScale(2);
        const texture = this.scene.add.renderTexture(0, 0, 51, 51).setVisible(false);
        texture.draw(face).draw(hand).saveTexture(key);
        face.destroy();
        hand.destroy();
        texture.destroy();
      }
    }
  }

  /** The badges pop in beside the fighters. */
  present(picks: Record<Side, Move>): void {
    const r = tuning.reveal;
    this.hide();
    this.moves = picks;
    for (const side of SIDES) {
      const badge = this.badges[side]
        .setTexture(`attack-coin-${picks[side]}-flash`)
        .setPosition(this.home[side], r.badgeY - r.badgePopFromPx)
        .setAngle(0)
        .setScale(1)
        .setDepth(6)
        .setVisible(true);
      this.tween(badge, { y: r.badgeY }, r.badgePopMs, 'Back.easeOut');
      this.scene.time.delayedCall(r.flashMs, () => badge.setTexture(`attack-coin-${picks[side]}-normal`));
    }
  }

  /** Pull back and aim inward, then accelerate hard into contact within the same impact window. */
  fly(ms: number): void {
    const r = tuning.reveal;
    const windupMs = Math.min(r.coinWindupMs, ms * 0.6);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const side of SIDES) {
      const direction = side === 'p1' ? 1 : -1;
      const x = this.centre - direction * CONTACT_PX;
      const badge = this.badges[side];
      if (reduced) {
        badge.setAngle(direction * r.coinTurnDegrees);
        this.tween(badge, { x, y: r.clashY }, ms, 'Cubic.easeIn');
        continue;
      }
      this.startTrail(side);
      this.scene.tweens.add({
        targets: badge,
        x: badge.x - direction * r.coinPullbackPx,
        angle: direction * (r.coinTurnDegrees + r.coinWindupTiltDegrees),
        scaleX: 1.12,
        scaleY: 0.92,
        duration: windupMs,
        ease: 'Sine.easeOut',
        onComplete: () => {
          badge.setAngle(direction * r.coinTurnDegrees);
          const startX = badge.x;
          const startY = badge.y;
          const launch = { t: 0 };
          this.flights.push(
            this.scene.tweens.add({
              targets: launch,
              t: 1,
              duration: ms - windupMs,
              ease: 'Quart.easeIn',
              onUpdate: () => {
                const t = launch.t;
                badge.setPosition(
                  snap(startX + (x - startX) * t),
                  snap(startY + (r.clashY - startY) * t - Math.sin(Math.PI * t) * r.coinArcPx),
                );
                badge.setAngle(direction * r.coinTurnDegrees);
                badge.setScale(1.12 + 0.08 * t, 0.92 - 0.04 * t);
              },
            }),
          );
        },
      });
    }
  }

  private startTrail(side: Side): void {
    const direction = side === 'p1' ? 1 : -1;
    const color = moveColors[this.moves[side]].main;
    const trail = this.scene.add
      .particles(0, 0, 'coin-spark-pixel', {
        lifespan: tuning.reveal.coinTrailLifeMs,
        frequency: tuning.reveal.coinTrailFrequencyMs,
        quantity: 9,
        speedX: { min: -direction * 75 - 45, max: -direction * 75 + 45 },
        speedY: { min: -60, max: 60 },
        scale: { start: 3.2, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: [color, color, 0xfff1ce],
        follow: this.badges[side],
        followOffset: { x: -direction * 18, y: 0 },
      })
      .setDepth(5);
    this.trails.push(trail);
    this.effects.push(trail);
  }

  private impactBurst(): void {
    const r = tuning.reveal;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const colors = [0xffffff, 0xffefae, moveColors[this.moves.p1].main, moveColors[this.moves.p2].main];
    const sparks = this.scene.add
      .particles(this.centre, r.clashY, 'coin-spark-pixel', {
        emitting: false,
        lifespan: reduced ? 180 : r.coinImpactLifeMs,
        speed: { min: 45, max: reduced ? 65 : 300 },
        angle: { min: 0, max: 360 },
        gravityY: 75,
        scale: { start: reduced ? 1.7 : 4, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: colors,
      })
      .setDepth(8);
    sparks.explode(reduced ? 8 : r.coinImpactParticles);
    this.effects.push(sparks);
    if (reduced) return;
    const ring = this.scene.add.graphics().setDepth(9);
    this.effects.push(ring);
    const wave = { t: 0 };
    this.paths.push(
      this.scene.tweens.add({
        targets: wave,
        t: 1,
        duration: r.coinShockwaveMs,
        ease: 'Quad.easeOut',
        onUpdate: () => {
          const radius = Math.round(5 + wave.t * 76);
          ring.clear().lineStyle(wave.t < 0.3 ? 7 : 3, 0xfff4d7, 1 - wave.t);
          ring.strokeCircle(this.centre, r.clashY, radius);
          ring.lineStyle(3, 0xff9c35, (1 - wave.t) * 0.85);
          ring.strokeCircle(this.centre, r.clashY, Math.round(radius * 0.7));
          if (wave.t < 0.45) {
            ring.fillStyle(0xffffff, 1 - wave.t / 0.45);
            ring.fillRect(this.centre - 5, r.clashY - 40, 10, 80);
            ring.fillRect(this.centre - 48, r.clashY - 5, 96, 10);
          }
        },
        onComplete: () => ring.clear(),
      }),
    );
  }

  /** The collision: a white flash, then the loser is knocked away (or both bounce on a tie). */
  collide(outcome: ExchangeOutcome): void {
    const r = tuning.reveal;
    this.flights.forEach((flight) => flight.stop());
    this.flights = [];
    this.trails.forEach((trail) => trail.stop());
    this.impactBurst();
    for (const side of SIDES) {
      this.scene.tweens.killTweensOf(this.badges[side]);
      const badge = this.badges[side].setScale(1).setAngle((side === 'p1' ? 1 : -1) * r.coinTurnDegrees);
      badge.setTexture(`attack-coin-${this.moves[side]}-flash`);
      this.scene.time.delayedCall(r.flashMs, () =>
        badge.setTexture(`attack-coin-${this.moves[side]}-normal`),
      );
    }
    if (outcome.kind === 'tie') {
      for (const side of SIDES) {
        const out = side === 'p1' ? -1 : 1;
        this.tween(
          this.badges[side],
          { x: this.badges[side].x + out * r.tieBouncePx },
          r.tieBounceMs,
          'Quad.easeOut',
        );
      }
      return;
    }
    const winner = this.badges[outcome.winner];
    const loser = this.badges[outcome.loser];
    this.tween(winner, { x: this.centre }, r.tieBounceMs, 'Quad.easeOut');
    // knocked back towards its own side and up off the screen, turning in quarter steps
    const out = outcome.loser === 'p1' ? -1 : 1;
    const startX = loser.x;
    const startY = loser.y;
    const fly = { t: 0 };
    this.paths.push(
      this.scene.tweens.add({
        targets: fly,
        t: 1,
        duration: r.loserFlyMs,
        ease: 'Linear',
        onUpdate: () => {
          const t = fly.t;
          loser.setPosition(snap(startX + out * 140 * t), snap(startY - 70 * t + 90 * t * t));
          loser.setAngle(out * 90 * Math.floor((t * r.loserFlyMs) / r.loserSpinMs));
        },
        onComplete: () => loser.setVisible(false),
      }),
    );
  }

  /** Menu-sized damage fades in above the fighter and drifts gently downward. */
  showDamage(loser: Side, amount: number): void {
    const r = tuning.reveal;
    const y = STAGE.floorY - r.damageAboveFloorPx;
    for (const layer of this.damageLayers) layer.setText(`-${amount}`);
    this.damage
      .setPosition(STAGE.fighterX[loser] + (loser === 'p1' ? -10 : 10), y)
      .setAlpha(0)
      .setVisible(true);
    const drop = { t: 0 };
    this.paths.push(
      this.scene.tweens.add({
        targets: drop,
        t: 1,
        duration: r.damageFallMs,
        ease: 'Linear',
        onUpdate: () => {
          // Short downward drift: fade in at the top, hold, then soften away.
          const t = drop.t;
          this.damage.setY(snap(y + r.damageFallPx * t));
          this.damage.setAlpha(t < 0.18 ? t / 0.18 : t > 0.65 ? (1 - t) / 0.35 : 1);
        },
      }),
    );
  }

  hide(): void {
    this.flights.forEach((flight) => flight.stop());
    this.flights = [];
    this.paths.forEach((t) => t.stop());
    this.paths = [];
    this.effects.forEach((effect) => effect.destroy());
    this.effects = [];
    this.trails = [];
    for (const side of SIDES) {
      this.scene.tweens.killTweensOf(this.badges[side]);
      this.badges[side].setVisible(false).setAngle(0).setScale(1);
    }
    this.damage.setVisible(false);
  }

  private tween(
    target: { x: number; y: number },
    to: { x?: number; y?: number },
    ms: number,
    ease: string,
    onStep?: () => void,
  ): void {
    const obj = target as Phaser.GameObjects.Components.Transform;
    this.scene.tweens.add({
      targets: obj,
      ...to,
      duration: ms,
      ease,
      onUpdate: () => {
        if (to.x !== undefined) obj.x = snap(obj.x);
        if (to.y !== undefined) obj.y = snap(obj.y);
        onStep?.();
      },
    });
  }
}
