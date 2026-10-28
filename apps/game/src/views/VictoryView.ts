import type Phaser from 'phaser';
import { characterPresentation } from '../config/characters';
import type { CharacterId } from '@rps/core';
import { cacheAlternatePortrait } from '../assets/alternatePortraits';
import { menuColors as C, MenuText } from './MenuStyle';

/** Approved splash composition, assembled from native art and the existing menu palette. */
export class VictoryView {
  readonly note: MenuText;
  readonly menuY = 180;

  constructor(scene: Phaser.Scene, winner: CharacterId, winnerLabel?: string, alternate = false) {
    const character = characterPresentation(winner);
    const bg = scene.add.graphics();
    bg.fillStyle(C.ink).fillRect(0, 0, 192, 240);
    // Broad paint wedges converge behind the winner; no finer-than-native decoration.
    for (const [color, x, y, endX, endY, width] of [
      [C.pink, 0, 65, 112, 136, 15],
      [C.gold, 0, 91, 103, 135, 10],
      [C.cyan, 0, 126, 106, 145, 4],
      [C.pink, 192, 56, 87, 135, 12],
      [C.cyan, 192, 91, 88, 148, 5],
      [C.gold, 192, 122, 82, 154, 10],
      [C.pink, 0, 181, 109, 127, 12],
      [C.pink, 192, 180, 91, 131, 14],
    ]) {
      bg.fillStyle(color!).fillTriangle(x!, y!, x!, y! + width!, endX!, endY!);
    }
    for (const [x, y, color] of [
      [17, 73, C.gold],
      [174, 72, C.cyan],
      [181, 150, C.gold],
      [11, 154, C.pink],
    ]) {
      bg.fillStyle(color!)
        .fillRect(x!, y!, 2, 6)
        .fillRect(x! - 2, y! + 2, 6, 2);
    }
    const texture = alternate ? cacheAlternatePortrait(scene, winner) : character.portrait;
    const portrait = scene.add.image(0, 29, texture, 'rest').setOrigin(0).setName('victory-portrait');
    // Blend the torso into a slanted paint edge instead of ending it at a straight crop.
    // Two-pixel steps and sparse flecks preserve the native pixel-art texture under CRT.
    const paint = scene.add.graphics();
    for (let x = 0; x < 192; x += 2) {
      const edge = 177 - Math.floor(x / 16);
      for (let row = 0; row < 6; row++) {
        paint.fillStyle(C.ink, (row + 1) / 7).fillRect(x, edge - 12 + row * 2, 2, 2);
      }
      paint.fillStyle(C.ink).fillRect(x, edge, 2, 240 - edge);
      if ((x / 2) % 3 === 0) paint.fillRect(x, edge - 6, 2, 2);
    }
    paint.fillStyle(C.pink, 0.65).fillTriangle(0, 176, 0, 173, 48, 173);
    paint.fillStyle(C.edge, 0.7).fillTriangle(149, 169, 192, 163, 192, 166);
    new MenuText(scene, 96, 8, winnerLabel ?? `${character.name} WINS`, C.cream);
    const title = scene.add.image(4, 22, 'victory-title').setOrigin(0);
    // Status sits on a dark backing only while needed, leaving the local portrait unobscured.
    const backing = scene.add.graphics().fillStyle(C.ink, 0.9).fillRect(0, 163, 192, 15).setVisible(false);
    this.note = new MenuText(scene, 96, 165, '', C.cyan);
    const setText = this.note.setText.bind(this.note);
    this.note.setText = (text: string) => {
      backing.setVisible(Boolean(text));
      return setText(text);
    };
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      portrait.setX(28).setAlpha(0);
      title.setY(10).setAlpha(0);
      scene.tweens.add({ targets: portrait, x: 0, alpha: 1, duration: 850, ease: 'Cubic.Out' });
      scene.tweens.add({ targets: title, y: 22, alpha: 1, delay: 350, duration: 750, ease: 'Cubic.Out' });
    }
  }
}
