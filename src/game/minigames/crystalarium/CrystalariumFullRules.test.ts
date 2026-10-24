import { describe, expect, it } from 'vitest';
import {
  RESONANCE_CHAPTERS,
  RESONANCE_PATTERNS,
  FULL_CELL_COUNT,
  createCrystalariumFullState,
  isCrystalariumFullState,
  moveOrMergeCrystal,
  spawnCrystal,
  washCrystal,
  shelveCrystal,
  restoreCrystal,
  canOfferPattern,
  offerResonancePattern,
  unlockedCrystalFamilies,
  chooseCrystalSource,
  createHarmony,
  polishCrystal,
  startFreshCrystalariumBoard,
} from './CrystalariumFullRules';

describe('H6.9C Crystalarium deep merge mechanics', () => {
  it('defines a complete five-chapter, fifty-pattern game on 42 cells', () => {
    const state = createCrystalariumFullState();
    expect(state.cells).toHaveLength(FULL_CELL_COUNT);
    expect(state.shelf).toHaveLength(4);
    expect(RESONANCE_CHAPTERS).toHaveLength(5);
    expect(RESONANCE_PATTERNS).toHaveLength(50);
    expect(new Set(RESONANCE_PATTERNS.map((p) => p.id)).size).toBe(50);
    expect(isCrystalariumFullState(state)).toBe(true);
  });
  it('rejects malformed persisted boards and invalid merges', () => {
    const original = createCrystalariumFullState();
    expect(isCrystalariumFullState({ ...original, cells: [] })).toBe(false);
    expect(isCrystalariumFullState({ ...original, completed: 60 })).toBe(false);
    const previous = JSON.stringify(original);
    expect(moveOrMergeCrystal(original, 0, 0).accepted).toBe(false);
    expect(moveOrMergeCrystal(original, 0, 50).accepted).toBe(false);
    expect(JSON.stringify(original)).toBe(previous);
  });
  it('uses the canonical same-family, same-tier merge and accepts exact pattern offerings', () => {
    const initial = createCrystalariumFullState();
    const result = moveOrMergeCrystal(initial, 0, 1);
    expect(result.accepted).toBe(true);
    expect(result.state.cells[1]).toEqual({ family: 'low', tier: 1 });
    expect(canOfferPattern(result.state)).toBe(true);
    const offered = offerResonancePattern(result.state);
    expect(offered.accepted).toBe(true);
    expect(offered.state.completed).toBe(1);
    expect(offered.state.cells.filter(Boolean)).toHaveLength(0);
    expect(offerResonancePattern(offered.state).accepted).toBe(false);
  });
  it('supports unlimited generation and cost-free rescue even when all spaces fill', () => {
    let state = createCrystalariumFullState();
    for (let i = 0; i < 40; i += 1) state = spawnCrystal(state).state;
    expect(state.cells.every(Boolean)).toBe(true);
    expect(spawnCrystal(state).accepted).toBe(false);
    state = washCrystal(state, 9).state;
    expect(spawnCrystal(state).accepted).toBe(true);
  });
  it('stores pieces in a four-slot shelf and restores them safely', () => {
    let state = createCrystalariumFullState();
    state = shelveCrystal(state, 0).state;
    expect(state.shelf[0]).toEqual({ family: 'low', tier: 0 });
    state = restoreCrystal(state, 0).state;
    expect(state.shelf[0]).toBeNull();
    expect(state.cells.filter(Boolean)).toHaveLength(2);
  });
  it('gradually unlocks families and a voluntary three-family harmony', () => {
    const initial = createCrystalariumFullState();
    expect(unlockedCrystalFamilies(initial)).toEqual(['low']);
    expect(chooseCrystalSource(initial, 'bell').accepted).toBe(false);
    expect(unlockedCrystalFamilies({ ...initial, completed: 7 })).toHaveLength(3);
    const cells = [...initial.cells];
    cells[0] = { family: 'low' as const, tier: 1 as const };
    cells[1] = { family: 'bright' as const, tier: 1 as const };
    cells[2] = { family: 'bell' as const, tier: 1 as const };
    const result = createHarmony({ ...initial, completed: 10, cells });
    expect(result.accepted).toBe(true);
    expect(result.state.harmonies).toBe(1);
  });
  it('spends a crafted harmony to polish only after the workshop unlocks', () => {
    const initial = createCrystalariumFullState();
    const before = JSON.stringify(initial);
    expect(polishCrystal(initial, 0).accepted).toBe(false);
    expect(JSON.stringify(initial)).toBe(before);
    const workshop = { ...initial, completed: 22, harmonies: 1 };
    const result = polishCrystal(workshop, 0);
    expect(result.accepted).toBe(true);
    expect(result.state.cells[0]).toEqual({ family: 'low', tier: 1 });
    expect(result.state.harmonies).toBe(0);
    expect(polishCrystal(result.state, 1).accepted).toBe(false);
    const reset = startFreshCrystalariumBoard(workshop);
    expect(reset.completed).toBe(22);
    expect(reset.harmonies).toBe(1);
  });
});
