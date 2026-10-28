import type { PixelBuffer } from '../assets/placeholders/PixelBuffer';
import type { MusicKey } from '../audio/sounds';

export const HARBOR_LAYERS = [
  'sky-gradient',
  'distant-harbor',
  'water-base',
  'water-reflections',
  'boat',
  'pennant',
  'rope-span',
  'dock-foreground',
] as const;
export const harborTexture = (layer: (typeof HARBOR_LAYERS)[number]): string => `harbor-${layer}`;

/** Stages authored at the native 192 x 240 resolution. */
export interface StageDef {
  /** Short and unique; also used in the texture key and the ?stage= test link. */
  id: string;
  name: string;
  /** Stage-specific soundtrack; stages without one retain the original fight theme. */
  music?: MusicKey;
  /** The picture, loaded at boot. The fighters stand at STAGE.floorY. */
  image?: string;
  /** Solid sky behind the transparent city layer. Keep the health-bar area clear for the HUD. */
  sky?: number;
  /** Cloud panorama pans back and forth behind the city, resting briefly at each end. */
  clouds?: { image: string; y: number; height: number; stepMs: number; pauseMs?: number };
  /** Separate native grass sheets; effects never alter match state or combat randomness. */
  storm?: { clouds: string; field: string; foreground: string; frames: number; frameMs: number };
  /** Directory of aligned 192 × 240 harbor layers. */
  harbor?: string;
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
  {
    id: 'storm-field',
    name: 'Storm Field',
    music: 'storm',
    image: 'assets/stages/storm-field-192.png',
    sky: 0x020925,
    storm: {
      clouds: 'assets/stages/storm-clouds.png',
      field: 'assets/stages/storm-field.png',
      foreground: 'assets/stages/storm-foreground.png',
      frames: 12,
      frameMs: 120,
    },
  },
  {
    id: 'sunset-harbor',
    name: 'Sunset Harbor',
    music: 'harbor',
    image: 'assets/stages/harbor/sky-gradient.png',
    harbor: 'assets/stages/harbor/',
  },
];

export const stageTexture = (id: string): string => `stage-${id}`;
export const stageCloudTexture = (id: string): string => `stage-${id}-clouds`;
export const stageFieldTexture = (id: string): string => `stage-${id}-field`;
export const stageForegroundTexture = (id: string): string => `stage-${id}-foreground`;

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
