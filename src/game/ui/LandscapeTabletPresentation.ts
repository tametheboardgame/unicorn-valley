export interface TouchPresentationSignals {
  maxTouchPoints: number;
  hasTouchStart: boolean;
  hasCoarsePointer: boolean;
}

export function shouldUseLandscapeTabletPresentation(
  width: number,
  height: number,
  signals: TouchPresentationSignals,
): boolean {
  const touchCapable =
    signals.maxTouchPoints > 0 || signals.hasTouchStart || signals.hasCoarsePointer;
  return touchCapable && width >= 800 && height >= 500 && width > height;
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
