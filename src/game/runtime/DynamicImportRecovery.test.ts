import { describe, expect, it } from 'vitest';
import { shouldReloadForPreloadError } from './DynamicImportRecovery';

describe('dynamic import recovery', () => {
  it('reloads when there has not been a prior recovery', () => {
    expect(shouldReloadForPreloadError(null, 20_000)).toBe(true);
  });

  it('does not enter a reload loop inside the recovery cooldown', () => {
    expect(shouldReloadForPreloadError(15_001, 20_000)).toBe(false);
  });

  it('allows a later independent stale-chunk recovery', () => {
    expect(shouldReloadForPreloadError(10_000, 20_000)).toBe(true);
  });
});
