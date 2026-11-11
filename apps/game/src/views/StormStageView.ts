import { seededRng } from '@rps/core';
import type Phaser from 'phaser';
import { MONITOR } from '../config/layout';
import {
  stageCloudTexture,
  stageFieldTexture,
  stageForegroundTexture,
  type StageDef,
} from '../config/stages';

/** Pixel layers and a single scene-clock timer; all weather randomness is cosmetic. */
export function addStormStage(scene: Phaser.Scene, stage: StageDef, seed: number): () => void {
  const art = stage.storm!;
  const rng = seededRng(seed ^ 0x53544f52);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  scene.add.rectangle(0, 0, MONITOR.width, MONITOR.height, stage.sky).setOrigin(0);
  const clouds = scene.add
    .tileSprite(0, 0, 192, 160, stageCloudTexture(stage.id))
    .setOrigin(0)
    .setFlipY(true)
    .setTilePosition(96, 0)
    .setName('storm-clouds');
  const skyLight = scene.add.rectangle(0, 48, 192, 112, 0x779fff).setOrigin(0).setAlpha(0);
  const bolt = scene.add.graphics().setName('storm-lightning');
  const field = scene.add.image(0, 0, stageFieldTexture(stage.id), 0).setOrigin(0).setName('storm-field');
  const fieldLight = scene.add
    .image(0, 0, stageFieldTexture(stage.id), 0)
    .setOrigin(0)
    .setTintFill(0x91c7e9)
    .setAlpha(0);
  let foreground: Phaser.GameObjects.Image | undefined;
  let foregroundLight: Phaser.GameObjects.Image | undefined;
  let rain: Phaser.GameObjects.Graphics | undefined;
  const drops = Array.from({ length: 26 }, () => ({
    x: rng.next() * 192,
    y: rng.next() * 188,
    speed: 2 + rng.next() * 3,
  }));
  let elapsed = 0;
  let strikeAt = 2400 + Math.floor(rng.next() * 1200);
  let strikeAge = 1000;
  let strikes = 0;
  let cloudOffset = 96;
  let cloudElapsed = 0;
  const drawBolt = () => {
    bolt.clear();
    let x = 35 + Math.floor(rng.next() * 120);
    let y = 52 + Math.floor(rng.next() * 10);
    const points = [{ x, y }];
    while (y < 145) {
      x = Math.max(12, Math.min(180, x + Math.floor(rng.next() * 19) - 9));
      y = Math.min(145, y + 5 + Math.floor(rng.next() * 9));
      points.push({ x, y });
    }
    // One-pixel cores and stepped branches, no blurred full-screen flash.
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1]!;
      const b = points[i]!;
      bolt.lineStyle(3, 0x5985ed, 0.35).lineBetween(a.x, a.y, b.x, b.y);
      bolt.lineStyle(1, 0xd5efff, 1).lineBetween(a.x, a.y, b.x, b.y);
      if (i % 3 === 0 && i < points.length - 2) {
        const dx = (rng.next() > 0.5 ? 1 : -1) * (8 + Math.floor(rng.next() * 12));
        bolt.lineStyle(1, 0x85b8f4, 0.8).lineBetween(b.x, b.y, b.x + dx, b.y + 11);
        bolt.lineBetween(b.x + dx, b.y + 11, b.x + dx - 3, b.y + 18);
      }
    }
  };
  const tick = () => {
    const reduced = motion.matches;
    elapsed += 60;
    const frame = reduced ? 0 : Math.floor(elapsed / art.frameMs) % art.frames;
    if (!reduced) {
      // Centered crop (96), halfway toward either panorama edge (48..144).
      // Eight-minute eased cycle: two minutes from center to the first turn.
      cloudElapsed += 60;
      cloudOffset = 96 - Math.round(48 * Math.sin((cloudElapsed / 480000) * Math.PI * 2));
      clouds.setTilePosition(cloudOffset, 0);
    }
    for (const layer of [field, fieldLight, foreground, foregroundLight]) layer?.setFrame(frame);
    if (elapsed >= strikeAt) {
      strikeAt = elapsed + 4500 + Math.floor(rng.next() * 3500);
      if (!reduced) {
        drawBolt();
        strikeAge = 0;
        strikes++;
      }
    } else strikeAge += 60;
    const light = reduced
      ? 0
      : strikeAge < 120
        ? 0.28
        : strikeAge < 420
          ? 0.17 * (1 - (strikeAge - 120) / 300)
          : 0;
    bolt.setAlpha(reduced ? 0 : strikeAge < 180 ? 1 : strikeAge < 420 ? (420 - strikeAge) / 240 : 0);
    skyLight.setAlpha(light);
    fieldLight.setAlpha(light * 0.8);
    foregroundLight?.setAlpha(light * 0.8);
    rain?.clear();
    if (rain && !reduced) {
      rain.fillStyle(0x82a6c2, 0.3);
      for (const drop of drops) {
        const y = 50 + Math.floor((drop.y + (elapsed / 25) * drop.speed) % 188);
        const x = Math.floor((drop.x + elapsed / 55) % 192);
        rain.fillRect(x, y, 1, 2).fillRect((x + 1) % 192, y + 2, 1, 2);
      }
    }
    scene.data.set('stageEffects', {
      frame,
      cloudOffset,
      strikes,
      lightning: light > 0,
      reducedMotion: reduced,
    });
  };
  const timer = scene.time.addEvent({ delay: 60, loop: true, callback: tick });
  scene.events.once('shutdown', () => timer.remove());
  return () => {
    foreground = scene.add
      .image(0, 208, stageForegroundTexture(stage.id), 0)
      .setOrigin(0)
      .setName('storm-foreground');
    foregroundLight = scene.add
      .image(0, 208, stageForegroundTexture(stage.id), 0)
      .setOrigin(0)
      .setTintFill(0x91c7e9)
      .setAlpha(0);
    rain = scene.add.graphics().setName('storm-rain');
    tick();
  };
}
