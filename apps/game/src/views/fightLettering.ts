import type Phaser from 'phaser';

/** Wide, chamfered arcade capitals with a narrow I and sharply cut terminals. */
export function createFightLettering(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const glyphs = [
    [
      '011111111',
      '111111110',
      '111000000',
      '111000000',
      '111111100',
      '111111000',
      '111000000',
      '111000000',
      '110000000',
    ],
    ['011', '111', '111', '111', '111', '111', '111', '111', '110'],
    [
      '001111110',
      '011111111',
      '111000011',
      '111000000',
      '111001111',
      '111000111',
      '111000111',
      '011111111',
      '001111110',
    ],
    [
      '011000111',
      '111000111',
      '111000111',
      '111000111',
      '111111111',
      '111111111',
      '111000111',
      '111000111',
      '110000110',
    ],
    [
      '011111111',
      '111111110',
      '000111000',
      '000111000',
      '000111000',
      '000111000',
      '000111000',
      '000111000',
      '000110000',
    ],
    ['011', '111', '111', '111', '111', '110', '000', '011', '110'],
  ];
  const pixels: { x: number; y: number }[] = [];
  let cursor = 0;
  for (const glyph of glyphs) {
    glyph.forEach((row, gy) => {
      [...row].forEach((bit, gx) => {
        if (bit !== '1') return;
        for (let dy = 0; dy < 3; dy++) {
          const y = gy * 3 + dy;
          pixels.push({ x: cursor + gx * 2 + Math.floor((26 - y) / 4), y });
        }
      });
    });
    cursor += glyph[0]!.length * 2 + 2;
  }
  const left = -Math.floor((cursor + 2) / 2);
  const g = scene.add.graphics().setName('fight-lettering').setVisible(false);
  const paint = (dx: number, dy: number, color: number) => {
    g.fillStyle(color, 1);
    for (const p of pixels) g.fillRect(left + p.x + dx, p.y + dy, 2, 1);
  };
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) paint(dx + 3, dy + 4, 0x130e22);
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) paint(dx, dy, 0x130e22);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) paint(dx, dy, 0xf33725);
  for (const p of pixels) {
    const color = p.y < 4 ? 0xffffff : p.y < 21 ? 0xfff1df : 0xff7150;
    g.fillStyle(color).fillRect(left + p.x, p.y, 2, 1);
  }
  return g;
}
