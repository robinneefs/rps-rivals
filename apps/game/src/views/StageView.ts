import type Phaser from 'phaser';
import { MONITOR } from '../config/layout';
import { stageCloudTexture, stageTexture, type StageDef } from '../config/stages';

/** Native-pixel layers: sky, drifting clouds, then the city/rail/floor that occludes them. */
export function addStage(scene: Phaser.Scene, stage: StageDef): void {
  if (stage.sky !== undefined)
    scene.add.rectangle(0, 0, MONITOR.width, MONITOR.height, stage.sky).setOrigin(0);
  if (stage.clouds) {
    const layer = stage.clouds;
    const clouds = scene.add
      .tileSprite(0, layer.y, MONITOR.width, layer.height, stageCloudTexture(stage.id))
      .setOrigin(0);
    const period = clouds.texture.getSourceImage().width;
    let offset = 0;
    const timer = scene.time.addEvent({
      delay: layer.stepMs,
      loop: true,
      callback: () => {
        offset = (offset + 1) % period;
        clouds.setTilePosition(offset, 0);
      },
    });
    scene.events.once('shutdown', () => timer.remove());
  }
  scene.add.image(0, 0, stageTexture(stage.id)).setOrigin(0);
}
