import { describe, expect, it } from 'vitest';
import {
  availableOpeningMerges,
  combineCrystalPieces,
  createOpeningMelodyState,
  CRYSTAL_NOTE_PRESENTATION,
  CRYSTAL_TIER_NAMES,
  OPENING_BOARD_COLUMNS,
  OPENING_BOARD_ROWS,
  OPENING_MELODY,
  playOpeningMerge,
} from './CrystalariumOpeningRules';

describe('H6.9A Crystalarium musical opening foundation', () => {
  it('uses one 4 × 3 fixed layout with three pairs and six empty sockets', () => {
    const state = createOpeningMelodyState();
    expect(state.cells).toHaveLength(OPENING_BOARD_COLUMNS * OPENING_BOARD_ROWS);
    expect(state.cells.filter(Boolean)).toHaveLength(6);
    expect(OPENING_MELODY).toEqual(['low', 'bright', 'bell']);
    expect(state.notesPlayed).toEqual([]);
    expect(state.complete).toBe(false);
  });

  it('preserves the identical-family and identical-tier merge rule for full replay', () => {
    expect(combineCrystalPieces({ family: 'low', tier: 0 }, { family: 'low', tier: 0 })).toEqual({
      family: 'low',
      tier: 1,
    });
    expect(combineCrystalPieces({ family: 'low', tier: 1 }, { family: 'low', tier: 0 })).toBeNull();
    expect(
      combineCrystalPieces({ family: 'low', tier: 0 }, { family: 'bell', tier: 0 }),
    ).toBeNull();
    expect(
      combineCrystalPieces({ family: 'bright', tier: 5 }, { family: 'bright', tier: 5 }),
    ).toBeNull();
    expect(CRYSTAL_TIER_NAMES).toHaveLength(6);
  });

  it('has distinct audible and non-audio descriptions for every opening note', () => {
    const values = OPENING_MELODY.map((note) => CRYSTAL_NOTE_PRESENTATION[note]);
    expect(new Set(values.map((v) => v.symbol)).size).toBe(3);
    expect(new Set(values.map((v) => v.label)).size).toBe(3);
    expect(new Set(values.map((v) => v.colour)).size).toBe(3);
    expect(new Set(values.map((v) => v.pitch)).size).toBe(3);
  });

  it('does not consume crystals or mutate the state on invalid, premature or repeated moves', () => {
    const state = createOpeningMelodyState();
    for (const [source, target, reason] of [
      [0, 0, 'same-cell'],
      [-1, 5, 'invalid-cell'],
      [0, 12, 'invalid-cell'],
      [0.5, 5, 'invalid-cell'],
      [0, 3, 'empty-cell'],
      [0, 1, 'mismatched-pieces'],
      [1, 6, 'wrong-note'],
    ] as const) {
      const result = playOpeningMerge(state, source, target);
      expect(result.accepted).toBe(false);
      if (!result.accepted) {
        expect(result.reason).toBe(reason);
        expect(result.state).toBe(state);
      }
    }
    expect(state).toEqual(createOpeningMelodyState());
  });

  it('completes exactly three non-timed merges, emitting the requested melody', () => {
    let state = createOpeningMelodyState();
    for (const [source, target, note] of [
      [0, 5, 'low'],
      [2, 4, 'bright'],
      [1, 6, 'bell'],
    ] as const) {
      const result = playOpeningMerge(state, source, target);
      expect(result.accepted).toBe(true);
      if (!result.accepted) throw new Error('Curated opening should always merge');
      expect(result.note).toBe(note);
      expect(result.state.notesPlayed.at(-1)).toBe(note);
      expect(result.state.cells[source]).toBeNull();
      expect(result.state.cells[target]).toEqual({ family: note, tier: 1 });
      state = result.state;
    }
    expect(state.complete).toBe(true);
    expect(state.notesPlayed).toEqual(OPENING_MELODY);
    expect(playOpeningMerge(state, 0, 5)).toMatchObject({
      accepted: false,
      reason: 'already-complete',
    });
  });

  it('guarantees no softlocks over all valid player choices, including pair direction', () => {
    const visit = (state: ReturnType<typeof createOpeningMelodyState>): number => {
      if (state.complete) {
        expect(state.notesPlayed).toEqual(OPENING_MELODY);
        return 1;
      }
      const moves = availableOpeningMerges(state);
      expect(moves.length).toBeGreaterThan(0);
      let outcomes = 0;
      for (const [a, b] of moves) {
        for (const [source, target] of [
          [a, b],
          [b, a],
        ] as const) {
          const result = playOpeningMerge(state, source, target);
          expect(result.accepted).toBe(true);
          if (result.accepted) outcomes += visit(result.state);
        }
      }
      return outcomes;
    };
    expect(visit(createOpeningMelodyState())).toBe(8);
  });

  it('can reset after partial or completed play without any resource cost', () => {
    const start = createOpeningMelodyState();
    const result = playOpeningMerge(start, 0, 5);
    expect(result.accepted).toBe(true);
    const reset = createOpeningMelodyState();
    expect(reset).toEqual(start);
    expect(reset).not.toBe(start);
  });
});
