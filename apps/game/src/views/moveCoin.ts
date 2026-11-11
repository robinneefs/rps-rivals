import type Phaser from 'phaser';
import type { PickChip } from '../assets/placeholders/icons';
import { moveColors } from '../config/palette';

/** Shared native-pixel coin face for picking and attack reveals. */
export function drawMoveCoin(
  g: Phaser.GameObjects.Graphics,
  chip: PickChip,
  x: number,
  y: number,
  radius: number,
  flash: boolean,
): void {
  const picked = chip === 'rock' || chip === 'paper' || chip === 'scissors';
  const base = picked ? moveColors[chip].main : 0x26232d;
  const tone = (light: number) => {
    const channel = (shift: number) => {
      const value = (base >> shift) & 255;
      return Math.round(light > 0 ? value + (255 - value) * light : value * (1 + light));
    };
    return (channel(16) << 16) | (channel(8) << 8) | channel(0);
  };
  // Broad bevel bands and a recessed inner ring read as a coin on the native raster.
  for (let row = -radius; row <= radius; row++) {
    for (let col = -radius; col <= radius; col++) {
      const distance = Math.sqrt(col * col + row * row);
      if (distance > radius) continue;
      const upperLeft = col + row < 0;
      let color: number;
      if (distance > radius - 2) color = 0x0c0914;
      else if (distance > radius - 3) color = flash ? 0xf7edff : tone(upperLeft ? 0.65 : -0.55);
      else if (distance > radius - 6) color = tone(upperLeft ? 0.22 : -0.2);
      else if (distance > radius - 7) color = tone(-0.6);
      else color = tone(row < -radius / 4 ? 0.1 : row > radius / 3 ? -0.24 : -0.08);
      g.fillStyle(color, 1).fillRect(x + col, y + row, 1, 1);
    }
  }
}
