import type Phaser from 'phaser';
import { harborTexture, type HARBOR_LAYERS } from '../config/stages';
import { createDistantBirds } from './DistantBirds';

/** Cosmetic native-pixel motion, entirely on the scene clock and behind fighters. */
export function addHarborStage(scene: Phaser.Scene): undefined {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const image = (layer: (typeof HARBOR_LAYERS)[number]) =>
    scene.add.image(0, 0, harborTexture(layer)).setOrigin(0).setName(`harbor-${layer}`);
  image('sky-gradient');
  const drawBirds = createDistantBirds(scene, 'harbor-birds');
  image('distant-harbor');
  const water = scene.add.image(0, 0, 'harbor-water-wave', 0).setOrigin(0).setName('harbor-water');
  const boat = image('boat');
  // Vertical cloth strips flutter with a fixed edge attached to the moving pole.
  const flag = Array.from({ length: 6 }, (_, i) => image('pennant').setCrop(173 + i * 2, 110, 2, 12));
  // Anchors stay pinned; only the middle of the span can flex by one pixel.
  const rope = Array.from({ length: 7 }, (_, i) => image('rope-span').setCrop(76 + i * 6, 158, 6, 17));
  image('dock-foreground');
  let elapsed = 0;
  const update = () => {
    const reduced = motion.matches;
    const t = reduced ? 0 : elapsed;
    const bob = reduced ? 0 : Math.round(Math.sin((t * Math.PI * 2) / 7200));
    boat.setY(bob);
    const waterFrame = reduced ? 0 : Math.floor(t / 200) % 12;
    water.setFrame(waterFrame);
    const birdsVisible = drawBirds(t, reduced);
    const flutter = reduced ? 0 : Math.round(Math.sin((t * Math.PI * 2) / 2600));
    flag.forEach((strip, i) => strip.setY(bob + (i >= 2 ? flutter : 0)));
    const flex = reduced ? 0 : Math.round(Math.sin((t * Math.PI * 2) / 6100));
    rope.forEach((strip, i) => strip.setY(i >= 2 && i <= 4 ? flex : 0));
    scene.data.set('stageEffects', {
      boatY: bob,
      flutter,
      ropeY: flex,
      waterFrame,
      birdsVisible,
      elapsed: t,
      reducedMotion: reduced,
    });
  };
  const timer = scene.time.addEvent({
    delay: 100,
    loop: true,
    callback: () => {
      if (!motion.matches) elapsed += 100;
      update();
    },
  });
  motion.addEventListener('change', update);
  scene.events.once('shutdown', () => {
    timer.remove();
    motion.removeEventListener('change', update);
  });
  update();
  return undefined;
}
