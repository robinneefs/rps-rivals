import type Phaser from 'phaser';
import { MENU_TYPOGRAPHY } from '../config/menuTypography';

export const menuColors = {
  ink: 0x19102f,
  panel: 0x382267,
  edge: 0x8460b3,
  gold: 0xffd35c,
  cream: 0xfff2cb,
  cyan: 0x69e7e8,
  pink: 0xff789d,
};

// Shared face geometry. Keep row faces eight pixels inside either panel edge.
export const menuLayout = { panelX: 6, panelWidth: 178, centerX: 95, rowX: 14, rowWidth: 162 } as const;

/** Native bitmap text; centering uses visible capitals rather than the font's line spacing. */
export class MenuText {
  readonly image: Phaser.GameObjects.BitmapText;
  constructor(
    scene: Phaser.Scene,
    private readonly x: number,
    y: number,
    label: string,
    color: number = menuColors.cream,
    private readonly align: 'left' | 'center' | 'right' = 'center',
  ) {
    this.image = scene.add
      .bitmapText(x, y, MENU_TYPOGRAPHY.fontKey, '', MENU_TYPOGRAPHY.size)
      .setTint(color)
      .setScale(MENU_TYPOGRAPHY.scale);
    this.setText(label);
  }
  setText(label: string): this {
    this.image.setText(label);
    this.image.setX(
      Math.round(
        this.x - this.image.width * (this.align === 'center' ? 0.5 : this.align === 'right' ? 1 : 0),
      ),
    );
    return this;
  }
  setColor(color: number): this {
    this.image.setTint(color);
    return this;
  }
  setVisible(visible: boolean): this {
    this.image.setVisible(visible);
    return this;
  }
}

export function menuPanel(scene: Phaser.Scene, y = 47, height = 166): void {
  const g = scene.add.graphics();
  g.fillStyle(0x171332).fillRect(8, y + 2, 178, height);
  g.fillStyle(0x291b52).fillRect(6, y, 178, height);
  g.fillStyle(0x7250a2).fillRect(6, y, 178, 2);
}

/** The approved Options background and equal-width title/panel system. */
export function menuBackdrop(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  g.fillStyle(0x233f91).fillRect(0, 0, 192, 240);
  g.fillStyle(0x315bc1).fillTriangle(0, 18, 192, 0, 0, 212);
  g.fillStyle(0x4a287c).fillTriangle(192, 54, 192, 240, 0, 240);
  g.fillStyle(0xe95079).fillPoints(
    [
      { x: 0, y: 154 },
      { x: 192, y: 28 },
      { x: 192, y: 40 },
      { x: 0, y: 166 },
    ],
    true,
  );
  g.fillStyle(0xffa24c).fillPoints(
    [
      { x: 0, y: 171 },
      { x: 192, y: 45 },
      { x: 192, y: 49 },
      { x: 0, y: 175 },
    ],
    true,
  );
}

export function menuTitle(scene: Phaser.Scene, title: string): void {
  const g = scene.add.graphics();
  g.fillStyle(0x171332).fillRect(8, 17, 178, 27);
  g.fillStyle(0xf28b3c).fillRect(6, 12, 178, 27);
  g.fillStyle(menuColors.gold).fillRect(6, 12, 178, 24);
  g.fillStyle(0xfff2ad).fillRect(6, 12, 178, 2);
  new MenuText(scene, 95, 20, title, 0x291b52);
}

export function menuRow(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  selected: boolean,
): void {
  g.fillStyle(menuColors.ink).fillRect(x + 2, y + 2, width, 22);
  g.fillStyle(selected ? menuColors.gold : menuColors.panel).fillRect(x, y, width, 22);
  g.fillStyle(selected ? 0xfff2ad : menuColors.edge).fillRect(x, y, width, 1);
  if (selected) {
    g.fillStyle(0xf18d3e).fillRect(x, y + 20, width, 2);
    g.fillStyle(menuColors.ink).fillTriangle(x + 5, y + 7, x + 5, y + 15, x + 9, y + 11);
  }
}
