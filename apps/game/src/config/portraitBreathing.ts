/** Quiet torso-only motion: long relaxed exhale, no negative overshoot or whole-image bob. */
export function portraitBreathAmount(elapsedMs: number): number {
  const t = ((elapsedMs % 3600) + 3600) % 3600;
  const ease = (v: number) => v * v * (3 - 2 * v);
  if (t < 900) return 0;
  if (t < 1700) return ease((t - 900) / 800);
  if (t < 1840) return 1;
  if (t < 2940) return 1 - ease((t - 1840) / 1100);
  return 0;
}
