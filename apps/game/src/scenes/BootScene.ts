import Phaser from 'phaser';
import { audioFiles } from '../audio/sounds';
import { FONT_SIZES, Tex } from '../assets/keys';
import { generatePlaceholders } from '../assets/placeholders';
import { registerPixelFont } from '../assets/pixelFont';
import { palette } from '../config/palette';
import { STAGES, stageTexture } from '../config/stages';
import { getContext } from './context';
import { SceneKey } from './keys';

/** Loads assets (with a pixel loading bar), builds placeholder art and fonts, then starts the logo. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.boot);
  }

  preload(): void {
    const { width, height } = this.scale;
    const w = 100;
    const x = Math.floor((width - w) / 2);
    const y = Math.floor(height / 2);
    const bar = this.add.graphics();
    this.load.on('progress', (p: number) => {
      bar
        .clear()
        .fillStyle(palette.panelEdge)
        .fillRect(x - 1, y - 1, w + 2, 6);
      bar.fillStyle(palette.pink).fillRect(x, y, Math.round(w * p), 4);
    });
    // Real art: load sprite sheets here under the keys in assets/keys.ts; their placeholders are then skipped.
    this.load.image(Tex.logo, 'assets/logo.png');
    for (const stage of STAGES) if (stage.image) this.load.image(stageTexture(stage.id), stage.image);
    // sound effects and music (made by tools/audio/make-audio.mjs)
    for (const { key, urls } of audioFiles()) this.load.audio(key, urls);
  }

  create(): void {
    for (const size of FONT_SIZES) registerPixelFont(this, size);
    generatePlaceholders(this);
    this.scene.launch(SceneKey.transition);
    getContext(this).flow.toLogo();
    this.scene.stop();
  }
}
