import { describe, it, expect } from 'vitest';
import type Phaser from 'phaser';
import { FighterView } from '../src/views/FighterView';
import { FIGHTER_GEOMETRY } from '../src/config/fighterGeometry';

describe('approved fighter placement', () => {
  for (const texture of ['fighter-p1', 'fighter-p2', 'fighter-anchor'].flatMap((key) => [
    key,
    `${key}-alternate`,
  ]))
    for (const side of ['p1', 'p2'] as const) {
      it(`${texture} ${side}: every pose stays native-sized, floor-registered and inside the monitor`, () => {
        const image = {
          x: 0,
          y: 0,
          originX: 0,
          originY: 0,
          flipX: false,
          setName() {
            return this;
          },
          setDisplayOrigin(x: number, y: number) {
            this.originX = x;
            this.originY = y;
            return this;
          },
          setFlipX(value: boolean) {
            this.flipX = value;
            return this;
          },
          setFrame() {
            return this;
          },
        };
        const scene = {
          add: {
            rectangle: () => ({
              setOrigin() {
                return this;
              },
              setSize() {
                return this;
              },
              x: 0,
            }),
            sprite: (x: number, y: number) => Object.assign(image, { x, y }),
          },
          time: { addEvent: () => ({ remove() {} }) },
          events: { once() {} },
        };
        const fighter = new FighterView(
          scene as unknown as Phaser.Scene,
          side,
          side === 'p1' ? 54 : 138,
          220,
          texture,
        );
        const geometry = FIGHTER_GEOMETRY[texture.replace(/-alternate$/, '')]!;
        for (const [pose, bounds] of Object.entries(geometry.bounds))
          for (const offset of [-20, 0, 12]) {
            fighter.pose(pose as Parameters<FighterView['pose']>[0]);
            fighter.setOffset(offset);
            const left = image.x + (side === 'p1' ? bounds.left - 80 : 80 - bounds.left - bounds.width);
            expect(left).toBeGreaterThanOrEqual(0);
            expect(left + bounds.width).toBeLessThanOrEqual(192);
            expect(image.y).toBe(221);
            expect(image.originX).toBe(80);
            expect(image.originY).toBe(156);
            expect(image.flipX).toBe(side === 'p2');
            expect(Number.isInteger(image.x)).toBe(true);
          }
      });
    }
});
