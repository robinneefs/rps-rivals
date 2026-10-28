import type Phaser from 'phaser';
import { MONITOR } from '../config/layout';
import { stageCloudTexture, stageTexture, type StageDef } from '../config/stages';
import { addStormStage } from './StormStageView';
import { addHarborStage } from './HarborStageView';
import { addDistantBirds } from './DistantBirds';

/** Native-pixel layers: sky, drifting clouds, then the city/rail/floor that occludes them. */
export function addStage(scene: Phaser.Scene, stage: StageDef, seed = 0): (() => void) | undefined {
  scene.data.set('stageId', stage.id);
  scene.data.set('stageEffects', null);
  if (stage.harbor) return addHarborStage(scene);
  if (stage.storm) return addStormStage(scene, stage, seed);
  if (stage.sky !== undefined)
    scene.add.rectangle(0, 0, MONITOR.width, MONITOR.height, stage.sky).setOrigin(0);
  if (stage.clouds) {
    const layer = stage.clouds;
    const clouds = scene.add
      .tileSprite(0, layer.y, MONITOR.width, layer.height, stageCloudTexture(stage.id))
      .setOrigin(0);
    // TileSprite.texture is its viewport-sized render canvas, not the source panorama.
    const panorama = scene.textures.get(stageCloudTexture(stage.id));
    const end = Math.max(0, panorama.getSourceImage().width - MONITOR.width);
    let offset = 0;
    let direction = 1;
    let pauseRemaining = 0;
    const timer = scene.time.addEvent({
      delay: layer.stepMs,
      loop: true,
      callback: () => {
        if (end === 0) return;
        if (pauseRemaining > 0) {
          pauseRemaining -= layer.stepMs;
          if (pauseRemaining > 0) return;
        }
        offset += direction;
        clouds.setTilePosition(offset, 0);
        if (offset === end || offset === 0) {
          direction *= -1;
          pauseRemaining = layer.pauseMs ?? 600;
        }
      },
    });
    scene.events.once('shutdown', () => timer.remove());
  }
  if (stage.id === 'rooftop') addDistantBirds(scene);
  scene.add.image(0, 0, stageTexture(stage.id)).setOrigin(0);
}
