import { describe, expect, it } from 'vitest';
import { HOME_ENTRANCE, homeEntranceFrame } from '../src/config/homeEntrance';

describe('home entrance choreography', () => {
  it('reveals pane, fighter, logo, then three labels in order', () => {
    for (let i = 0; i < 6; i++) {
      const at = HOME_ENTRANCE.delayMs + i * HOME_ENTRANCE.staggerMs;
      expect(homeEntranceFrame(at, i).alpha).toBe(0);
      expect(homeEntranceFrame(at + 50, i).alpha).toBeGreaterThan(0);
      if (i < 5) expect(homeEntranceFrame(at + 50, i + 1).alpha).toBe(0);
      expect(homeEntranceFrame(at + HOME_ENTRANCE.fallMs - 1, i).landed).toBe(false);
      expect(homeEntranceFrame(at + HOME_ENTRANCE.fallMs, i).landed).toBe(true);
    }
  });
  it('drops, rebounds above its home position, and settles without fractional pixel positions', () => {
    const start = HOME_ENTRANCE.delayMs;
    expect(homeEntranceFrame(start, 0).offsetY).toBe(-10);
    expect(homeEntranceFrame(start + 180, 0).offsetY).toBe(2);
    expect(homeEntranceFrame(start + 260, 0).offsetY).toBe(-2);
    expect(homeEntranceFrame(start + 360, 0)).toEqual({ alpha: 1, offsetY: 0, landed: true, complete: true });
    for (let t = 0; t < 2000; t += 7) {
      const state = homeEntranceFrame(t, 0);
      expect(Number.isInteger(state.offsetY)).toBe(true);
      expect(state.alpha).toBeGreaterThanOrEqual(0);
      expect(state.alpha).toBeLessThanOrEqual(1);
    }
  });
});
