import type Phaser from 'phaser';

/** Readable native-pixel embers and rising smoke, driven by the stage clock. */
export function createFoundryParticles(scene: Phaser.Scene) {
  const smoke = scene.add.graphics().setName('foundry-smoke');
  const sparks = scene.add.graphics().setName('foundry-sparks').setBlendMode('ADD');
  return (time: number, reduced: boolean) => {
    smoke.clear();
    sparks.clear();
    const smokePositions: { x: number; y: number }[] = [];
    const sparkPositions: { x: number; y: number }[] = [];
    if (reduced) return { smoke: smokePositions, sparks: sparkPositions };
    for (let i = 0; i < 8; i++) {
      const since = time - 300 - i * 750,
        age = since % 6800;
      if (since < 0 || age >= 6200) continue;
      const progress = age / 6200;
      const x = Math.round(124 + Math.sin(age / 1400 + i * 1.3) * (3 + progress * 9));
      const y = Math.round(126 - progress * 68);
      const width = 8 + Math.floor(progress * 12),
        height = 5 + Math.floor(progress * 9);
      // Union three rounded lobes into one scalloped puff; scanline edges stay
      // on the native grid without the old rectangular silhouette or alpha seams.
      const rx = width / 2,
        ry = height / 2;
      const curl = Math.sin(age / 1100 + i) * rx * 0.3;
      const lobes = [
        { x: -rx * 0.3, y: 0, rx: rx * 0.8, ry: ry * 0.8 },
        { x: rx * 0.35, y: -ry * 0.25, rx: rx * 0.8, ry },
        { x: curl, y: -ry * 0.9, rx: rx * 0.65, ry: ry * 0.75 },
      ];
      const opacity = Math.sin(progress * Math.PI) * 0.38;
      for (let row = -Math.ceil(ry * 1.7); row <= Math.ceil(ry); row++) {
        if (y + row < 50) continue;
        let left = Infinity,
          right = -Infinity;
        for (const lobe of lobes) {
          const dy = (row - lobe.y) / lobe.ry;
          if (Math.abs(dy) > 1) continue;
          const reach = lobe.rx * Math.sqrt(1 - dy * dy);
          left = Math.min(left, Math.ceil(lobe.x - reach));
          right = Math.max(right, Math.floor(lobe.x + reach));
        }
        if (right < left) continue;
        const span = right - left + 1;
        smoke.fillStyle(0x99939b, opacity * 0.55).fillRect(x + left, y + row, 1, 1);
        if (span > 2)
          smoke
            .fillStyle(row < -ry * 0.5 ? 0xaaa4ae : 0x99939b, opacity)
            .fillRect(x + left + 1, y + row, span - 2, 1);
        if (span > 1) smoke.fillStyle(0x99939b, opacity * 0.55).fillRect(x + right, y + row, 1, 1);
      }
      smokePositions.push({ x, y });
    }
    for (let i = 0; i < 10; i++) {
      const since = time - 450 - i * 95,
        age = since % 4200;
      if (since < 0 || age >= 2000) continue;
      const x = Math.round(115 + ((i * 7) % 25) + (Math.sin(i * 2.3) * age) / 160);
      const y = Math.round(145 - age * 0.075 + age * age * 0.000017);
      const alpha = Math.min(1, (2000 - age) / 700) * 0.65;
      sparks.fillStyle(age < 900 ? 0xffd06e : 0xf39739, alpha).fillRect(x, y, 1, i % 3 === 0 ? 2 : 1);
      if (age < 1200) sparks.fillStyle(0xf26b27, alpha * 0.45).fillRect(x, y + 2, 1, 1);
      sparkPositions.push({ x, y });
    }
    return { smoke: smokePositions, sparks: sparkPositions };
  };
}
