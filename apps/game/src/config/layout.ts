/**
 * The monitor: every monitor scene draws in this 288 x 360 space (4:5, v2.0). The cabinet round it
 * is a page layer now, laid out in cabinet/geometry.ts.
 */
export const MONITOR = { width: 288, height: 360 } as const;

/** Where the fighters stand on the monitor. */
export const STAGE = {
  floorY: 318,
  fighterX: { p1: 120, p2: 168 },
} as const;
