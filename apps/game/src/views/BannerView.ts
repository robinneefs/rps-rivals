import type Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { MONITOR } from '../config/layout';
import type { Side } from '@rps/core';
import { palette, sideColors } from '../config/palette';
import { tuning } from '../config/tuning';
import { PixelText } from './PixelText';
import { MenuText } from './MenuStyle';
import { createFightLettering } from './fightLettering';

/** Where each name sits on the VS card (centre x). */
const VS_X = { p1: 46, p2: MONITOR.width - 46 } as const;

/** Big centre text that slams in: "ROUND 1", "FIGHT!", the K.O. letters, and the "YOU VS RIVAL" card. */
export class BannerView {
  private readonly text: PixelText;
  private readonly fightText: Phaser.GameObjects.Graphics;
  private readonly roundText: Phaser.GameObjects.Container;
  private readonly roundLayers: MenuText[] = [];
  private readonly sub: PixelText;
  private readonly ko: Phaser.GameObjects.Image;
  private readonly vs: { p1: PixelText; p2: PixelText; mid: PixelText };
  private tween: Phaser.Tweens.Tween | null = null;
  private hideTimer: Phaser.Time.TimerEvent | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly y: number,
    private readonly titleY = y,
  ) {
    this.fightText = createFightLettering(scene).setPosition(MONITOR.width / 2, this.titleY);
    this.roundText = scene.add.container(MONITOR.width / 2, y).setVisible(false);
    for (const [dx, dy, color] of [
      [1, 2, palette.shadow],
      [-1, 0, palette.ink],
      [1, 0, palette.ink],
      [0, -1, palette.ink],
      [0, 1, palette.ink],
      [0, 0, palette.gold],
    ]) {
      const label = new MenuText(scene, dx!, dy!, '', color!);
      this.roundLayers.push(label);
      this.roundText.add(label.image);
    }
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

  show(text: string, opts: { color?: number; sub?: string; holdMs?: number; y?: number } = {}): void {
    const y = opts.y ?? this.titleY;
    this.tween?.stop();
    this.hideTimer?.remove();
    this.hide();
    this.text
      .setText(text)
      .setColor(opts.color ?? palette.gold)
      .setVisible(true)
      .setY(y - 40);
    this.sub.setText(opts.sub ?? '').setVisible(Boolean(opts.sub));
    const isRound = /^(ROUND \d+|FINAL ROUND)$/.test(text);
    const isFight = text === 'FIGHT!';
    const target = isFight ? this.fightText : isRound ? this.roundText : this.text;
    if (isFight) {
      this.text.setVisible(false);
      this.fightText.setVisible(true).setY(y - 40);
    }
    if (isRound) {
      this.text.setVisible(false);
      for (const label of this.roundLayers) label.setText(text);
      this.roundLayers[this.roundLayers.length - 1]!.setColor(opts.color ?? palette.gold);
      this.roundText.setVisible(true).setY(y - 40);
    }
    this.tween = this.scene.tweens.add({
      targets: target,
      y,
      duration: tuning.banner.slamMs,
      ease: 'Back.easeOut',
      onUpdate: () => target.setY(Math.round(target.y)),
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
    this.ko.setDisplaySize(152, (152 * this.ko.height) / this.ko.width);
    const koY = 42;
    this.ko.setVisible(true).setY(koY - 34);
    this.tween = this.scene.tweens.add({
      targets: this.ko,
      y: koY,
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
    this.fightText.setVisible(false);
    this.roundText.setVisible(false);
    this.sub.setVisible(false);
  }
}
