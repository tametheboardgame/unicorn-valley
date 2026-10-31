import {
  FULL_CELL_COUNT,
  RESONANCE_PATTERNS,
  isCrystalariumFullState,
  type CrystalariumFullState,
  type CrystalGoal,
  type ResonancePattern,
} from './CrystalariumFullRules';

export const CRYSTALARIUM_QUEUE_VERSION = 2 as const;

/**
 * C18 gate-B candidate: a complete, independent state model. The active v1
 * gameplay and save writers remain unchanged until the migration gate.
 *
 * completed is a derived compatibility field: it must always match the
 * completed-ID ledger length, even when patterns are offered out of order.
 */
export interface CrystalariumQueueState extends Omit<CrystalariumFullState, 'version'> {
  readonly version: typeof CRYSTALARIUM_QUEUE_VERSION;
  readonly completedPatternIds: readonly string[];
  /** Canonical, monotonic reveal cursor. Never shuffle existing cards. */
  readonly revealedCount: number;
}

export type QueueActionResult =
  | {
      readonly accepted: true;
      readonly state: CrystalariumQueueState;
      readonly message: string;
    }
  | {
      readonly accepted: false;
      readonly state: CrystalariumQueueState;
      readonly reason: string;
    };

const PATTERNS_BY_ID = new Map(RESONANCE_PATTERNS.map((pattern) => [pattern.id, pattern]));
const LEGACY_COUNT = RESONANCE_PATTERNS.length;

function activeSlots(completed: number): number {
  if (completed === 0) return 1;
  if (completed < 10) return 2;
  return 3;
}

/** Minimum reveal frontier needed for the active lane at this progress count. */
function minimumRevealed(completed: number): number {
  return Math.min(LEGACY_COUNT, completed + activeSlots(completed));
}

/** Snapshot all legacy fields. The migration never destroys a piece or counter. */
export function migrateCrystalariumQueue(
  old: CrystalariumFullState,
): CrystalariumQueueState | null {
  if (!isCrystalariumFullState(old)) return null;
  const completedPatternIds = RESONANCE_PATTERNS.slice(0, old.completed).map(
    (pattern) => pattern.id,
  );
  return {
    ...old,
    version: CRYSTALARIUM_QUEUE_VERSION,
    completedPatternIds,
    revealedCount: minimumRevealed(old.completed),
  };
}

export function isCrystalariumQueueState(value: unknown): value is CrystalariumQueueState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const raw = value as Partial<CrystalariumQueueState>;
  if (raw.version !== CRYSTALARIUM_QUEUE_VERSION) return false;
  // Reuse the same strict piece, shelf, counters and family validation as v1.
  if (!isCrystalariumFullState({ ...raw, version: 1 })) return false;
  if (!Array.isArray(raw.completedPatternIds) || !Number.isInteger(raw.revealedCount)) {
    return false;
  }
  const ids = raw.completedPatternIds;
  if (
    ids.length !== raw.completed ||
    new Set(ids).size !== ids.length ||
    Number(raw.revealedCount) < ids.length ||
    Number(raw.revealedCount) > LEGACY_COUNT ||
    Number(raw.revealedCount) < minimumRevealed(ids.length)
  ) {
    return false;
  }
  const revealedIds = new Set(
    RESONANCE_PATTERNS.slice(0, Number(raw.revealedCount)).map((pattern) => pattern.id),
  );
  return ids.every((id) => typeof id === 'string' && revealedIds.has(id));
}

/** Active, stable, authored order cards in the original reveal order. */
export function activeResonanceQueue(
  state: CrystalariumQueueState,
): readonly ResonancePattern[] {
  const completed = new Set(state.completedPatternIds);
  return RESONANCE_PATTERNS.slice(0, state.revealedCount).filter(
    (pattern) => !completed.has(pattern.id),
  );
}

function requiredIndices(
  state: CrystalariumQueueState,
  goals: readonly CrystalGoal[],
): number[] | null {
  const inventory = [...state.cells, ...state.shelf];
  const taken = new Set<number>();
  for (const request of goals) {
    for (let quantity = 0; quantity < request.quantity; quantity += 1) {
      const index = inventory.findIndex(
        (piece, at) =>
          !taken.has(at) && piece?.family === request.family && piece.tier === request.tier,
      );
      if (index < 0) return null;
      taken.add(index);
    }
  }
  return [...taken];
}

export function canOfferQueuedPattern(
  state: CrystalariumQueueState,
  patternId: string,
): boolean {
  const active = activeResonanceQueue(state).find((pattern) => pattern.id === patternId);
  return Boolean(
    active &&
      state.harmonies >= active.harmonies &&
      requiredIndices(state, active.goals) !== null,
  );
}

/**
 * All overlapping readiness is recomputed from the returned inventory.
 * Only a revealed, uncompleted and currently affordable order may consume
 * crystals, and only the exact indexed pieces are removed. No partial spend.
 */
export function offerQueuedPattern(
  state: CrystalariumQueueState,
  patternId: string,
): QueueActionResult {
  const pattern = PATTERNS_BY_ID.get(patternId);
  if (!pattern || !activeResonanceQueue(state).some((active) => active.id === patternId)) {
    return { accepted: false, state, reason: 'That Resonance Order is not active.' };
  }
  if (state.harmonies < pattern.harmonies) {
    return { accepted: false, state, reason: 'Craft another harmony before offering.' };
  }
  const indices = requiredIndices(state, pattern.goals);
  if (!indices) {
    return { accepted: false, state, reason: 'Collect the pictured crystals first.' };
  }
  const cells = [...state.cells];
  const shelf = [...state.shelf];
  for (const index of indices) {
    if (index < FULL_CELL_COUNT) cells[index] = null;
    else shelf[index - FULL_CELL_COUNT] = null;
  }
  const completedPatternIds = [...state.completedPatternIds, patternId];
  const completed = completedPatternIds.length;
  const remainingActive =
    state.revealedCount - completed;
  const desiredActive = Math.min(activeSlots(completed), LEGACY_COUNT - completed);
  const newlyRevealed = Math.max(0, desiredActive - remainingActive);
  const next: CrystalariumQueueState = {
    ...state,
    cells,
    shelf,
    harmonies: state.harmonies - pattern.harmonies,
    completedPatternIds,
    completed,
    offers: state.offers + 1,
    revealedCount: Math.min(LEGACY_COUNT, state.revealedCount + newlyRevealed),
  };
  return {
    accepted: true,
    state: next,
    message: 'Pattern complete! ' + pattern.title + ' is now part of the Crystalarium.',
  };
}

/** Fail closed for invalid or future versions; never silently reset a valid v1. */
export function readCrystalariumQueue(value: unknown): CrystalariumQueueState | null {
  if (isCrystalariumQueueState(value)) return value;
  if (isCrystalariumFullState(value)) return migrateCrystalariumQueue(value);
  return null;
}
