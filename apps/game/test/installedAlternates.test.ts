import { readFileSync } from 'node:fs';
import type Phaser from 'phaser';
import { describe, expect, it } from 'vitest';
import { cacheAlternatePortrait } from '../src/assets/alternatePortraits';
import { characterPresentation } from '../src/config/characters';

describe('installed reviewed alternates', () => {
  for (const id of ['taiko', 'riot', 'anchor'] as const) {
    it(`${id}: installs the reviewed combat sheet and generated rest portrait unchanged`, () => {
      const folder = `art/fighters/mask-study-v1/${id === 'taiko' ? '' : `${id}/`}`;
      expect(readFileSync(`apps/game/public/assets/${id}-alternate.png`)).toEqual(
        readFileSync(`${folder}${id}-masked-atlas.png`),
      );
      expect(readFileSync(`apps/game/public/assets/menus/action/${id}-alternate.png`)).toEqual(
        readFileSync(`art/portraits/generated-alternates-v1/${id}-alternate-native.png`),
      );
      const atlas = JSON.parse(
        readFileSync(`apps/game/public/assets/menus/action/${id}-alternate.json`, 'utf8'),
      );
      expect(Object.keys(atlas.frames)).toEqual(['rest']);
      expect(atlas.frames.rest.frame).toEqual({ x: 0, y: 0, w: 192, h: 240 });
      const scene = { textures: { exists: () => true } } as unknown as Phaser.Scene;
      expect(cacheAlternatePortrait(scene, id)).toBe(`${characterPresentation(id).portrait}-alternate`);
    });
  }

  it('reports a missing generated portrait rather than silently regenerating it with color guesses', () => {
    const scene = { textures: { exists: () => false } } as unknown as Phaser.Scene;
    expect(() => cacheAlternatePortrait(scene, 'taiko')).toThrow('Missing alternate portrait: taiko');
  });
});
