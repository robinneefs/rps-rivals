import { describe, expect, it } from 'vitest';
import { homeEntranceFrame } from '../src/config/homeEntrance';

describe('home entrance choreography', () => {
  it('reveals the portrait before the title and menu', () => {
    expect(homeEntranceFrame(200, 1).alpha).toBeGreaterThan(0);
    expect(homeEntranceFrame(200, 2).alpha).toBe(0);
    expect(homeEntranceFrame(400, 2).alpha).toBeGreaterThan(0);
    expect(homeEntranceFrame(400, 3).alpha).toBe(0);
  });
  it('keeps each plate and label together during the stagger', () => {
    for (let row = 0; row < 3; row++) {
      for (let t = 0; t < 1500; t += 17) {
        expect(homeEntranceFrame(t, 3 + row)).toEqual(homeEntranceFrame(t, 6 + row));
      }
    }
    expect(homeEntranceFrame(550, 3).alpha).toBeGreaterThan(0);
    expect(homeEntranceFrame(550, 4).alpha).toBe(0);
  });
  it('settles every layer without overshoot or fractional pixel movement', () => {
    for (let i = 0; i < 9; i++) {
      let previous = 0;
      for (let t = 0; t < 1600; t += 7) {
        const state = homeEntranceFrame(t, i);
        expect(state.alpha).toBeGreaterThanOrEqual(previous);
        expect(Number.isInteger(state.offsetX) && Number.isInteger(state.offsetY)).toBe(true);
        previous = state.alpha;
      }
      expect(homeEntranceFrame(1600, i)).toEqual({ alpha: 1, offsetX: 0, offsetY: 0, complete: true });
    }
  });
});
