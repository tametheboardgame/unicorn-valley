import { describe, expect, it } from 'vitest';
import {
  RESONANCE_PATTERNS,
  chooseCrystalSource,
  createCrystalariumFullState,
  createHarmony,
  isCrystalariumFullState,
  moveOrMergeCrystal,
  offerResonancePattern,
  shelveCrystal,
  spawnCrystal,
  washCrystal,
  type CrystalariumFullState,
  type FullActionResult,
} from './CrystalariumFullRules';
import type { CrystalFamily, CrystalTier } from './CrystalariumOpeningRules';

function accepted(result: FullActionResult): CrystalariumFullState {
  if (!result.accepted) throw new Error('Unsolvable generated action: ' + result.reason);
  expect(isCrystalariumFullState(result.state)).toBe(true);
  return result.state;
}

function clearBoard(state: CrystalariumFullState): CrystalariumFullState {
  let current = state;
  for (let i = 0; i < current.cells.length; i += 1) {
    if (current.cells[i]) current = accepted(washCrystal(current, i));
  }
  return current;
}

/**
 * Constructs any authored formation using only source selection, unlimited free
 * generation and canonical pair merges; no fabricated direct cell changes.
 */
function craft(
  state: CrystalariumFullState,
  family: CrystalFamily,
  tier: CrystalTier,
  putOnShelf: boolean,
): CrystalariumFullState {
  let current = accepted(chooseCrystalSource(state, family));
  for (let i = 0; i < 2 ** tier; i += 1) {
    current = accepted(spawnCrystal(current));
    while (true) {
      let source = -1;
      let target = -1;
      for (let candidateTier = 0; candidateTier < tier && source < 0; candidateTier += 1) {
        const indices: number[] = [];
        current.cells.forEach((piece, index) => {
          if (piece?.family === family && piece.tier === candidateTier) indices.push(index);
        });
        if (indices.length >= 2) {
          source = indices[0];
          target = indices[1];
        }
      }
      if (source < 0) break;
      current = accepted(moveOrMergeCrystal(current, source, target));
    }
  }
  const pieceIndex = current.cells.findIndex(
    (piece) => piece?.family === family && piece.tier === tier,
  );
  expect(pieceIndex).toBeGreaterThanOrEqual(0);
  if (putOnShelf) current = accepted(shelveCrystal(current, pieceIndex));
  return current;
}

describe('H6.9C complete fifty-pattern campaign solvability', () => {
  it('finishes every chapter by legal player actions without a timer, energy or softlock', () => {
    let state = createCrystalariumFullState();
    for (const pattern of RESONANCE_PATTERNS) {
      state = clearBoard(state);
      for (const goal of pattern.goals) {
        for (let i = 0; i < goal.quantity; i += 1) {
          state = craft(state, goal.family, goal.tier, true);
        }
      }
      while (state.harmonies < pattern.harmonies) {
        state = craft(state, 'low', 1, false);
        state = craft(state, 'bright', 1, false);
        state = craft(state, 'bell', 1, false);
        state = accepted(createHarmony(state));
      }
      const prior = state.completed;
      state = accepted(offerResonancePattern(state));
      expect(state.completed).toBe(prior + 1);
      expect(state.shelf.every((piece) => piece === null)).toBe(true);
    }
    expect(state.completed).toBe(50);
    expect(state.offers).toBe(50);
    expect(isCrystalariumFullState(JSON.parse(JSON.stringify(state)))).toBe(true);
  });
});
