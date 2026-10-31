import { describe, expect, it } from 'vitest';
import { createCrystalariumFullState, growCrystalFromWell, moveOrMergeCrystal, spawnRefinedCrystal } from './CrystalariumFullRules';
import {
  POTION_CAPACITY,
  POTION_BASIC_COST,
  POTION_MERGE_REWARD,
  POTION_REFINED_COST,
  POTION_SPRING_REFILL,
  applyCrystalariumPotion,
  isCrystalariumPotionState,
  potionChamber,
  readCrystalariumPotion,
  refillCrystalariumPotion,
} from './CrystalariumPotionRules';

const fresh = () => {
  const state = readCrystalariumPotion(createCrystalariumFullState());
  if (!state) throw new Error('C20 default migration failed');
  return state;
};

describe('C20 approved live potion rules, single-state atomicity', () => {
  it('starts a 100-drop v4 state and upgrades all 12 slots and both starter pieces', () => {
    const old = createCrystalariumFullState();
    const updated = fresh();
    expect(updated.version).toBe(4);
    expect(updated.potion).toBe(POTION_CAPACITY);
    expect(updated.cells).toEqual(old.cells);
    expect(updated.shelf).toHaveLength(12);
    expect(isCrystalariumPotionState(updated)).toBe(true);
    expect(potionChamber(updated).version).toBe(3);
    expect(readCrystalariumPotion(updated)).toBe(updated);
  });

  it('spends one drop for saved normal growth while retaining its well source', () => {
    const state = fresh();
    const grown = applyCrystalariumPotion(state, growCrystalFromWell(state, 'low'), 'basic');
    expect(grown.accepted).toBe(true);
    if (!grown.accepted) return;
    expect(grown.state.potion).toBe(99);
    expect(grown.state.cells.filter(Boolean)).toHaveLength(3);
    expect(grown.state.selectedFamily).toBe('low');
    expect(state.potion).toBe(100);
    expect(POTION_BASIC_COST).toBe(1);
  });

  it('refined growth costs exactly two drops after its late unlock', () => {
    const state = { ...fresh(), completed: 20, potion: 2 };
    const grown = applyCrystalariumPotion(state, spawnRefinedCrystal(state), 'refined');
    expect(grown.accepted).toBe(true);
    if (!grown.accepted) return;
    expect(grown.state.potion).toBe(0);
    expect(POTION_REFINED_COST).toBe(2);
    expect(grown.state.cells[2]).toMatchObject({ tier: 1 });
  });

  it('awards one potion for accepted merges, not moves or rejected merges', () => {
    const state = { ...fresh(), potion: 0 };
    const result = applyCrystalariumPotion(state, moveOrMergeCrystal(state, 0, 1), undefined);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.state.potion).toBe(POTION_MERGE_REWARD);
    expect(result.state.merges).toBe(state.merges + 1);
    const next = applyCrystalariumPotion(result.state, moveOrMergeCrystal(result.state, 0, 1), undefined);
    expect(next.accepted).toBe(false);
    expect(next.state).toBe(result.state);
    expect(state.potion).toBe(0);
  });

  it('rejects unaffordable growth without adding a crystal or changing the original state', () => {
    for (const potion of [0, 1]) {
      const state = { ...fresh(), completed: 20, potion };
      const noRefined = applyCrystalariumPotion(state, spawnRefinedCrystal(state), 'refined');
      expect(noRefined.accepted).toBe(false);
      expect(noRefined.state).toBe(state);
      const basic = applyCrystalariumPotion(state, growCrystalFromWell(state, 'low'), 'basic');
      expect(basic.accepted).toBe(potion === 1);
    }
  });

  it('rejected full-board action at low stock cannot spend or reward potion', () => {
    const state = {
      ...fresh(),
      potion: 1,
      cells: Array.from({ length: 42 }, () => ({ family: 'low' as const, tier: 0 as const })),
    };
    const action = growCrystalFromWell(state, 'low');
    expect(action.accepted).toBe(false);
    const result = applyCrystalariumPotion(state, action, 'basic');
    expect(result.accepted).toBe(false);
    expect(result.state).toBe(state);
  });

  it('Brook Spring refills 25 drops without time or cost, caps at 100 and allows unlimited reuse', () => {
    expect(POTION_SPRING_REFILL).toBe(25);
    let state = { ...fresh(), potion: 0 };
    for (let i = 0; i < 4; i += 1) {
      const refilled = refillCrystalariumPotion(state);
      expect(refilled.accepted).toBe(true);
      const transition = applyCrystalariumPotion(state, refilled, 'refill');
      expect(transition.accepted).toBe(true);
      if (!transition.accepted) return;
      state = transition.state;
      expect(state.potion).toBe((i + 1) * 25);
    }
    const full = refillCrystalariumPotion(state);
    expect(full.accepted).toBe(false);
    expect(full.state).toBe(state);
    const almostFull = { ...state, potion: 90 };
    const capped = applyCrystalariumPotion(almostFull, refillCrystalariumPotion(almostFull), 'refill');
    expect(capped.accepted).toBe(true);
    if (capped.accepted) expect(capped.state.potion).toBe(100);
  });

  it('rejects malformed or future v4 records without truncating board or silently topping up', () => {
    const state = fresh();
    for (const bad of [
      { ...state, version: 5 },
      { ...state, version: 4, potion: -1 },
      { ...state, version: 4, potion: 101 },
      { ...state, version: 4, potion: 0.5 },
      { ...state, version: 4, potion: Number.NaN },
      { ...state, version: 4, potion: undefined },
      { ...state, version: 4, shelf: state.shelf.slice(0, 11) },
      { ...state, version: 4, cells: [] },
    ]) {
      expect(isCrystalariumPotionState(bad)).toBe(false);
      expect(readCrystalariumPotion(bad)).toBeNull();
    }
  });

  it('repeated zero-to-25 refill cycle never forces a real-world wait', () => {
    let state = { ...fresh(), potion: 0 };
    for (let i = 0; i < 250; i += 1) {
      if (state.potion === 0) {
        const refill = applyCrystalariumPotion(state, refillCrystalariumPotion(state), 'refill');
        expect(refill.accepted).toBe(true);
        if (!refill.accepted) return;
        state = refill.state;
      }
      // This isolates the approved potion debit, not a full board solver.
      const growth = applyCrystalariumPotion(
        state,
        {
          accepted: true,
          state: {
            ...state,
            cells: [...state.cells],
          },
          message: 'Simulated saved legal growth',
        },
        'basic',
      );
      expect(growth.accepted).toBe(true);
      if (!growth.accepted) return;
      state = growth.state;
    }
    expect(state.potion).toBe(0);
  });
});
