import type Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { MONITOR } from '../config/layout';
import type { Side } from '@rps/core';
import { palette, sideColors } from '../config/palette';
import { tuning } from '../config/tuning';
import { PixelText } from './PixelText';

/** Where each name sits on the VS card (centre x). */
const VS_X = { p1: 46, p2: MONITOR.width - 46 } as const;

/** Big centre text that slams in: "ROUND 1", "FIGHT!", the K.O. letters, and the "YOU VS RIVAL" card. */
export class BannerView {
  private readonly text: PixelText;
  private readonly sub: PixelText;
  private readonly ko: Phaser.GameObjects.Image;
  private readonly vs: { p1: PixelText; p2: PixelText; mid: PixelText };
  private tween: Phaser.Tweens.Tween | null = null;
  private hideTimer: Phaser.Time.TimerEvent | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly y: number,
  ) {
    this.text = new PixelText(scene, MONITOR.width / 2, y, '', {
      size: 2,
      color: palette.gold,
      align: 'center',
      outline: palette.ink,
      shadow: palette.shadow,
    }).setVisible(false);
    this.sub = new PixelText(scene, MONITOR.width / 2, y + 28, '', {
      color: palette.text,
      align: 'center',
      shadow: palette.ink,
    }).setVisible(false);
    const name = (side: Side) =>
      new PixelText(scene, VS_X[side], y + 4, '', {
        size: 2,
        color: sideColors[side],
        align: 'center',
        outline: palette.ink,
        shadow: palette.shadow,
        edgePx: 1,
      }).setVisible(false);
    this.vs = {
      p1: name('p1'),
      p2: name('p2'),
      mid: new PixelText(scene, MONITOR.width / 2, y, 'VS', {
        size: 2,
        color: palette.gold,
        align: 'center',
        outline: palette.ink,
        shadow: palette.shadow,
      }).setVisible(false),
    };
    this.ko = scene.add
      .image(MONITOR.width / 2, y, Tex.koLetters)
      .setOrigin(0.5, 0)
      .setVisible(false);
  }

  show(text: string, opts: { color?: number; sub?: string; holdMs?: number } = {}): void {
    this.tween?.stop();
    this.hideTimer?.remove();
    this.hide();
    this.text
      .setText(text)
      .setColor(opts.color ?? palette.gold)
      .setVisible(true)
      .setY(this.y - 40);
    this.sub.setText(opts.sub ?? '').setVisible(Boolean(opts.sub));
    this.tween = this.scene.tweens.add({
      targets: this.text,
      y: this.y,
      duration: tuning.banner.slamMs,
      ease: 'Back.easeOut',
      onUpdate: () => this.text.setY(Math.round(this.text.y)),
    });
    if (opts.holdMs !== Infinity)
      this.hideTimer = this.scene.time.delayedCall(
        tuning.banner.slamMs + (opts.holdMs ?? tuning.banner.holdMs),
        () => this.hide(),
      );
  }

  /** "K.O." in its own big fighting-game letters; it slams in like the other banners and stays up. */
  showKo(): void {
    this.tween?.stop();
    this.hideTimer?.remove();
    this.hide();
    this.ko.setVisible(true).setY(this.y - 40);
    this.tween = this.scene.tweens.add({
      targets: this.ko,
      y: this.y - 6,
      duration: tuning.banner.slamMs,
      ease: 'Back.easeOut',
      onUpdate: () => this.ko.setY(Math.round(this.ko.y)),
    });
  }

  /** Before the first round: each side's name slides in from its edge, "VS" slams in between them. */
  showVs(names: Record<Side, string>): void {
    this.tween?.stop();
    this.hideTimer?.remove();
    this.hide();
    for (const side of ['p1', 'p2'] as const) {
      const text = this.vs[side].setText(names[side]).setVisible(true);
      const slide = { x: side === 'p1' ? -60 : MONITOR.width + 60 };
      this.scene.tweens.add({
        targets: slide,
        x: VS_X[side],
        duration: tuning.identity.vsSlideMs,
        ease: 'Back.easeOut',
        onUpdate: () => text.setAnchorX(Math.round(slide.x)),
        onStart: () => text.setAnchorX(Math.round(slide.x)),
      });
    }
    this.vs.mid.setY(this.y - 40);
    this.tween = this.scene.tweens.add({
      targets: this.vs.mid,
      y: this.y,
      delay: tuning.identity.vsSlideMs / 2,
      duration: tuning.banner.slamMs,
      ease: 'Back.easeOut',
      onStart: () => this.vs.mid.setVisible(true),
      onUpdate: () => this.vs.mid.setY(Math.round(this.vs.mid.y)),
    });
  }

  hide(): void {
    for (const text of Object.values(this.vs)) {
      this.scene.tweens.killTweensOf(text);
      text.setVisible(false);
    }
    this.ko.setVisible(false);
    this.text.setVisible(false);
    this.sub.setVisible(false);
  }
}
