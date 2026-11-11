export type RGB = readonly [number, number, number];
export type Ramp = readonly [RGB, RGB];
export const IVORY: Ramp = [
  [104, 104, 99],
  [235, 230, 215],
];
export const WHITE: Ramp = [
  [115, 121, 132],
  [239, 237, 230],
];
export const RED: Ramp = [
  [83, 12, 23],
  [204, 34, 45],
];
export const BLACK: Ramp = [
  [13, 17, 22],
  [54, 59, 63],
];
export const BLUE: Ramp = [
  [17, 38, 83],
  [48, 103, 181],
];
export const BLONDE: Ramp = [
  [113, 67, 26],
  [246, 215, 132],
];
export const OLIVE: Ramp = [
  [47, 52, 31],
  [130, 139, 79],
];
export const MUSTARD: Ramp = [
  [91, 70, 24],
  [219, 191, 73],
];
export const STEEL_BLUE: Ramp = [
  [25, 40, 62],
  [106, 139, 177],
];

export function shade(value: number, low: number, high: number, ramp: Ramp): RGB {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  const channel = (i: 0 | 1 | 2) => Math.round(ramp[0][i] + (ramp[1][i] - ramp[0][i]) * t);
  return [channel(0), channel(1), channel(2)];
}
