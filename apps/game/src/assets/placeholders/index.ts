import type Phaser from 'phaser';
import { css, fighterColors, palette } from '../../config/palette';
import { STAGES, stageTexture } from '../../config/stages';
import { FighterFrames, Tex } from '../keys';
import { FIGHTER_FRAME, paintFighter } from './fighters';
import { BADGE, PICK_CHIP, paintBadges, paintPickChips } from './icons';
import { paintKoLetters } from './koLetters';
import type { PixelBuffer } from './PixelBuffer';
import { paintMenuBackdrop, paintMenuStripes } from './menu';

/**
 * Generates every placeholder texture under its real asset key. When a real sprite sheet is loaded
 * under the same key in BootScene, the placeholder for it is skipped: the art swap touches no view.
 */
export function generatePlaceholders(scene: Phaser.Scene): void {
  const add = (key: string, buf: PixelBuffer, frames?: (tex: Phaser.Textures.CanvasTexture) => void) => {
    if (scene.textures.exists(key)) return;
    const tex = scene.textures.createCanvas(key, buf.width, buf.height);
    if (!tex) throw new Error(`Could not create texture ${key}`);
    tex
      .getContext()
      .putImageData(new ImageData(new Uint8ClampedArray(buf.data), buf.width, buf.height), 0, 0);
    frames?.(tex);
    tex.refresh();
  };

  add(Tex.menuBackdrop, paintMenuBackdrop());
  add(Tex.menuStripes, paintMenuStripes());
  for (const stage of STAGES) if (stage.paint) add(stageTexture(stage.id), stage.paint());
  add(Tex.koLetters, paintKoLetters());
  add(Tex.badges, paintBadges(), (tex) =>
    BADGE.moves.forEach((m, row) =>
      BADGE.states.forEach((state, i) =>
        tex.add(`${m}-${state}`, 0, i * BADGE.size, row * BADGE.size, BADGE.size, BADGE.size),
      ),
    ),
  );
  add(Tex.pickChips, paintPickChips(), (tex) =>
    PICK_CHIP.frames.forEach((frame, i) =>
      tex.add(frame, 0, i * PICK_CHIP.width, 0, PICK_CHIP.width, PICK_CHIP.height),
    ),
  );
  for (const [key, colors] of [
    [Tex.fighterP1, fighterColors.p1],
    [Tex.fighterP2, fighterColors.p2],
  ] as const) {
    add(key, paintFighter(colors), (tex) =>
      FighterFrames.forEach((frame, i) =>
        tex.add(frame, 0, i * FIGHTER_FRAME.width, 0, FIGHTER_FRAME.width, FIGHTER_FRAME.height),
      ),
    );
  }
  if (!scene.textures.exists(Tex.dither)) {
    const d = scene.textures.createCanvas(Tex.dither, 2, 2);
    if (d) {
      d.getContext().fillStyle = css(palette.panel);
      d.getContext().fillRect(0, 0, 1, 1);
      d.getContext().fillRect(1, 1, 1, 1);
      d.refresh();
    }
  }
}
