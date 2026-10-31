import { describe, expect, it } from 'vitest';
import {
  RESONANCE_PATTERNS,
  createCrystalariumFullState,
  type CrystalariumFullState,
} from './CrystalariumFullRules';
import {
  activeResonanceQueue,
  canOfferQueuedPattern,
  isCrystalariumQueueState,
  migrateCrystalariumQueue,
  offerQueuedPattern,
  readCrystalariumQueue,
  type CrystalariumQueueState,
} from './CrystalariumMultiOrderRules';
import type { CrystalPiece } from './CrystalariumOpeningRules';

function migrate(completed = 0): CrystalariumQueueState {
  const result = migrateCrystalariumQueue({
    ...createCrystalariumFullState(),
    completed,
  });
  if (!result) throw new Error('Valid legacy progress must migrate');
  return result;
}

function withPieces(
  state: CrystalariumQueueState,
  pieces: readonly CrystalPiece[],
  shelfPieces: readonly CrystalPiece[] = [],
): CrystalariumQueueState {
  if (pieces.length > state.cells.length || shelfPieces.length > state.shelf.length) {
    throw new Error('Fixture would overflow board/shelf');
  }
  const cells: (CrystalPiece | null)[] = Array.from(
    { length: state.cells.length },
    (_, index) => pieces[index] ?? null,
  );
  const shelf: (CrystalPiece | null)[] = Array.from(
    { length: state.shelf.length },
    (_, index) => shelfPieces[index] ?? null,
  );
  return { ...state, cells, shelf };
}

