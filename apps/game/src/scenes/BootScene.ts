import Phaser from 'phaser';
import { createMoveHands } from '../assets/createMoveHands';
import { audioFiles } from '../audio/sounds';
import { alternateTexture, generateAlternatePalettes } from '../assets/alternatePalettes';
import { FONT_SIZES, Tex } from '../assets/keys';
import { HOME_CHARACTERS, HOME_FONT_STUDY, HomeTex } from '../assets/homeArt';
import { MENU_TYPOGRAPHY } from '../config/menuTypography';
import { generatePlaceholders } from '../assets/placeholders';
import { registerPixelFont } from '../assets/pixelFont';
import { palette } from '../config/palette';
import {
  STAGES,
  COURTYARD_LAYERS,
  courtyardTexture,
  HARBOR_LAYERS,
  harborTexture,
  stageCloudTexture,
  stageFieldTexture,
  stageForegroundTexture,
  stageTexture,
} from '../config/stages';
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
    this.load.image(Tex.koLetters, 'assets/combat/ko-v1.png');
    for (const move of ['rock', 'paper', 'scissors'])
      this.load.image(`move-hand-source-${move}`, `assets/combat/${move}-source-v6.png`);
    this.load.image(Tex.logo, 'assets/logo.png');
    this.load.atlas(Tex.logoSheen, 'assets/logo-sheen.png', 'assets/logo-sheen.json');
    this.load.atlas(Tex.fighterP1, 'assets/taiko.png', 'assets/taiko.json');
    this.load.atlas(Tex.fighterP2, 'assets/riot.png', 'assets/riot.json');
    this.load.atlas(Tex.fighterAnchor, 'assets/anchor.png', 'assets/anchor.json');
    for (const [id, texture] of [
      ['taiko', Tex.fighterP1],
      ['riot', Tex.fighterP2],
      ['anchor', Tex.fighterAnchor],
    ] as const)
      this.load.atlas(alternateTexture(texture), `assets/${id}-alternate.png`, `assets/${id}.json`);
    const home = 'assets/menus/action/';
    this.load.json(HomeTex.layout, `${home}manifest.json`);
    this.load.bitmapFont(MENU_TYPOGRAPHY.fontKey, `${home}menu-font.png`, `${home}menu-font.fnt`);
    this.load.atlas(HomeTex.background, `${home}background-sheet.png`, `${home}background-sheet.json`);
    for (const { id, texture } of HOME_CHARACTERS)
      this.load.atlas(texture, `${home}${id}-sheet.png`, `${home}${id}-sheet.json`);
    for (const { id, texture } of HOME_CHARACTERS)
      this.load.atlas(alternateTexture(texture), `${home}${id}-alternate.png`, `${home}${id}-alternate.json`);
    this.load.atlas(HomeTex.labels, `${home}labels.png`, `${home}labels.json`);
    for (const font of HOME_FONT_STUDY)
      this.load.atlas(`${HomeTex.labels}-${font}`, `${home}labels-${font}.png`, `${home}labels.json`);
    this.load.image(HomeTex.logo, `${home}logo.png`);
    this.load.image(HomeTex.paint, `${home}paint-streak.png`);
    this.load.image(HomeTex.arrow, `${home}arrow.png`);
    this.load.image('victory-title', `${home}victory-title.png`);
    for (const stage of STAGES) {
      if (stage.foundry) {
        for (const layer of ['background', 'occluders', 'warm-glow'])
          this.load.image(`foundry-${layer}`, `${stage.foundry}${layer}.png`);
        this.load.spritesheet('foundry-gear', `${stage.foundry}gear-turn.png`, {
          frameWidth: 176,
          frameHeight: 176,
        });
        this.load.spritesheet('foundry-fire', `${stage.foundry}fire.png`, {
          frameWidth: 192,
          frameHeight: 240,
        });
      }
      if (stage.courtyard) {
        for (const layer of COURTYARD_LAYERS) {
          if (layer.startsWith('lantern-') || layer.startsWith('glow-'))
            this.load.spritesheet(courtyardTexture(layer), `${stage.courtyard}${layer}-sway.png`, {
              frameWidth: 192,
              frameHeight: 240,
            });
          else this.load.image(courtyardTexture(layer), `${stage.courtyard}${layer}.png`);
        }
        this.load.spritesheet('courtyard-petals', `${stage.courtyard}petals.png`, {
          frameWidth: 8,
          frameHeight: 8,
        });
      }
      if (stage.harbor)
        for (const layer of HARBOR_LAYERS)
          this.load.image(harborTexture(layer), `${stage.harbor}${layer}.png`);
      if (stage.harbor)
        this.load.spritesheet('harbor-water-wave', `${stage.harbor}water-wave.png`, {
          frameWidth: 192,
          frameHeight: 240,
        });
      if (stage.image) this.load.image(stageTexture(stage.id), stage.image);
      if (stage.clouds) this.load.image(stageCloudTexture(stage.id), stage.clouds.image);
      if (stage.storm) {
        this.load.image(stageCloudTexture(stage.id), stage.storm.clouds);
        this.load.spritesheet(stageFieldTexture(stage.id), stage.storm.field, {
          frameWidth: 192,
          frameHeight: 240,
        });
        this.load.spritesheet(stageForegroundTexture(stage.id), stage.storm.foreground, {
          frameWidth: 192,
          frameHeight: 32,
        });
      }
    }
    // sound effects and music (made by tools/audio/make-audio.mjs)
    for (const { key, urls } of audioFiles()) this.load.audio(key, urls);
  }

  create(): void {
    for (const size of FONT_SIZES) registerPixelFont(this, size);
    generatePlaceholders(this);
    createMoveHands(this.game);
    generateAlternatePalettes(this);
    const art = new URLSearchParams(window.location.search).get('art');
    if (import.meta.env.DEV && (art === 'anchor-sheet' || art === 'riot-sheet' || art === 'taiko-sheet')) {
      void import('./AnchorSheetPreviewScene').then(({ AnchorSheetPreviewScene }) => {
        this.scene.add(SceneKey.sheetPreview, AnchorSheetPreviewScene, true);
        this.scene.stop();
      });
      return;
    }
    if (import.meta.env.DEV && art === 'taiko-legacy-sheet') {
      void import('./TaikoSheetPreviewScene').then(({ TaikoSheetPreviewScene }) => {
        this.scene.add(SceneKey.sheetPreview, TaikoSheetPreviewScene, true);
        this.scene.stop();
      });
      return;
    }
    if (import.meta.env.DEV && art === 'taiko') {
      void import('./ArtPreviewScene').then(({ ArtPreviewScene }) => {
        this.scene.add(SceneKey.artPreview, ArtPreviewScene, true);
        this.scene.stop();
      });
      return;
    }
    this.scene.launch(SceneKey.transition);
    getContext(this).flow.toLogo();
    this.scene.stop();
  }
}
