import type { Side } from '@rps/core';
import type Phaser from 'phaser';
import { Tex, type FighterAttack, type FighterPose } from '../assets/keys';
import { tuning } from '../config/tuning';
import { snap } from '../util/snap';
import { FIGHTER_GEOMETRY } from '../config/fighterGeometry';
import { MONITOR } from '../config/layout';

/** One fighter on the stage. Dumb: it shows the pose it is told to, and breathes while idle. */
export class FighterView {
  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly shadow: Phaser.GameObjects.Rectangle;
  private idle = true;
  private breath = 0;
  private frame: FighterPose = 'idle0';
  private offset = 0;
  private readonly geometry: (typeof FIGHTER_GEOMETRY)[string];

  constructor(
    scene: Phaser.Scene,
    readonly side: Side,
    private readonly homeX: number,
    floorY: number,
    texture: string = side === 'p1' ? Tex.fighterP1 : Tex.fighterP2,
  ) {
    this.geometry = FIGHTER_GEOMETRY[texture.replace(/-alternate$/, '')] ?? {
      originX: 64,
      originY: 124,
      shadowWidth: 40,
      kickOffset: 27,
      bounds: {},
    };
    this.shadow = scene.add
      .rectangle(homeX, floorY, this.geometry.shadowWidth, 4, 0x050014)
      .setOrigin(0.5, 0.5);
    this.sprite = scene.add.sprite(homeX, floorY + 1, texture, 'idle0');
    this.sprite.setName(`fighter-${side}`);
    // Shared foot origin; right-facing source art is mirrored for p2 on the pixel grid.
    this.sprite.setDisplayOrigin(this.geometry.originX, this.geometry.originY).setFlipX(side === 'p2');
    const timer = scene.time.addEvent({
      delay: tuning.idle.breatheEveryMs,
      loop: true,
      startAt: side === 'p2' ? tuning.idle.breatheEveryMs / 2 : 0,
      callback: () => {
        this.breath ^= 1;
        if (this.idle) this.pose(this.breath ? 'idle1' : 'idle0');
      },
    });
    scene.events.once('shutdown', () => timer.remove());
    this.place();
  }

  /** Facing direction: +1 looks right (p1), -1 looks left (p2). */
  get facing(): 1 | -1 {
    return this.side === 'p1' ? 1 : -1;
  }

  pose(frame: FighterPose): void {
    this.frame = frame;
    this.idle = frame === 'idle0' || frame === 'idle1';
    this.sprite.setFrame(frame).setDisplayOrigin(this.geometry.originX, this.geometry.originY);
    this.place();
  }

  attack(kind: FighterAttack): void {
    this.pose(kind === 'punch' ? 'rock' : 'kick');
  }

  block(): void {
    this.pose('paper');
  }

  toIdle(): void {
    this.pose(this.breath ? 'idle1' : 'idle0');
    this.setOffset(0);
  }

  /** Steps toward (+) or away from (-) the opponent by whole pixels. */
  setOffset(px: number): void {
    this.offset = px;
    this.place();
  }

  private place(): void {
    let x = snap(this.homeX + this.offset * this.facing);
    const bounds = this.geometry.bounds[this.frame];
    if (bounds) {
      // Keep the complete native silhouette in the monitor, including mirrored KO/hurt/kick.
      const left =
        this.side === 'p1'
          ? bounds.left - this.geometry.originX
          : this.geometry.originX - bounds.left - bounds.width;
      x = Math.max(-left, Math.min(MONITOR.width - left - bounds.width, x));
    }
    this.sprite.x = x;
    this.placeShadow();
  }

  private placeShadow(): void {
    // The kick's planted foot sits behind the common pose anchor.
    this.shadow.x = this.sprite.x - (this.frame === 'kick' ? this.geometry.kickOffset * this.facing : 0);
    this.shadow.setSize(this.frame === 'kick' ? 20 : this.geometry.shadowWidth, 4);
  }
}
