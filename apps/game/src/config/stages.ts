import type { PixelBuffer } from '../assets/placeholders/PixelBuffer';

/**
 * The fight stages. Each match is fought on one of these, picked at random (see stageFor).
 * A stage is a 288 x 360 picture: a file in public/assets/stages/ (made from the ChatGPT art by
 * tools/art/build-cabinet.py) or, for a placeholder, a painter in assets/placeholders/stages/.
 * To add one: add a line here. The v1 stages (Night Street, Sunny Field, Castle Roof) were drawn
 * for the old 216 x 216 monitor and left with v2.0; new art for more stages is still to come.
 */
export interface StageDef {
  /** Short and unique; also used in the texture key and the ?stage= test link. */
  id: string;
  name: string;
  /** The picture, loaded at boot. The fighters stand at STAGE.floorY. */
  image?: string;
  /** Or a placeholder painted in code. */
  paint?: () => PixelBuffer;
}

export const STAGES: readonly StageDef[] = [
  { id: 'rooftop', name: 'City Rooftop', image: 'assets/stages/rooftop.png' },
];

export const stageTexture = (id: string): string => `stage-${id}`;

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
