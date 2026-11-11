import type Phaser from 'phaser';
import { createFoundryParticles } from './FoundryParticles';

/** Native-pixel machinery behind fixed pipe/rail occluders; no combat randomness. */
export function addFoundryStage(scene: Phaser.Scene): undefined {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const image = (key: string) => scene.add.image(0, 0, key).setOrigin(0).setName(key);
  image('foundry-background');
  const gear = scene.add.image(-8, 138, 'foundry-gear', 0).setOrigin(0.5).setName('foundry-gear');
  const fire = image('foundry-fire');
  image('foundry-occluders');
  const drawParticles = createFoundryParticles(scene);
  const glow = image('foundry-warm-glow').setBlendMode('ADD');
  let elapsed = 0;
  const update = () => {
    const reduced = motion.matches,
      t = reduced ? 0 : elapsed;
    const gearFrame = reduced ? 0 : Math.floor(t / 250) % 360;
    const fireFrame = reduced ? 0 : Math.floor(t / 150) % 12;
    const glowAlpha = reduced
      ? 0.12
      : 0.12 + 0.06 * Math.sin((t / 2700) * Math.PI * 2) + 0.02 * Math.sin((t / 430) * Math.PI * 2);
    gear.setFrame(gearFrame);
    fire.setFrame(fireFrame);
    glow.setAlpha(glowAlpha);
    const particles = drawParticles(t, reduced);
    scene.data.set('stageEffects', {
      gearFrame,
      fireFrame,
      glowAlpha,
      particles,
      elapsed: t,
      reducedMotion: reduced,
    });
  };
  const timer = scene.time.addEvent({
    delay: 75,
    loop: true,
    callback: () => {
      if (!motion.matches) elapsed += 75;
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
