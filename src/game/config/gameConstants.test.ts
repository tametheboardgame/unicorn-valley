import { describe, expect, it } from 'vitest';
import { GAME_HEIGHT, GAME_WIDTH } from './gameConstants';

describe('game dimensions', () => {
  it('uses a 16:9 logical canvas', () => {
    expect(GAME_WIDTH).toBe(1280);
    expect(GAME_HEIGHT).toBe(720);
    expect(GAME_WIDTH / GAME_HEIGHT).toBeCloseTo(16 / 9);
  });
});
