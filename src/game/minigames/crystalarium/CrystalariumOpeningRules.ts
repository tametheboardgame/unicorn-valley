/**
 * H6.9A's engine-independent opening-round contract.
 *
 * H6.9B will use the same matching primitive inside the canonical Crystalarium
 * scene, rather than creating a separate story-door minigame. This file does
 * not grant quest progress or alter a save.
 */
export type CrystalFamily = 'low' | 'bright' | 'bell';
export type CrystalTier = 0 | 1 | 2 | 3 | 4 | 5;

export interface CrystalPiece {
  readonly family: CrystalFamily;
  readonly tier: CrystalTier;
}

export interface OpeningMelodyState {
  readonly cells: readonly (CrystalPiece | null)[];
  readonly notesPlayed: readonly CrystalFamily[];
  readonly complete: boolean;
}

export type OpeningMergeRejection =
  | 'already-complete'
  | 'invalid-cell'
  | 'same-cell'
  | 'empty-cell'
  | 'mismatched-pieces'
  | 'wrong-note';

export type OpeningMergeResult =
  | { readonly accepted: true; readonly note: CrystalFamily; readonly state: OpeningMelodyState }
  | {
      readonly accepted: false;
      readonly reason: OpeningMergeRejection;
      readonly state: OpeningMelodyState;
    };

export const CRYSTALARIUM_GAME_ID = 'crystalarium' as const;
export const CRYSTALARIUM_OPENING_VARIANT_ID = 'opening-melody' as const;
export const CRYSTALARIUM_FULL_VARIANT_ID = 'resonance-patterns' as const;

export const CRYSTAL_TIER_NAMES = [
  'Shard',
  'Polished shard',
  'Crystal',
  'Cluster',
  'Prism',
  'Rare formation',
] as const;

export const OPENING_MELODY = ['low', 'bright', 'bell'] as const;
export const OPENING_BOARD_COLUMNS = 4;
export const OPENING_BOARD_ROWS = 3;

export const CRYSTAL_NOTE_PRESENTATION = {
  low: { symbol: '●', label: 'Deep hum', colour: 0x568acc, pitch: 'low' },
  bright: { symbol: '◆', label: 'Clear ping', colour: 0x66d5ba, pitch: 'high' },
  bell: { symbol: '✦', label: 'Soft bell', colour: 0xb99aeb, pitch: 'bell' },
} as const;

export function makeCrystalPiece(family: CrystalFamily, tier: CrystalTier = 0): CrystalPiece {
  return { family, tier };
}

/** A repeatable six-piece board: three pairs, six empty slots, no random spawns. */
export function createOpeningMelodyState(): OpeningMelodyState {
  return {
    cells: [
      makeCrystalPiece('low'),
      makeCrystalPiece('bell'),
      makeCrystalPiece('bright'),
      null,
      makeCrystalPiece('bright'),
      makeCrystalPiece('low'),
      makeCrystalPiece('bell'),
      null,
      null,
      null,
      null,
      null,
    ],
    notesPlayed: [],
    complete: false,
  };
}

/**
 * The merge rule is shared with future full Crystalarium play:
 * two pieces of the same family and tier become one next-tier piece.
 * A separate scene/controller handles touch, keyboard, drag and animations.
 */
export function combineCrystalPieces(
  first: CrystalPiece,
  second: CrystalPiece,
): CrystalPiece | null {
  if (first.family !== second.family || first.tier !== second.tier || first.tier === 5) {
    return null;
  }
  return makeCrystalPiece(first.family, (first.tier + 1) as CrystalTier);
}

/**
 * Only the requested note can merge during the opening tutorial. Wrong-order
 * moves do not consume pieces, making every reachable state solvable.
 * Pair selection is positional but does not require adjacency: tap-tap,
 * keyboard and drag-and-drop can all issue the same two-slot action.
 */
export function playOpeningMerge(
  state: OpeningMelodyState,
  sourceIndex: number,
  targetIndex: number,
): OpeningMergeResult {
  const rejected = (reason: OpeningMergeRejection): OpeningMergeResult => ({
    accepted: false,
    reason,
    state,
  });
  if (state.complete) return rejected('already-complete');
  if (
    !Number.isInteger(sourceIndex) ||
    !Number.isInteger(targetIndex) ||
    sourceIndex < 0 ||
    targetIndex < 0 ||
    sourceIndex >= state.cells.length ||
    targetIndex >= state.cells.length
  ) {
    return rejected('invalid-cell');
  }
  if (sourceIndex === targetIndex) return rejected('same-cell');
  const source = state.cells[sourceIndex];
  const target = state.cells[targetIndex];
  if (!source || !target) return rejected('empty-cell');
  const result = combineCrystalPieces(source, target);
  if (!result) return rejected('mismatched-pieces');
  if (source.family !== OPENING_MELODY[state.notesPlayed.length]) {
    return rejected('wrong-note');
  }

  const cells = [...state.cells];
  cells[sourceIndex] = null;
  cells[targetIndex] = result;
  const notesPlayed = [...state.notesPlayed, source.family];
  return {
    accepted: true,
    note: source.family,
    state: {
      cells,
      notesPlayed,
      complete: notesPlayed.length === OPENING_MELODY.length,
    },
  };
}

export function availableOpeningMerges(
  state: OpeningMelodyState,
): readonly (readonly [number, number])[] {
  const moves: Array<readonly [number, number]> = [];
  for (let source = 0; source < state.cells.length; source += 1) {
    for (let target = source + 1; target < state.cells.length; target += 1) {
      if (playOpeningMerge(state, source, target).accepted) moves.push([source, target]);
    }
  }
  return moves;
}
