export interface TouchPresentationSignals {
  maxTouchPoints: number;
  hasTouchStart: boolean;
  hasCoarsePointer: boolean;
}

/**
 * The concept landscape composition is shared by touch tablets and landscape phones.
 * The historical function name is retained because a number of input/presentation callers
 * already depend on it, but a short landscape phone is intentionally no longer excluded.
 */
export function shouldUseLandscapeTabletPresentation(
  width: number,
  height: number,
  signals: TouchPresentationSignals,
): boolean {
  const touchCapable =
    signals.maxTouchPoints > 0 || signals.hasTouchStart || signals.hasCoarsePointer;
  const touchPrimary = signals.hasTouchStart || signals.hasCoarsePointer;
  const usableLandscapeViewport = width >= 568 && height >= 300 && width > height;
  return touchCapable && touchPrimary && usableLandscapeViewport;
}

export function browserUsesLandscapeTabletPresentation(): boolean {
  const coarsePointer =
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(pointer: coarse), (any-pointer: coarse)').matches;

  return shouldUseLandscapeTabletPresentation(globalThis.innerWidth, globalThis.innerHeight, {
    maxTouchPoints: globalThis.navigator?.maxTouchPoints ?? 0,
    hasTouchStart: 'ontouchstart' in globalThis,
    hasCoarsePointer: coarsePointer,
  });
}
