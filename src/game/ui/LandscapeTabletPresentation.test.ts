import { describe, expect, it } from 'vitest';
import { shouldUseLandscapeTabletPresentation } from './LandscapeTabletPresentation';

const touch = { maxTouchPoints: 5, hasTouchStart: false, hasCoarsePointer: true };

describe('landscape tablet presentation', () => {
  it('selects a touch-capable landscape tablet', () => {
    expect(shouldUseLandscapeTabletPresentation(1280, 800, touch)).toBe(true);
    expect(shouldUseLandscapeTabletPresentation(1024, 768, touch)).toBe(true);
  });

  it('does not mistake a short landscape phone for a tablet', () => {
    expect(shouldUseLandscapeTabletPresentation(844, 390, touch)).toBe(false);
  });

  it('does not use the landscape tablet shell in portrait', () => {
    expect(shouldUseLandscapeTabletPresentation(800, 1280, touch)).toBe(false);
  });

  it('does not use touch presentation on a conventional desktop', () => {
    expect(
      shouldUseLandscapeTabletPresentation(1280, 720, {
        maxTouchPoints: 0,
        hasTouchStart: false,
        hasCoarsePointer: false,
      }),
    ).toBe(false);
  });
});
