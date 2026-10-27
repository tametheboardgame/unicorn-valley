import { canOfferPattern, type CrystalariumFullState } from './CrystalariumFullRules';
import { combineCrystalPieces } from './CrystalariumOpeningRules';

export type FirstLessonStep = 'grow' | 'pick-up' | 'merge' | 'inspect' | 'offer';
export type FirstLessonCommand =
  | { readonly kind: 'grow' }
  | { readonly kind: 'pick'; readonly index: number }
  | { readonly kind: 'merge'; readonly source: number; readonly target: number }
  | { readonly kind: 'inspect' }
  | { readonly kind: 'offer' }
  | { readonly kind: 'other' };

export interface TutorialPair {
  readonly source: number;
  readonly target: number;
}

/**
 * Determine a genuine legal teaching pair. Prefer the latest generated shard,
 * which normally occupies the highest used socket on the untouched starter board.
 * Never modify the campaign simply to make a tutorial possible.
 */
export function firstLessonPair(state: CrystalariumFullState): TutorialPair | null {
  for (let source = state.cells.length - 1; source >= 0; source -= 1) {
    const piece = state.cells[source];
    if (!piece) continue;
    for (let target = 0; target < state.cells.length; target += 1) {
      if (source === target) continue;
      const other = state.cells[target];
      if (other && combineCrystalPieces(piece, other)) return { source, target };
    }
  }
  return null;
}

/** A reloaded or migrated campaign must never get trapped in an impossible lesson. */
export function feasibleFirstLesson(
  state: CrystalariumFullState,
): { readonly step: FirstLessonStep; readonly pair: TutorialPair | null } | null {
  if (state.completed !== 0) return null;
  if (canOfferPattern(state)) return { step: 'inspect', pair: null };
  if (state.merges > 0) return null;
  if (state.cells.filter(Boolean).length < 3) {
    return state.cells.some((cell) => cell === null) ? { step: 'grow', pair: null } : null;
  }
  const pair = firstLessonPair(state);
  return pair ? { step: 'pick-up', pair } : null;
}

/**
 * Pure before-the-controller allowlist. Skip, Leave, Help and Sound are never
 * passed to this policy; they must remain available from the outer game shell.
 * The actual controller must check this BEFORE invoking gameplay rules/saves.
 */
export function firstLessonAllows(
  step: FirstLessonStep,
  pair: TutorialPair | null,
  action: FirstLessonCommand,
): boolean {
  switch (step) {
    case 'grow':
      return action.kind === 'grow';
    case 'pick-up':
      return action.kind === 'pick' && pair !== null && action.index === pair.source;
    case 'merge':
      return (
        action.kind === 'merge' &&
        pair !== null &&
        action.source === pair.source &&
        action.target === pair.target
      );
    case 'inspect':
      return action.kind === 'inspect';
    case 'offer':
      return action.kind === 'offer';
  }
}