describe('C18 gate B multi-order pure model', () => {
  it('migrates legacy 0, 1, 4, 7, 10, 49 and 50 without dropping any inventory or counters', () => {
    for (const completed of [0, 1, 4, 7, 10, 49, 50]) {
      const seed = createCrystalariumFullState();
      const cells = [...seed.cells];
      cells[9] = { family: 'bell', tier: 5 };
      const shelf = [...seed.shelf];
      shelf[3] = { family: 'bright', tier: 3 };
      const legacy: CrystalariumFullState = {
        ...seed,
        cells,
        shelf,
        completed,
        offers: 51,
        merges: 20,
        washes: 17,
        harmonies: 9,
        selectedFamily: 'bright',
        discovered: ['low:0', 'bell:5'],
      };
      const before = JSON.stringify(legacy);
      const newState = migrateCrystalariumQueue(legacy);
      expect(newState).not.toBeNull();
      if (!newState) throw new Error('migration failed');
      expect(isCrystalariumQueueState(newState)).toBe(true);
      expect(newState.version).toBe(2);
      expect(newState.completedPatternIds).toEqual(
        RESONANCE_PATTERNS.slice(0, completed).map((pattern) => pattern.id),
      );
      for (const key of [
        'cells',
        'shelf',
        'merges',
        'washes',
        'offers',
        'harmonies',
        'discovered',
        'selectedFamily',
        'completed',
      ] as const) {
        expect(newState[key]).toEqual(legacy[key]);
      }
      expect(activeResonanceQueue(newState)).toHaveLength(
        Math.min(completed === 0 ? 1 : completed < 10 ? 2 : 3, 50 - completed),
      );
      expect(JSON.stringify(legacy)).toBe(before);
      expect(readCrystalariumQueue(newState)).toBe(newState);
      expect(JSON.stringify(readCrystalariumQueue(legacy))).toBe(JSON.stringify(newState));
    }
  });

  it('after the first offer reveals two active cards, preserves canonical order and fills vacancies', () => {
    const start = migrate();
    expect(activeResonanceQueue(start).map((order) => order.title)).toEqual(['First Hum']);
    const first = withPieces(start, [{ family: 'low', tier: 1 }]);
    const offered = offerQueuedPattern(first, RESONANCE_PATTERNS[0].id);
    expect(offered.accepted).toBe(true);
    if (!offered.accepted) return;
    expect(offered.state.completed).toBe(1);
    expect(offered.state.revealedCount).toBe(3);
    expect(activeResonanceQueue(offered.state).map((order) => order.title)).toEqual([
      'Double Echo',
      'Clearer Tone',
    ]);
    expect(isCrystalariumQueueState(offered.state)).toBe(true);
  });

  it('consumes one chosen ready card atomically, then recalculates overlapping readiness', () => {
    // Clearer Tone needs one Low tier-two crystal. Pair of Crystals needs
    // the SAME tier-two crystal plus a tier-one crystal.
    const start = withPieces(migrate(2), [
      { family: 'low', tier: 2 },
      { family: 'low', tier: 1 },
    ]);
    const firstId = RESONANCE_PATTERNS[2].id;
    const secondId = RESONANCE_PATTERNS[3].id;
    expect(canOfferQueuedPattern(start, firstId)).toBe(true);
    expect(canOfferQueuedPattern(start, secondId)).toBe(true);
    const firstResult = offerQueuedPattern(start, firstId);
    expect(firstResult.accepted).toBe(true);
    if (!firstResult.accepted) return;
    const next = firstResult.state;
    expect(next.completedPatternIds).toEqual([
      RESONANCE_PATTERNS[0].id,
      RESONANCE_PATTERNS[1].id,
      firstId,
    ]);
    expect(next.offers).toBe(start.offers + 1);
    expect(next.cells.filter(Boolean)).toHaveLength(1);
    expect(next.revealedCount).toBe(5);
    expect(activeResonanceQueue(next).map((pattern) => pattern.id)).toEqual([
      secondId,
      RESONANCE_PATTERNS[4].id,
    ]);
    expect(canOfferQueuedPattern(next, secondId)).toBe(false);
    const beforeRetry = JSON.stringify(next);
    const rejected = offerQueuedPattern(next, secondId);
    expect(rejected.accepted).toBe(false);
    expect(rejected.state).toBe(next);
    expect(JSON.stringify(next)).toBe(beforeRetry);
  });

  it('cannot offer locked, completed, unknown or unaffordable IDs or double-spend pieces', () => {
    const original = migrate(1);
    const snapshot = JSON.stringify(original);
    for (const patternId of [
      RESONANCE_PATTERNS[0].id,
      RESONANCE_PATTERNS[9].id,
      'crystalarium:not-real',
    ]) {
      const result = offerQueuedPattern(original, patternId);
      expect(result.accepted).toBe(false);
      expect(result.state).toBe(original);
    }
    expect(offerQueuedPattern(original, RESONANCE_PATTERNS[1].id).accepted).toBe(false);
    expect(JSON.stringify(original)).toBe(snapshot);
    const ready = withPieces(
      original,
      [],
      [
        { family: 'low', tier: 1 },
        { family: 'low', tier: 1 },
      ],
    );
    const once = offerQueuedPattern(ready, RESONANCE_PATTERNS[1].id);
    expect(once.accepted).toBe(true);
    if (!once.accepted) return;
    expect(once.state.shelf.every((piece) => piece === null)).toBe(true);
    expect(offerQueuedPattern(once.state, RESONANCE_PATTERNS[1].id).accepted).toBe(false);
    expect(JSON.stringify(ready)).not.toBe(JSON.stringify(once.state));
  });

  it('deducts harmonies once and never destroys unrelated board or shelf pieces', () => {
    const target = RESONANCE_PATTERNS[13];
    expect(target.harmonies).toBe(1);
    const state = withPieces(
      { ...migrate(13), harmonies: 2 },
      [
        { family: 'low', tier: 1 },
        { family: 'bell', tier: 1 },
        { family: 'bright', tier: 1 },
        { family: 'low', tier: 5 },
      ],
      [{ family: 'bell', tier: 4 }],
    );
    expect(canOfferQueuedPattern(state, target.id)).toBe(true);
    const result = offerQueuedPattern(state, target.id);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.state.harmonies).toBe(1);
    expect(result.state.cells[3]).toEqual({ family: 'low', tier: 5 });
    expect(result.state.shelf[0]).toEqual({ family: 'bell', tier: 4 });
    expect(result.state.cells.slice(0, 3)).toEqual([null, null, null]);
  });

  it('rejects corrupt, duplicate, forged, future and non-revealed v2 records without writes', () => {
    const state = migrate(4);
    for (const malformed of [
      { ...state, version: 3 },
      { ...state, completed: 50 },
      { ...state, completedPatternIds: [RESONANCE_PATTERNS[0].id, RESONANCE_PATTERNS[0].id] },
      { ...state, completedPatternIds: [...state.completedPatternIds, 'forged'] },
      {
        ...state,
        completedPatternIds: [RESONANCE_PATTERNS[49].id, ...state.completedPatternIds.slice(1)],
      },
      { ...state, revealedCount: 1 },
      { ...state, revealedCount: 99 },
      { ...state, shelf: [] },
      { ...state, cells: Array(42).fill({ family: 'low', tier: 99 }) },
    ]) {
      expect(isCrystalariumQueueState(malformed)).toBe(false);
      expect(readCrystalariumQueue(malformed)).toBeNull();
    }
    expect(
      migrateCrystalariumQueue({ ...createCrystalariumFullState(), version: 9 } as never),
    ).toBeNull();
  });

  it('can complete all 50 authored orders in nonsequential selection with stable reveal cursor', () => {
    let current = migrate();
    const offered = new Set<string>();
    while (activeResonanceQueue(current).length > 0) {
      const visible = activeResonanceQueue(current);
      const pattern = visible[visible.length - 1];
      // The established campaign solver separately proves every formation can
      // be crafted by legal free growth/merge actions. This tests the queue's
      // atomic fulfilment, revealing and cross-chapter nonsequential order.
      const pieces: CrystalPiece[] = pattern.goals.flatMap((goal) =>
        Array.from({ length: goal.quantity }, () => ({
          family: goal.family,
          tier: goal.tier,
        })),
      );
      current = withPieces({ ...current, harmonies: pattern.harmonies }, pieces);
      expect(canOfferQueuedPattern(current, pattern.id)).toBe(true);
      const next = offerQueuedPattern(current, pattern.id);
      expect(next.accepted).toBe(true);
      if (!next.accepted) throw new Error('Authored order rejected: ' + pattern.title);
      expect(next.state.revealedCount).toBeGreaterThanOrEqual(current.revealedCount);
      expect(next.state.completed).toBe(current.completed + 1);
      expect(isCrystalariumQueueState(next.state)).toBe(true);
      expect(offered.has(pattern.id)).toBe(false);
      offered.add(pattern.id);
      current = next.state;
    }
    expect(offered.size).toBe(50);
    expect(current.completed).toBe(50);
    expect(current.offers).toBe(50);
    expect(current.revealedCount).toBe(50);
    expect(activeResonanceQueue(current)).toHaveLength(0);
    expect(current.completedPatternIds).toHaveLength(50);
  });
});
