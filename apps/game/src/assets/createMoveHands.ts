import type Phaser from 'phaser';
import { moveColors } from '../config/palette';

/** Build the approved native-size embossed pictograms once during boot. */
export function createMoveHands(game: Phaser.Game): void {
  for (const move of ['rock', 'paper', 'scissors'] as const) {
    const key = `move-hand-${move}`;
    if (game.textures.exists(key)) continue;
    const image = game.textures.get(`move-hand-source-${move}`).getSourceImage() as HTMLImageElement;
    const source = document.createElement('canvas');
    source.width = image.width;
    source.height = image.height;
    const context = source.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, source.width, source.height);
    let left = source.width,
      top = source.height,
      right = -1,
      bottom = -1;
    for (let y = 0; y < source.height; y++)
      for (let x = 0; x < source.width; x++)
        if (data[(y * source.width + x) * 4 + 3]! > 128) {
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
    if (right < left) throw new Error(`Empty hand artwork: ${move}`);
    const width = right - left + 1,
      height = bottom - top + 1;
    const scale = 24 / Math.max(width, height);
    const w = Math.round(width * scale),
      h = Math.round(height * scale);
    const native = document.createElement('canvas');
    native.width = 32;
    native.height = 32;
    const pixels = native.getContext('2d')!;
    pixels.imageSmoothingEnabled = false;
    pixels.drawImage(
      image,
      left,
      top,
      width,
      height,
      Math.round((32 - w) / 2),
      Math.round((32 - h) / 2),
      w,
      h,
    );
    const opaque = pixels.getImageData(0, 0, 32, 32);
    for (let i = 0; i < opaque.data.length; i += 4) {
      opaque.data[i + 3] = opaque.data[i + 3]! > 128 ? 255 : 0;
      // The white-icon study uses exact white and dark ink, without generated colour noise.
      const white = opaque.data[i]! + opaque.data[i + 1]! + opaque.data[i + 2]! > 384;
      opaque.data[i] = white ? 255 : 16;
      opaque.data[i + 1] = white ? 255 : 16;
      opaque.data[i + 2] = white ? 255 : 32;
    }
    // Emboss the hand into the coloured coin: a pale upper-left bevel, shaded lower-right
    // bevel and coloured relief face. Preserve the chosen pictogram's exact pixel silhouette.
    const original = new Uint8ClampedArray(opaque.data);
    const raised = (x: number, y: number) =>
      x >= 0 &&
      y >= 0 &&
      x < 32 &&
      y < 32 &&
      original[(y * 32 + x) * 4 + 3]! > 0 &&
      original[(y * 32 + x) * 4]! === 255;
    const base = moveColors[move].main;
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 32; x++) {
        const i = (y * 32 + x) * 4;
        if (!original[i + 3]) continue;
        const light = !raised(x, y)
          ? -0.64
          : !raised(x - 1, y - 1)
            ? 0.82
            : !raised(x + 1, y + 1)
              ? -0.38
              : 0.32;
        for (const [channel, shift] of [
          [0, 16],
          [1, 8],
          [2, 0],
        ] as const) {
          const value = (base >> shift) & 255;
          opaque.data[i + channel] = Math.round(
            light > 0 ? value + (255 - value) * light : value * (1 + light),
          );
        }
      }
    pixels.putImageData(opaque, 0, 0);
    game.textures.addCanvas(key, native);
  }
}
