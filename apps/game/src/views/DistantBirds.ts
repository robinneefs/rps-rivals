import type Phaser from 'phaser';

/** Shared three-pixel silhouettes, above the scenery but below persistent HUD rows 0–47. */
export function createDistantBirds(scene: Phaser.Scene, name: string) {
  const birds = scene.add.graphics().setName(name);
  return (elapsed: number, reduced: boolean): boolean => {
    const flight = (elapsed - 6000) % 36000;
    const visible = !reduced && elapsed >= 6000 && flight < 16000;
    birds.clear();
    if (visible) {
      birds.fillStyle(0x625276, 0.8);
      for (let i = 0; i < 3; i++) {
        const x = Math.round(-16 + (flight / 16000) * 224) - i * 7;
        const y = 64 + i * 3;
        const wing = Math.floor(elapsed / 450 + i) % 2;
        birds
          .fillRect(x, y, 1, 1)
          .fillRect(x - 1, y - wing, 1, 1)
          .fillRect(x + 1, y - wing, 1, 1);
      }
    }
    return visible;
  };
}

/** Standalone clock for static stages; harbor shares its own animation clock instead. */
export function addDistantBirds(scene: Phaser.Scene): void {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const draw = createDistantBirds(scene, 'rooftop-birds');
  let elapsed = 0;
  const update = () => {
    const birdsVisible = draw(elapsed, motion.matches);
    scene.data.set('stageEffects', { birdsVisible, elapsed, reducedMotion: motion.matches });
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
}
