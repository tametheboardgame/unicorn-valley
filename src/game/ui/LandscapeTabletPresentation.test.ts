import { describe, expect, it } from 'vitest';
import { shouldUseLandscapeTabletPresentation } from './LandscapeTabletPresentation';

const touch = { maxTouchPoints: 5, hasTouchStart: false, hasCoarsePointer: true };

describe('shared landscape touch presentation', () => {
  it('selects touch-primary landscape tablets', () => {
    expect(shouldUseLandscapeTabletPresentation(1280, 800, touch)).toBe(true);
    expect(shouldUseLandscapeTabletPresentation(1024, 768, touch)).toBe(true);
  });

  it('uses the same concept composition on a landscape phone', () => {
    expect(shouldUseLandscapeTabletPresentation(844, 390, touch)).toBe(true);
    expect(shouldUseLandscapeTabletPresentation(740, 360, touch)).toBe(true);
  });

  it('keeps portrait phones on their dedicated below-game arrangement', () => {
    expect(shouldUseLandscapeTabletPresentation(390, 844, touch)).toBe(false);
    expect(shouldUseLandscapeTabletPresentation(700, 900, touch)).toBe(false);
  });

  it('rejects viewports too small to contain the landscape composition safely', () => {
    expect(shouldUseLandscapeTabletPresentation(540, 280, touch)).toBe(false);
  });

  it('keeps a fine-pointer hybrid on the secondary touch layout', () => {
    expect(
      shouldUseLandscapeTabletPresentation(1024, 768, {
        maxTouchPoints: 5,
        hasTouchStart: false,
        hasCoarsePointer: false,
      }),
    ).toBe(false);
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
