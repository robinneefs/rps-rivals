/** Centre on visible ink, excluding platform-dependent font padding and side bearings. */
export function textInkOrigin(canvas: HTMLCanvasElement, resolution: number): { x: number; y: number } {
  const { width, height } = canvas;
  const pixels = canvas
    .getContext('2d', { willReadFrequently: true })!
    .getImageData(0, 0, width, height).data;
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3] === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  return right < 0
    ? { x: width / (2 * resolution), y: height / (2 * resolution) }
    : { x: (left + right + 1) / (2 * resolution), y: (top + bottom + 1) / (2 * resolution) };
}
