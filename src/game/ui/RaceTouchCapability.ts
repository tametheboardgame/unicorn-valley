export function isRaceTouchCapable(
  maxTouchPoints: number,
  hasTouchStart: boolean,
  hasCoarsePointer: boolean,
): boolean {
  return maxTouchPoints > 0 || hasTouchStart || hasCoarsePointer;
}

export function browserHasRaceTouchCapability(): boolean {
  const coarsePointer =
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(pointer: coarse), (any-pointer: coarse)').matches;
  return isRaceTouchCapable(
    globalThis.navigator?.maxTouchPoints ?? 0,
    'ontouchstart' in globalThis,
    coarsePointer,
  );
}
