import type Phaser from 'phaser';
import type { SfxPlayer } from '../audio/sounds';
import { MENU_TYPOGRAPHY } from '../config/menuTypography';
import type { Action, InputRouter } from '../input/InputRouter';
import type { MenuItem } from '../menus/MenuItem';
import type { VolumeId } from '../menus/optionsMenu';
import { VOLUME_MAX } from '../platform/settings';
import { menuColors as C, menuLayout, menuRow } from './MenuStyle';

/** Native-pixel settings panel. Keeps the shared menu actions and cabinet input contract. */
export class OptionsMenuView {
  private selected = 0;
  private locked = false;
  private readonly gfx: Phaser.GameObjects.Graphics;
  private readonly labels: Phaser.GameObjects.BitmapText[] = [];
  private readonly tags: Phaser.GameObjects.BitmapText[] = [];
  private readonly values = new Map<string, string>();
  private dragging?: { pointerId: number; id: VolumeId };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly items: MenuItem[],
    input: InputRouter,
    private readonly sfx: SfxPlayer,
    private readonly setVolume: (id: VolumeId, level: number) => void,
  ) {
    this.gfx = scene.add.graphics();
    items.forEach((item, i) => {
      const y = this.rowY(i);
      // M6X11 capitals occupy 11 native pixels within a 16px line box.
      const textY = y + Math.round((22 - MENU_TYPOGRAPHY.capitalHeight) / 2);
      this.labels.push(this.text(menuLayout.rowX + 15, textY, item.label));
      this.tags.push(this.text(166, textY, '').setOrigin(1, 0));
      this.values.set(item.id, item.tag ?? '');
      scene.add
        .zone(menuLayout.rowX, y, menuLayout.rowWidth, 23)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', (p: Phaser.Input.Pointer) => {
          if (!p.wasTouch && !this.locked && !this.dragging && this.selected !== i) {
            this.sfx.play('menuMove');
            this.selected = i;
            this.draw();
          }
        })
        .on('pointerdown', (p: Phaser.Input.Pointer) => {
          if (this.locked || this.dragging) return;
          this.selected = i;
          this.draw();
          // The entire right-hand area is a touch target, beyond the visible meter.
          if ((item.id === 'music' || item.id === 'sfx') && p.worldX >= 99) {
            this.dragging = { pointerId: p.id, id: item.id };
            this.dragVolume(p);
            return;
          }
          this.confirm();
        });
    });
    const off = input.on('action', this.onAction);
    scene.input.on('pointermove', this.dragVolume);
    scene.input.on('pointerup', this.endDrag);
    scene.input.on('pointerupoutside', this.endDrag);
    scene.events.once('shutdown', () => {
      off();
      this.dragging = undefined;
      scene.input.off('pointermove', this.dragVolume);
      scene.input.off('pointerup', this.endDrag);
      scene.input.off('pointerupoutside', this.endDrag);
    });
    this.draw();
  }

  private text(x: number, y: number, label: string): Phaser.GameObjects.BitmapText {
    return this.scene.add
      .bitmapText(x, y, MENU_TYPOGRAPHY.fontKey, label, MENU_TYPOGRAPHY.size)
      .setTint(C.cream)
      .setScale(MENU_TYPOGRAPHY.scale);
  }

  private rowY(i: number): number {
    return this.items[i]?.id === 'back' ? 201 : 57 + i * 24;
  }

  get selectedId(): string | undefined {
    return this.items[this.selected]?.id;
  }
  lock(): void {
    this.locked = true;
    this.dragging = undefined;
  }
  setTag(id: string, tag: string): void {
    this.values.set(id, tag);
    this.draw();
  }

  private onAction = (a: Action): void => {
    if (this.locked || this.dragging || !this.scene.sys.isActive()) return;
    if (a.type === 'nav' && (a.dir === 'up' || a.dir === 'down')) {
      this.selected = (this.selected + (a.dir === 'up' ? -1 : 1) + this.items.length) % this.items.length;
      this.sfx.play('menuMove');
      this.draw();
    } else if (a.type === 'confirm' || a.type === 'pick') this.confirm();
  };

  private dragVolume = (p: Phaser.Input.Pointer): void => {
    if (this.locked || !this.dragging || p.id !== this.dragging.pointerId) return;
    const level = Math.max(0, Math.min(VOLUME_MAX, Math.round(((p.worldX - 109) / 58) * VOLUME_MAX)));
    this.setVolume(this.dragging.id, level);
  };

  private endDrag = (p: Phaser.Input.Pointer): void => {
    if (p.id === this.dragging?.pointerId) this.dragging = undefined;
  };

  private confirm(): void {
    if (this.locked) return;
    const item = this.items[this.selected];
    if (!item?.enabled) return;
    this.sfx.play(item.id === 'back' ? 'menuBack' : 'menuSelect');
    item.onSelect?.();
  }

  private draw(): void {
    const g = this.gfx.clear();
    this.items.forEach((item, i) => {
      const y = this.rowY(i),
        on = this.selected === i;
      menuRow(g, menuLayout.rowX, y, menuLayout.rowWidth, on);
      this.labels[i]?.setTint(on ? C.ink : C.cream);
      const value = this.values.get(item.id) ?? '';
      const tag = this.tags[i]!;
      tag.setTint(on ? C.ink : C.cyan);
      if (item.id === 'music' || item.id === 'sfx') {
        tag.setText('');
        const level = value === 'OFF' ? 0 : value.split('|').length - 1;
        for (let n = 0; n < VOLUME_MAX; n++) {
          g.fillStyle(on ? 0x9f743d : 0x211744).fillRect(109 + n * 6, y + 7, 4, 9);
          if (n < level) g.fillStyle(on ? C.ink : C.cyan).fillRect(109 + n * 6, y + 7, 4, 9);
        }
      } else tag.setText(value);
    });
  }
}
