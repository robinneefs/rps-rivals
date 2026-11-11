/**
 * The monitor: every monitor scene draws in this 192 x 240 pixel grid (4:5). The cabinet round it
 * is a page layer now, laid out in cabinet/geometry.ts.
 */
export const MONITOR = { width: 192, height: 240 } as const;

/** Where the fighters stand on the monitor. */
export const STAGE = {
  floorY: 220,
  fighterX: { p1: 54, p2: 138 },
} as const;
