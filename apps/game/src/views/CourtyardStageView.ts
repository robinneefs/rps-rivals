import type Phaser from 'phaser';
import { courtyardTexture, type COURTYARD_LAYERS } from '../config/stages';

/** Whole-lantern pendulums baked on the native grid, warm glow and drifting petals. */
export function addCourtyardStage(scene: Phaser.Scene): undefined {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const image = (layer: (typeof COURTYARD_LAYERS)[number]) =>
    scene.add.image(0, 0, courtyardTexture(layer)).setOrigin(0).setName(`courtyard-${layer}`);
  image('sky-gradient');
  image('scenery-clean');
  const smoke = scene.add.graphics().setName('courtyard-distant-smoke');
  image('stone-floor');
  const lanterns = [
    { id: 'left', x: 18, y: 89, width: 12, height: 22 },
    { id: 'right', x: 163, y: 89, width: 11, height: 22 },
    { id: 'far-right', x: 187, y: 100, width: 5, height: 20 },
  ] as const;
  const hanging = lanterns.map((l) => ({
    body: image(`lantern-${l.id}`),
    glow: image(`glow-${l.id}`).setBlendMode('ADD'),
  }));
  const petals = Array.from({ length: 6 }, (_, i) =>
    scene.add
      .sprite(0, 0, 'courtyard-petals', i % 4)
      .setOrigin(0)
      .setName('courtyard-petal')
      .setVisible(false),
  );
  let elapsed = 0;
  const update = () => {
    const reduced = motion.matches,
      t = reduced ? 0 : elapsed;
    smoke.clear();
    const smokePositions: { x: number; y: number }[] = [];
    if (!reduced) {
      // Tiny cool-grey puffs emerge from two distant roof clusters, behind the courtyard.
      for (const [chimney, source] of [
        { x: 140, y: 96 },
        { x: 123, y: 107 },
      ].entries()) {
        for (let i = 0; i < 5; i++) {
          const age = (t + i * 1550 + chimney * 700) % 8000;
          const progress = age / 8000;
          const x = Math.round(source.x + progress * 4 + Math.sin(progress * Math.PI * 2 + chimney) * 1.5);
          const y = Math.round(source.y - progress * (chimney === 0 ? 20 : 15));
          const width = 2 + Math.floor(progress * 3);
          const alpha = Math.sin(progress * Math.PI) * 0.2;
          smoke.fillStyle(0xb6abbc, alpha);
          smoke.fillRect(x, y, width, 1);
          smoke.fillRect(x - 1, y + 1, width + 1, 1);
          smoke.fillRect(x, y + 2, width, 1);
          smokePositions.push({ x, y });
        }
      }
    }
    const offsets = lanterns.map((_, i) =>
      reduced ? 0 : Math.round(7 * Math.sin((t / (5600 + i * 650)) * Math.PI * 2 + i * 0.85)),
    );
    const glows = lanterns.map((_, i) =>
      reduced ? 0.3 : 0.3 + 0.14 * Math.sin((t / (5100 + i * 700)) * Math.PI * 2 + i * 2),
    );
    hanging.forEach(({ body, glow }, i) => {
      body.setFrame(offsets[i]! + 7);
      glow.setFrame(offsets[i]! + 7).setAlpha(glows[i]!);
    });
    const petalPositions = petals.map((petal, i) => {
      const released = t - 1200 - i * 850;
      const age = released % 12000;
      const visible = !reduced && released >= 0 && age < 8500;
      petal.setVisible(visible);
      if (visible)
        petal
          .setPosition(
            Math.round(-8 + (age / 8500) * 208 + Math.sin(age / 900 + i) * 5),
            Math.round(86 + (i % 3) * 16 + age / 110),
          )
          .setFrame((Math.floor(age / 550) + i) % 4);
      return { visible, x: petal.x, y: petal.y };
    });
    scene.data.set('stageEffects', {
      offsets,
      glows,
      petals: petalPositions,
      smoke: smokePositions,
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
