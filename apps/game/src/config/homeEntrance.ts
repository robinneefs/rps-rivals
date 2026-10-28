/** Victory-style reveals: portrait first, then title, then paired menu plates and labels. */
export const HOME_ENTRANCE = {
  portraitMs: 850,
  titleDelayMs: 350,
  titleMs: 750,
  menuDelayMs: 500,
  staggerMs: 100,
  menuMs: 650,
} as const;

export function homeEntranceFrame(
  elapsed: number,
  index: number,
): { alpha: number; offsetX: number; offsetY: number; complete: boolean } {
  const row = index >= 3 ? (index - 3) % 3 : 0;
  const delay =
    index === 1
      ? 0
      : index === 2
        ? HOME_ENTRANCE.titleDelayMs
        : index === 0
          ? 300
          : HOME_ENTRANCE.menuDelayMs + row * HOME_ENTRANCE.staggerMs;
  const duration =
    index === 1 ? HOME_ENTRANCE.portraitMs : index === 2 ? HOME_ENTRANCE.titleMs : HOME_ENTRANCE.menuMs;
  const t = Math.max(0, Math.min(1, (elapsed - delay) / duration));
  const eased = 1 - (1 - t) ** 3;
  return {
    alpha: eased,
    offsetX: index === 1 ? Math.round(28 * (1 - eased)) : 0,
    offsetY: index === 1 ? 0 : Math.round((index === 2 ? -12 : 8) * (1 - eased)) || 0,
    complete: t === 1,
  };
}
