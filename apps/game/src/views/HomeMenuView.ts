import type Phaser from 'phaser';
import { HomeTex, type HomeLayout } from '../assets/homeArt';
import type { SfxPlayer } from '../audio/sounds';
import type { Action, InputRouter } from '../input/InputRouter';
import type { MenuItem } from '../menus/MenuItem';
import { menuColors } from './MenuStyle';

/** The action menu's native label atlas, with the same inputs/SFX as the other menus. */
export class HomeMenuView {
  private selected = 0;
  private readonly labels: Phaser.GameObjects.Image[] = [];
  private readonly plates: Phaser.GameObjects.Image[] = [];
  private readonly arrow: Phaser.GameObjects.Image;
  private entranceReady = true;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly items: MenuItem[],
    private readonly layout: HomeLayout,
    input: InputRouter,
    private readonly sfx: SfxPlayer,
    texture: string = HomeTex.labels,
    private readonly skipEntrance: () => void = () => {},
  ) {
    const online = items.findIndex((item) => item.id === 'online' && item.enabled);
    this.selected =
      online >= 0
        ? online
        : Math.max(
            0,
            items.findIndex((item) => item.enabled),
          );
    for (const selected of [false, true]) {
      const key = selected ? 'home-plate-selected' : 'home-plate-normal';
      if (scene.textures.exists(key)) continue;
      const g = scene.make.graphics({ x: 0, y: 0 });
      const color = selected ? menuColors.gold : menuColors.edge;
      g.fillStyle(color);
      g.fillPoints(
        [
          { x: 13, y: 0 },
          { x: 180, y: 0 },
          { x: 166, y: 26 },
          { x: 0, y: 26 },
        ],
        true,
      );
      g.fillStyle(selected ? 0x291b52 : menuColors.panel);
      g.fillPoints(
        [
          { x: 14, y: 1 },
          { x: 177, y: 1 },
          { x: 165, y: 25 },
          { x: 3, y: 25 },
        ],
        true,
      );
      g.fillStyle(color);
      for (let n = 0; n < 4; n++) g.fillRect(180 - n * 3, 3 + n * 4, 9, 2);
      // The glyphs occupy y+3..15: 26px plates give 7px padding on both sides.
      g.generateTexture(key, 192, 28);
      g.destroy();
    }
    items.forEach((item, i) => {
      const y = this.rowY(i);
      this.plates.push(scene.add.image(0, y - 4, 'home-plate-normal').setOrigin(0));
      const label = scene.add.image(layout.menu.x, y, texture, `${item.id}-normal`).setOrigin(0);
      if (!item.enabled) label.setTint(0x96767f).setAlpha(0.55);
      this.labels.push(label);
      const top = i === 0 ? y - 5 : Math.floor((this.rowY(i - 1) + y) / 2) + 8;
      const bottom = i === items.length - 1 ? 240 : Math.floor((y + this.rowY(i + 1)) / 2) + 8;
      const zone = scene.add
        .zone(0, top, 192, bottom - top)
        .setOrigin(0)
        .setInteractive({ useHandCursor: item.enabled });
      zone.on('pointerover', (p: Phaser.Input.Pointer) => {
        if (this.entranceReady && !p.wasTouch && item.enabled && this.selected !== i) {
          this.sfx.play('menuMove');
          this.selected = i;
          this.draw();
        }
      });
      zone.on('pointerdown', () => {
        if (item.enabled) {
          this.skipEntrance();
          this.selected = i;
          this.draw();
          this.confirm();
        }
      });
    });
    this.arrow = scene.add.image(0, 0, HomeTex.arrow).setOrigin(0);
    const off = input.on('action', this.onAction);
    scene.events.once('shutdown', off);
    this.draw();
  }

  private rowY(index: number): number {
    return 160 + index * 28;
  }

  private onAction = (action: Action): void => {
    if (!this.scene.sys.isActive()) return;
    if (action.type === 'nav' || action.type === 'confirm' || action.type === 'pick') this.skipEntrance();
    if (action.type === 'nav' && (action.dir === 'up' || action.dir === 'down')) {
      const step = action.dir === 'up' ? -1 : 1;
      for (let i = 1; i <= this.items.length; i++) {
        const next = (this.selected + step * i + this.items.length * 2) % this.items.length;
        if (this.items[next]?.enabled) {
          if (next !== this.selected) this.sfx.play('menuMove');
          this.selected = next;
          this.draw();
          break;
        }
      }
    } else if (action.type === 'confirm' || action.type === 'pick') this.confirm();
  };

  private confirm(): void {
    const item = this.items[this.selected];
    if (!item?.enabled) return;
    // SceneFlow owns the transition guard. A confirm during the opening wipe must not latch a lock.
    this.sfx.play('menuSelect');
    item.onSelect?.();
  }

  private draw(): void {
    this.plates.forEach((plate, i) =>
      plate.setTexture(i === this.selected ? 'home-plate-selected' : 'home-plate-normal'),
    );
    this.items.forEach((item, i) =>
      this.labels[i]!.setFrame(`${item.id}-${i === this.selected ? 'selected' : 'normal'}`),
    );
    this.syncEntranceCursor();
  }

  get entranceTargets(): { image: Phaser.GameObjects.Image; y: number; alpha: number }[] {
    return [
      ...this.plates.map((image, i) => ({
        image,
        y: this.rowY(i) - 4,
        alpha: this.items[i]!.enabled ? 1 : 0.55,
      })),
      ...this.labels.map((image, i) => ({
        image,
        y: this.rowY(i),
        alpha: this.items[i]!.enabled ? 1 : 0.55,
      })),
    ];
  }
  setEntranceReady(ready: boolean): void {
    this.entranceReady = ready;
  }
  syncEntranceCursor(): void {
    const label = this.labels[this.selected]!;
    const width = this.layout.menu.labelWidths?.[this.selected];
    const x =
      width === undefined ? this.layout.menu.arrowX : this.layout.menu.x + Math.floor((176 - width) / 2) - 14;
    this.arrow.setPosition(x, label.y + this.layout.menu.arrowOffsetY).setAlpha(label.alpha);
  }
}
