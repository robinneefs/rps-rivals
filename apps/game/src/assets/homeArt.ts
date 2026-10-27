/** Independent home artwork; characters retain a replaceable full-screen registration canvas. */
export const HomeTex = {
  background: 'home-background',
  character: 'home-character',
  logo: 'home-logo',
  paint: 'home-paint',
  labels: 'home-labels',
  arrow: 'home-arrow',
  layout: 'home-layout',
} as const;

export const HOME_CHARACTERS = [
  { id: 'riot', texture: HomeTex.character },
  { id: 'taiko', texture: 'home-character-taiko' },
  { id: 'anchor', texture: 'home-character-anchor' },
] as const;

/** Local art-review URLs can compare fonts without replacing the default/menu behaviour. */
export const HOME_FONT_STUDY = ['spleen', 'spleen16', 'tamzen-bold', 'tamzen', 'm6x11'] as const;
export function homeLabelTexture(choice: string | null): string {
  return HOME_FONT_STUDY.some((name) => name === choice) ? `${HomeTex.labels}-${choice}` : HomeTex.labels;
}

export interface HomeLayout {
  character: { x: number; y: number };
  characterLoop: { frames: number[]; durations: number[] };
  background: { frames: number[]; frameMs: number };
  logo: { x: number; y: number };
  paint: { x: number; y: number };
  menu: { x: number; ys: number[]; arrowX: number; arrowOffsetY: number; labelWidths?: number[] };
}
