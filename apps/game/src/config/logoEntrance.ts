/** Downward arrival, a small upward rebound, then settle. All displayed positions stay integral. */
export const HOME_ENTRANCE = {
  delayMs: 240,
  staggerMs: 200,
  fallMs: 180,
  reboundMs: 80,
  settleMs: 100,
} as const;

export function homeEntranceFrame(
  elapsed: number,
  index: number,
): { alpha: number; offsetY: number; landed: boolean; complete: boolean } {
  const t = elapsed - HOME_ENTRANCE.delayMs - index * HOME_ENTRANCE.staggerMs;
  if (t <= 0) return { alpha: 0, offsetY: -10, landed: false, complete: false };
  const { fallMs, reboundMs, settleMs } = HOME_ENTRANCE;
  const ease = (x: number) => 1 - (1 - x) ** 3;
  let y = 0;
  if (t < fallMs) y = -10 + 12 * ease(t / fallMs);
  else if (t < fallMs + reboundMs) y = 2 - 4 * ease((t - fallMs) / reboundMs);
  else if (t < fallMs + reboundMs + settleMs) y = -2 + 2 * ease((t - fallMs - reboundMs) / settleMs);
  return {
    alpha: ease(Math.min(1, t / 150)),
    offsetY: Math.round(y),
    landed: t >= fallMs,
    complete: t >= fallMs + reboundMs + settleMs,
  };
}
