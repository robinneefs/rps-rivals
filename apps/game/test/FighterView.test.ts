import { describe, it, expect } from 'vitest';
import type Phaser from 'phaser';
import { FighterView } from '../src/views/FighterView';
import { FIGHTER_GEOMETRY } from '../src/config/fighterGeometry';
import { FIGHTER_FOOTPRINTS } from '../src/config/fighterFootprints';

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
        const shadow = { x: 0, width: 0, height: 0, visible: true, color: -1, alpha: 0 };
        const scene = {
          add: {
            ellipse: (_x: number, _y: number, _w: number, _h: number, color: number, alpha: number) => ({
              setName() {
                return this;
              },
              setVisible(visible: boolean) {
                shadow.visible = visible;
                return this;
              },
              setOrigin() {
                return this;
              },
              setSize(width: number, height: number) {
                Object.assign(shadow, { width, height, color, alpha });
                return this;
              },
              get x() {
                return shadow.x;
              },
              set x(value: number) {
                shadow.x = value;
              },
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
            expect(shadow.visible).toBe(pose !== 'ko');
            expect(shadow.color).toBe(0);
            expect(shadow.alpha).toBe(0.5);
            const footprint = FIGHTER_FOOTPRINTS[texture.replace(/-alternate$/, '')]?.[pose];
            if (pose === 'kick') expect(shadow.width).toBe(20);
            else if (footprint) {
              expect(shadow.width).toBe(footprint.width);
              const center = footprint.left + footprint.width / 2 - geometry.originX;
              expect(shadow.x).toBe(Math.round(image.x + center * (side === 'p1' ? 1 : -1)));
            }
          }
      });
    }
});
