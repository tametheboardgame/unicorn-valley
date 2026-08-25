import { describe, expect, it } from 'vitest';
import { RefreshThrottle } from './RefreshThrottle';

describe('RefreshThrottle', () => {
  it('runs immediately and then only after the configured interval', () => {
    const throttle = new RefreshThrottle(100);

    expect(throttle.shouldRun(0)).toBe(true);
    expect(throttle.shouldRun(99)).toBe(false);
    expect(throttle.shouldRun(100)).toBe(true);
    expect(throttle.shouldRun(150)).toBe(false);
    expect(throttle.shouldRun(200)).toBe(true);
  });

  it('can be reset when a caller needs an immediate synchronisation', () => {
    const throttle = new RefreshThrottle(120);
    expect(throttle.shouldRun(500)).toBe(true);
    expect(throttle.shouldRun(550)).toBe(false);

    throttle.reset();
    expect(throttle.shouldRun(550)).toBe(true);
  });

  it('rejects unusable intervals and timestamps', () => {
    expect(() => new RefreshThrottle(0)).toThrowError(/positive finite/);
    expect(() => new RefreshThrottle(Number.POSITIVE_INFINITY)).toThrowError(/positive finite/);

    const throttle = new RefreshThrottle(100);
    expect(throttle.shouldRun(Number.NaN)).toBe(false);
  });
});
