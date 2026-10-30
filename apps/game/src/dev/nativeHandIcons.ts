import type { Move } from '@rps/core';

type Point = readonly [number, number];
const SIZE = 28;

/** Deliberate native pixel silhouettes. Every gap and stroke is chosen at game resolution. */
export function nativeHandIcon(move: Move): HTMLCanvasElement {
  const mask = new Uint8Array(SIZE * SIZE);
  const polygon = (points: readonly Point[]) => {
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const [ax, ay] = points[i]!,
            [bx, by] = points[j]!;
          if (ay > y + 0.5 !== by > y + 0.5 && x + 0.5 < ((bx - ax) * (y + 0.5 - ay)) / (by - ay) + ax)
            inside = !inside;
        }
        if (inside) mask[y * SIZE + x] = 1;
      }
  };
  const rect = (x: number, y: number, w: number, h: number) =>
    polygon([
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ]);
  if (move === 'rock') {
    polygon([
      [4, 9],
      [4, 6],
      [6, 4],
      [9, 4],
      [10, 3],
      [14, 3],
      [15, 4],
      [19, 4],
      [20, 6],
      [23, 6],
      [25, 8],
      [25, 17],
      [23, 21],
      [20, 24],
      [8, 24],
      [4, 21],
      [2, 17],
      [2, 12],
    ]);
    rect(9, 23, 11, 3);
  } else if (move === 'paper') {
    // Finger channels retain at least two dark pixels, even after the CRT pass.
    rect(7, 5, 3, 14);
    rect(12, 2, 3, 17);
    rect(17, 4, 3, 15);
    rect(22, 8, 3, 12);
    polygon([
      [7, 14],
      [25, 15],
      [25, 20],
      [22, 24],
      [20, 26],
      [10, 26],
      [6, 23],
      [2, 18],
      [1, 15],
      [3, 13],
      [5, 14],
      [9, 19],
    ]);
  } else {
    // Two broad slanted fingers, separated by a generous V-shaped channel.
    polygon([
      [5, 2],
      [8, 2],
      [14, 15],
      [10, 18],
      [3, 5],
      [3, 3],
    ]);
    polygon([
      [20, 2],
      [23, 2],
      [24, 4],
      [18, 18],
      [14, 16],
    ]);
    polygon([
      [9, 13],
      [12, 13],
      [14, 15],
      [17, 14],
      [21, 17],
      [23, 21],
      [21, 25],
      [18, 26],
      [10, 26],
      [6, 23],
      [5, 19],
      [6, 16],
    ]);
  }
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const white = mask[y * SIZE + x];
      let edge = false;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx,
            yy = y + dy;
          if (xx >= 0 && xx < SIZE && yy >= 0 && yy < SIZE && mask[yy * SIZE + xx]) edge = true;
        }
      if (!edge) continue;
      const p = (y * SIZE + x) * 4;
      image.data[p] = white ? 255 : 16;
      image.data[p + 1] = white ? 255 : 16;
      image.data[p + 2] = white ? 255 : 32;
      image.data[p + 3] = 255;
    }
  ctx.putImageData(image, 0, 0);
  ctx.fillStyle = '#101020';
  if (move === 'rock') {
    // Small knuckle channels and one broad, stepped thumb crease.
    ctx.fillRect(9, 5, 1, 5);
    ctx.fillRect(14, 5, 1, 5);
    ctx.fillRect(19, 7, 1, 4);
    ctx.fillRect(5, 11, 14, 2);
    ctx.fillRect(18, 12, 3, 2);
    ctx.fillRect(20, 13, 1, 3);
    ctx.fillRect(16, 16, 5, 2);
    ctx.fillRect(7, 17, 10, 1);
  } else if (move === 'scissors') {
    // Three clear white masses: folded fingers, thumb and palm.
    ctx.fillRect(8, 17, 5, 1);
    ctx.fillRect(7, 18, 7, 1);
    ctx.fillRect(12, 19, 4, 1);
    ctx.fillRect(8, 21, 6, 1);
    ctx.fillRect(14, 17, 2, 2);
    ctx.fillRect(16, 18, 3, 1);
  }
  return canvas;
}
