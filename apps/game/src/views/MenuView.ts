import type Phaser from 'phaser';
import type { SfxPlayer } from '../audio/sounds';
import type { Action, InputRouter } from '../input/InputRouter';
import type { MenuItem } from '../menus/MenuItem';
import { menuColors, menuLayout, menuRow, MenuText } from './MenuStyle';

/** Shared native menu rows, with keyboard, cabinet, mouse and touch input. */
export class MenuView {
  private selected: number;
  private locked = false;
  private readonly gfx: Phaser.GameObjects.Graphics;
  private readonly labels: MenuText[] = [];
  private readonly tags: MenuText[] = [];
  readonly bottom: number;
  private readonly x: number;
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly items: MenuItem[],
    private readonly y: number,
    input: InputRouter,
    private readonly sfx: SfxPlayer,
    private readonly width: number = menuLayout.rowWidth,
    private readonly gap = 6,
  ) {
    this.x = Math.round(menuLayout.centerX - width / 2);
    this.selected = Math.max(
      0,
      items.findIndex((item) => item.enabled),
    );
    this.bottom = y + items.length * 22 + (items.length - 1) * gap;
    this.gfx = scene.add.graphics();
    items.forEach((item, i) => {
      const iy = this.rowY(i);
      this.labels.push(new MenuText(scene, this.x + 15, iy + 6, item.label, menuColors.cream, 'left'));
      this.tags.push(
        new MenuText(scene, this.x + width - 10, iy + 6, item.tag ?? '', menuColors.cyan, 'right'),
      );
      scene.add
        .zone(this.x, iy, width, 24)
        .setOrigin(0)
        .setInteractive({ useHandCursor: item.enabled })
        .on('pointerover', (p: Phaser.Input.Pointer) => {
          if (p.wasTouch || this.locked || !item.enabled || this.selected === i) return;
          this.sfx.play('menuMove');
          this.selected = i;
          this.draw();
        })
        .on('pointerdown', () => {
          if (this.locked || !item.enabled) return;
          this.selected = i;
          this.draw();
          this.confirm();
        });
    });
    const off = input.on('action', this.onAction);
    scene.events.once('shutdown', off);
    this.draw();
  }
  get selectedId(): string | undefined {
    return this.items[this.selected]?.id;
  }
  setTag(id: string, tag: string): void {
    this.tags[this.items.findIndex((item) => item.id === id)]?.setText(tag);
  }
  lock(): void {
    this.locked = true;
  }
  private rowY(i: number): number {
    return this.y + i * (22 + this.gap);
  }
  private onAction = (a: Action): void => {
    if (this.locked || !this.scene.sys.isActive()) return;
    if (a.type === 'nav' && (a.dir === 'up' || a.dir === 'down')) {
      const step = a.dir === 'up' ? -1 : 1;
      for (let i = 1; i <= this.items.length; i++) {
        const next = (this.selected + i * step + this.items.length * 2) % this.items.length;
        if (this.items[next]?.enabled) {
          if (next !== this.selected) this.sfx.play('menuMove');
          this.selected = next;
          break;
        }
      }
      this.draw();
    } else if (a.type === 'confirm' || a.type === 'pick') this.confirm();
  };
  private confirm(): void {
    const item = this.items[this.selected];
    if (this.locked || !item?.enabled) return;
    this.sfx.play(item.id === 'back' ? 'menuBack' : 'menuSelect');
    item.onSelect?.();
  }
  private draw(): void {
    this.gfx.clear();
    this.items.forEach((item, i) => {
      const on = i === this.selected && item.enabled;
      menuRow(this.gfx, this.x, this.rowY(i), this.width, on);
      this.labels[i]?.setColor(!item.enabled ? 0x8460b3 : on ? menuColors.ink : menuColors.cream);
      this.tags[i]?.setColor(on ? menuColors.ink : menuColors.cyan);
    });
  }
}
