import { describe, expect, it } from 'vitest';
import {
  RAINBOW_DISC_PASSING_DRILL_ROUNDS,
  RAINBOW_DISC_STREAK_THROWS,
  RAINBOW_DISC_TARGET_RANGE_THROWS,
  rainbowDiscStreakTarget,
  rainbowDiscStreakTiming,
  resolveRainbowDiscStreakAttempt,
} from './RainbowDiscPracticeRules';

describe('RainbowDiscPracticeRules', () => {
  it('keeps each drill bounded', () => {
    expect(RAINBOW_DISC_TARGET_RANGE_THROWS).toBe(5);
    expect(RAINBOW_DISC_PASSING_DRILL_ROUNDS).toBe(6);
    expect(RAINBOW_DISC_STREAK_THROWS).toBe(8);
  });

  it('uses an authored repeatable target sequence for Rainbow Streak', () => {
    expect(Array.from({ length: 8 }, (_, index) => rainbowDiscStreakTarget(index))).toEqual([
      1, 0, 2, 1, 2, 0, 2, 1,
    ]);
    expect(rainbowDiscStreakTarget(8)).toBe(1);
  });

  it('tightens Rainbow Streak timing in small visible steps', () => {
    const first = rainbowDiscStreakTiming(0);
    const middle = rainbowDiscStreakTiming(4);
    const last = rainbowDiscStreakTiming(7);

    expect(middle.tolerance).toBeLessThan(first.tolerance);
    expect(last.tolerance).toBeLessThan(middle.tolerance);
    expect(middle.sweepSpeed).toBeGreaterThan(first.sweepSpeed);
    expect(last.sweepSpeed).toBeGreaterThan(middle.sweepSpeed);
  });

  it('ends Rainbow Streak on a wrong target or mistimed called target', () => {
    expect(resolveRainbowDiscStreakAttempt(0, 1, true)).toBe('hit');
    expect(resolveRainbowDiscStreakAttempt(0, 0, true)).toBe('wrong-target');
    expect(resolveRainbowDiscStreakAttempt(0, 1, false)).toBe('miss');
  });
});
