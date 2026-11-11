import type Phaser from 'phaser';

// Alternate formations, directions and gentle flight paths without changing arrival frequency.
const FLOCKS = [
  {
    direction: 1,
    height: 64,
    rise: 0,
    arc: 0,
    birds: [
      [0, 0],
      [-7, 3],
      [-14, 6],
    ],
  },
  {
    direction: -1,
    height: 76,
    rise: -4,
    arc: -2,
    birds: [
      [0, 0],
      [-6, -3],
      [-6, 3],
      [-12, 6],
    ],
  },
  {
    direction: 1,
    height: 61,
    rise: 5,
    arc: 2,
    birds: [
      [0, 0],
      [-12, 5],
    ],
  },
  {
    direction: -1,
    height: 70,
    rise: 2,
    arc: -3,
    birds: [
      [0, 0],
      [-4, -3],
      [-8, -4],
      [-12, -3],
      [-16, 0],
    ],
  },
] as const;

/** Shared three-pixel silhouettes, above the scenery but below persistent HUD rows 0–47. */
export function createDistantBirds(scene: Phaser.Scene, name: string) {
  const birds = scene.add.graphics().setName(name);
  const offset = name === 'rooftop-birds' ? 2 : 0;
  return (elapsed: number, reduced: boolean): boolean => {
    birds.clear();
    if (reduced || elapsed < 1200) return false;
    let visible = false;
    // New flocks every seven seconds, with overlapping crossings instead of long empty skies.
    const latest = Math.floor((elapsed - 1200) / 7000);
    for (let flock = Math.max(0, latest - 2); flock <= latest; flock++) {
      const flight = elapsed - 1200 - flock * 7000;
      if (flight >= 16000) continue;
      visible = true;
      birds.fillStyle(0x625276, 0.8);
      const pattern = FLOCKS[(flock + offset) % FLOCKS.length]!;
      const progress = flight / 16000;
      const leadX = -16 + progress * 224;
      for (const [i, [dx, dy]] of pattern.birds.entries()) {
        const x = Math.round(pattern.direction === 1 ? leadX + dx : 192 - leadX - dx);
        const y = Math.round(
          pattern.height + dy + progress * pattern.rise + Math.sin(progress * Math.PI) * pattern.arc,
        );
        const wing = Math.floor(elapsed / (410 + ((flock + i) % 3) * 45) + i) % 2;
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
