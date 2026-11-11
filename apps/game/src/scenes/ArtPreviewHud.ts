import type Phaser from 'phaser';
import { GLYPHS } from '../assets/glyphs';

export type PreviewMoment = 'pick' | 'hit' | 'ko';
export const PREVIEW_HUD = 'art-preview-hud-192';

/** Native 192x240 HUD. Transparent sky behind all lettering; every small glyph dot is one pixel. */
export function paintPreviewHud(scene: Phaser.Scene, names: [string, string], moment: PreviewMoment): void {
  const texture = scene.textures.get(PREVIEW_HUD) as Phaser.Textures.CanvasTexture;
  const ctx = texture.getContext();
  ctx.clearRect(0, 0, 192, 240);
  const rect = (x: number, y: number, w: number, h: number, colour: string) => {
    ctx.fillStyle = colour;
    ctx.fillRect(x, y, w, h);
  };
  const glyphs = (value: string, x: number, y: number, colour: string, size: number) => {
    ctx.fillStyle = colour;
    [...value].forEach((letter, i) =>
      (GLYPHS[letter] ?? '').split(' ').forEach((row, dy) => {
        [...row].forEach((bit, dx) => {
          if (bit === '1') ctx.fillRect(x + i * 6 * size + dx * size, y + dy * size, size, size);
        });
      }),
    );
  };
  const text = (value: string, x: number, y: number, colour = '#fff8e8', size = 1) => {
    // A one-pixel outline preserves readability against sky, without a panel behind the HUD.
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ])
      glyphs(value, x + dx!, y + dy!, '#101426', size);
    glyphs(value, x, y, colour, size);
  };
  const centre = (value: string, y: number, colour = '#fff8e8', size = 1) =>
    text(value, Math.floor((192 - (value.length * 6 - 1) * size) / 2), y, colour, size);
  for (const [side, name] of names.entries()) {
    const x = side === 0 ? 6 : 112;
    text(name, side === 0 ? x : 186 - (name.length * 6 - 1), 5);
    rect(x - 1, 16, 76, 13, '#101426');
    rect(x, 17, 74, 11, '#dbe9ec');
    rect(x + 1, 18, 72, 9, '#18263d');
    const hp = side === 0 || moment === 'pick' ? 70 : moment === 'ko' ? 0 : 49;
    const start = side === 0 ? x + 2 : x + 72 - hp;
    rect(start, 19, hp, 7, '#ffd04a');
    rect(start, 19, hp, 1, '#fff3a0');
    rect(start, 25, hp, 1, '#c67b1c');
    const tag = side === 0 ? 'YOU' : 'CPU';
    text(tag, side === 0 ? x : 186 - 17, 33, side === 0 ? '#ff8b78' : '#8feaff');
    for (let dot = 0; dot < 2; dot++) {
      // Counters sit under the inner end of each bar, opposite the YOU/CPU tag.
      const dx = side === 0 ? 73 - dot * 10 : 112 + dot * 10;
      rect(dx, 32, 7, 7, '#101426');
      rect(dx + 1, 33, 5, 5, side === 0 && dot === 0 ? '#ffdc72' : '#35536e');
      if (side === 0 && dot === 0) rect(dx + 1, 33, 5, 1, '#fff3bd');
    }
  }
  centre(moment === 'pick' ? '3' : '0', 6, moment === 'pick' ? '#fff8e8' : '#ff8b78', 3);
  centre(moment === 'pick' ? 'PICK YOUR MOVE' : moment === 'ko' ? 'K.O.!' : 'ROCK WINS', 56, '#ffdc72');
  if (moment !== 'pick') centre(moment === 'ko' ? 'YOU WIN ROUND' : 'CPU -15 HP', 69);
  // No persistent round title, bottom move icons or damage legend. Intro reminders come later.
  texture.refresh();
}
