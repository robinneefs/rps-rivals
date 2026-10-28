import type Phaser from 'phaser';
import { screenPulse } from './crt';

/** Reusable recipes: preview these in the panel or trigger them from game choreography. */
export const screenEffects = {
  hit: { split: 1.2, warp: 0.5, flash: 0.15, mono: 0, durationMs: 180 },
  heavyHit: { split: 2, warp: 2, flash: 0.3, mono: 0, durationMs: 320 },
  knockout: { split: 3, warp: 1, flash: 0.65, mono: 0.4, durationMs: 900 },
  glitch: { split: 4, warp: 5, flash: 0, mono: 0, durationMs: 450 },
  lightning: { split: 0.5, warp: 0, flash: 0.85, mono: 0, durationMs: 220 },
  drain: { split: 0, warp: 0.3, flash: 0, mono: 1, durationMs: 1200 },
};

export function playScreenEffect(scene: Phaser.Scene, name: keyof typeof screenEffects): () => void {
  const recipe = screenEffects[name];
  const stops = (['split', 'warp', 'flash', 'mono'] as const).map((kind) =>
    screenPulse(scene, kind, recipe[kind], recipe.durationMs),
  );
  return () => stops.forEach((stop) => stop());
}
