import type { PixelBuffer } from '../assets/placeholders/PixelBuffer';

/** The single temporary rooftop stage, authored at the native 192 x 240 resolution. */
export interface StageDef {
  /** Short and unique; also used in the texture key and the ?stage= test link. */
  id: string;
  name: string;
  /** The picture, loaded at boot. The fighters stand at STAGE.floorY. */
  image?: string;
  /** Solid sky behind the transparent city layer. Keep the health-bar area clear for the HUD. */
  sky?: number;
  /** Cloud panorama pans back and forth behind the city, resting briefly at each end. */
  clouds?: { image: string; y: number; height: number; stepMs: number; pauseMs?: number };
  /** Or a placeholder painted in code. */
  paint?: () => PixelBuffer;
}

export const STAGES: readonly StageDef[] = [
  {
    id: 'rooftop',
    name: 'City Rooftop',
    image: 'assets/stages/rooftop-v2-192.png',
    sky: 0x0066fe,
    clouds: { image: 'assets/stages/rooftop-clouds-576.png', y: 52, height: 64, stepMs: 200, pauseMs: 600 },
  },
];

export const stageTexture = (id: string): string => `stage-${id}`;
export const stageCloudTexture = (id: string): string => `stage-${id}-clouds`;

/**
 * The stage for a match. `seed` comes from the session (both online players get the same one);
 * `override` is a stage id from the ?stage= link, for trying a stage out.
 */
export function stageFor(seed: number, override?: string | null): StageDef {
  const forced = STAGES.find((s) => s.id === override);
  if (forced) return forced;
  const n = STAGES.length;
  return STAGES[((Math.floor(seed) % n) + n) % n]!;
}
