import type Phaser from 'phaser';
import type { Fighters, Side } from '@rps/core';
import { characterPresentation } from '../config/characters';
import { cacheAlternatePortrait } from '../assets/alternatePortraits';
import { tuning } from '../config/tuning';
import { playScreenEffect } from '../fx/screenEffects';
import { menuColors as C, MenuText } from './MenuStyle';

/** Runs on the persistent transition scene, covering selection and the prepared arena. */
export class VersusView {
  private readonly panels: Phaser.GameObjects.Container[] = [];
  private readonly center: Phaser.GameObjects.Container;
  private readonly textures: string[] = [];
  private readonly timers: Phaser.Time.TimerEvent[] = [];
  private readonly sparks: Phaser.GameObjects.Graphics;
  private impactFlash?: Phaser.GameObjects.Graphics;
  private clearCrt?: () => void;
  private readonly reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private disposed = false;
  private opening = false;

  constructor(
    private readonly scene: Phaser.Scene,
    matchup: { fighters: Fighters; me: Side; opponentName: string },
    stageName: string,
    covered: () => void,
    ready: () => void,
    impact: () => void,
    private readonly done: () => void,
  ) {
    for (const [i, side] of (['p1', 'p2'] as const).entries()) {
      const character = characterPresentation(matchup.fighters[side]);
      const key = `versus-panel-${side}`;
      this.textures.push(key);
      const texture = scene.textures.createCanvas(key, 192, 240)!;
      const ctx = texture.context;
      ctx.imageSmoothingEnabled = false;
      ctx.beginPath();
      const points = i === 0 ? [0, 0, 116, 0, 76, 240, 0, 240] : [116, 0, 192, 0, 192, 240, 76, 240];
      for (let p = 0; p < points.length; p += 2) ctx.lineTo(points[p]!, points[p + 1]!);
      ctx.closePath();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = i === 0 ? '#492448' : '#243c69';
      ctx.fillRect(0, 0, 192, 240);
      ctx.fillStyle = i === 0 ? '#ff789d' : '#69e7e8';
      for (let y = -60; y < 280; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(192, y - 50);
        ctx.lineTo(192, y - 46);
        ctx.lineTo(0, y + 4);
        ctx.fill();
      }
      const portrait =
        side === 'p2' && matchup.fighters.p1 === matchup.fighters.p2
          ? cacheAlternatePortrait(scene, character.id)
          : character.portrait;
      const frame = scene.textures.getFrame(portrait, 'rest');
      ctx.save();
      if (i === 0) {
        ctx.translate(108, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(
        frame.source.image as HTMLImageElement,
        frame.cutX,
        frame.cutY,
        192,
        240,
        i === 0 ? -68 : 16,
        24,
        192,
        240,
      );
      ctx.restore();
      ctx.fillStyle = '#19102f';
      ctx.fillRect(0, 0, 192, 28);
      ctx.fillRect(0, 186, 192, 54);
      ctx.restore();
      texture.refresh();
      const panel = scene.add.container(0, 0);
      panel.add(scene.add.image(0, 0, key).setOrigin(0));
      const owner = side === matchup.me ? 'YOU' : matchup.opponentName;
      panel.add(new MenuText(scene, i === 0 ? 49 : 149, 8, owner, i === 0 ? C.pink : C.cyan).image);
      panel.add(new MenuText(scene, i === 0 ? 43 : 145, 194, character.name, C.gold).image);
      this.panels.push(panel);
    }
    this.sparks = scene.add.graphics().setName('versus-seam-sparks');
    this.center = scene.add.container(0, 0).setVisible(false);
    const seam = scene.add.graphics().lineStyle(2, C.gold).lineBetween(116, 0, 76, 240);
    seam.fillStyle(C.ink).fillPoints(
      [
        { x: 97, y: 96 },
        { x: 125, y: 122 },
        { x: 95, y: 153 },
        { x: 67, y: 126 },
      ],
      true,
    );
    // Bespoke angular letters, centred on their visible bounds rather than bitmap-font spacing.
    const vs = scene.add.graphics();
    vs.fillStyle(C.gold).fillTriangle(61, 133, 78, 107, 72, 130);
    vs.fillStyle(C.pink).fillTriangle(130, 105, 114, 139, 120, 111);
    const letters = [
      [0, 0, 8, 0, 10, 19, 19, 0, 27, 0, 13, 31, 5, 31],
      [33, 0, 54, 0, 51, 7, 37, 7, 35, 12, 49, 12, 45, 31, 23, 31, 26, 24, 39, 24, 40, 19, 27, 19],
    ];
    for (const letter of letters) {
      const points = (dy: number) =>
        Array.from({ length: letter.length / 2 }, (_, i) => ({
          x: 69 + letter[i * 2]!,
          y: 104 + letter[i * 2 + 1]! + dy,
        }));
      vs.lineStyle(5, C.ink).fillStyle(0xcf5437).strokePoints(points(3), true).fillPoints(points(3), true);
      vs.lineStyle(3, C.ink).fillStyle(C.gold).strokePoints(points(0), true).fillPoints(points(0), true);
    }
    vs.lineStyle(1, C.cream).lineBetween(70, 104, 76, 104).lineBetween(103, 104, 121, 104);
    // The stage plate is drawn after the seam, so no line crosses its lettering.
    const stageLabel = new MenuText(scene, 96, 222, stageName.toUpperCase(), C.cream).image;
    const plateWidth = Math.min(180, Math.max(108, Math.ceil(stageLabel.width) + 20));
    const plateX = Math.round(96 - plateWidth / 2);
    const plate = scene.add.graphics();
    plate.fillStyle(C.ink).fillRect(plateX, 216, plateWidth, 22);
    plate.fillStyle(C.edge).fillRect(plateX, 216, plateWidth, 1);
    plate.fillStyle(C.gold).fillRect(plateX, 216, 3, 22);
    plate.fillStyle(C.cyan).fillRect(plateX + plateWidth - 3, 216, 3, 22);
    this.center.add([seam, vs, plate, stageLabel]);
    this.move(192);
    this.animate(tuning.versus.closeMs, (p) => this.move(192 * (1 - p ** 3)));
    this.timers.push(
      scene.time.delayedCall(tuning.versus.closeMs, () => {
        if (this.disposed) return;
        this.center.setVisible(true);
        if (!this.reduced) {
          impact();
          this.clearCrt = playScreenEffect(scene, 'heavyHit');
          this.burstSparks();
          const flash = scene.add.graphics().fillStyle(C.cream, 0.22).fillRect(0, 0, 192, 240);
          this.impactFlash = flash;
          this.animate(
            75,
            (p) => flash.setAlpha(1 - p),
            () => flash.destroy(),
          );
          this.animate(
            tuning.versus.impactMs,
            (progress) => {
              if (this.disposed) return;
              const y = Math.round(
                Math.cos(progress * Math.PI * 8) * tuning.versus.impactPx * (1 - progress),
              );
              this.panels.forEach((panel) => panel.setY(y));
              this.center.setY(y);
            },
            () => {
              if (this.disposed) return;
              this.panels.forEach((panel) => panel.setY(0));
              this.center.setY(0);
            },
          );
        }
        covered();
      }),
    );
    this.timers.push(
      scene.time.delayedCall(tuning.versus.closeMs + tuning.versus.holdMs, () => {
        if (!this.disposed) ready();
      }),
    );
  }

  /** Only the shared roundIntro event releases the panels; no countdown runs while waiting. */
  open(): void {
    if (this.disposed || this.opening) return;
    this.opening = true;
    this.center.setVisible(false);
    this.animate(
      tuning.versus.openMs,
      (p) => this.move(p === 0 ? 0 : 192 * 2 ** (10 * (p - 1))),
      () => this.destroy(),
    );
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.timers.forEach((t) => t.remove());
    this.panels.forEach((p) => p.destroy());
    this.center.destroy();
    this.sparks.destroy();
    this.impactFlash?.destroy();
    this.clearCrt?.();
    this.textures.forEach((key) => this.scene.textures.remove(key));
    this.done();
  }

  private move(offset: number): void {
    if (this.disposed) return;
    this.panels.forEach((panel, i) => {
      panel.setX(this.reduced ? 0 : Math.round((i === 0 ? -1 : 1) * offset));
      panel.setAlpha(this.reduced ? 1 - offset / 192 : 1);
    });
  }

  /** Use the same scene clock as the covered/ready gates, even across slow or skipped frames. */
  private animate(duration: number, draw: (progress: number) => void, done?: () => void): void {
    const started = this.scene.time.now;
    const step = () => {
      if (this.disposed) return;
      draw(Math.min(1, (this.scene.time.now - started) / duration));
    };
    const frames = this.scene.time.addEvent({ delay: 16, loop: true, callback: step });
    this.timers.push(
      frames,
      this.scene.time.delayedCall(duration, () => {
        frames.remove();
        if (this.disposed) return;
        draw(1);
        done?.();
      }),
    );
  }

  /** Ballistic native-pixel embers, like the foundry sparks, emitted along the collision seam. */
  private burstSparks(): void {
    const colors = [C.gold, C.gold, C.gold, C.cream, 0xf39739, C.pink];
    const particles = Array.from({ length: tuning.versus.sparkCount }, (_, i) => {
      const y = 32 + ((i * 37) % 170);
      return {
        x: 116 - y / 6,
        y,
        vx: (i % 2 === 0 ? -1 : 1) * (45 + ((i * 29) % 100)),
        vy: -85 + ((i * 43) % 135),
        life: 0.32 + ((i * 17) % 32) / 100,
        color: colors[i % colors.length]!,
      };
    });
    this.animate(
      tuning.versus.sparkMs,
      (progress) => {
        if (this.disposed) return;
        const age = (progress * tuning.versus.sparkMs) / 1000;
        this.sparks.clear();
        for (const p of particles) {
          if (age >= p.life) continue;
          const x = Math.round(p.x + p.vx * age);
          const y = Math.round(p.y + p.vy * age + 95 * age * age);
          // Keep the ownership labels and stage plate clear of the burst.
          if (y < 28 || y > 213) continue;
          const alpha = Math.min(1, (p.life - age) / 0.2);
          this.sparks.fillStyle(p.color, alpha).fillRect(x, y, 1, 2);
          this.sparks.fillStyle(C.gold, alpha * 0.35).fillRect(x - Math.sign(p.vx), y + 1, 1, 1);
        }
      },
      () => {
        if (!this.disposed) this.sparks.clear();
      },
    );
  }
}
