import {
  combineCrystalPieces,
  makeCrystalPiece,
  type CrystalFamily,
  type CrystalPiece,
  type CrystalTier,
} from './CrystalariumOpeningRules';

/** H6.9C shared deterministic rules: world and Just Games use exactly this engine. */
export const FULL_COLUMNS = 7;
export const FULL_ROWS = 6;
export const FULL_CELL_COUNT = FULL_COLUMNS * FULL_ROWS;
export const FULL_SHELF_COUNT = 4;
export const FULL_PROGRESS_VERSION = 1;
export const CRYSTAL_FAMILIES: readonly CrystalFamily[] = ['low', 'bright', 'bell'];

export interface CrystalGoal {
  readonly family: CrystalFamily;
  readonly tier: CrystalTier;
  readonly quantity: number;
}
export interface ResonancePattern {
  readonly id: string;
  readonly chapter: string;
  readonly title: string;
  readonly goals: readonly CrystalGoal[];
  readonly harmonies: number;
}
export interface CrystalariumFullState {
  readonly version: 1 | 2;
  /** C18 version 2 ledger. Absent for historical version 1 records. */
  readonly completedPatternIds?: readonly string[];
  readonly revealedCount?: number;
  readonly cells: readonly (CrystalPiece | null)[];
  readonly shelf: readonly (CrystalPiece | null)[];
  readonly completed: number;
  readonly merges: number;
  readonly offers: number;
  readonly washes: number;
  readonly harmonies: number;
  readonly discovered: readonly string[];
  readonly selectedFamily: CrystalFamily;
}
export type FullActionResult =
  | { readonly accepted: true; readonly state: CrystalariumFullState; readonly message: string }
  | { readonly accepted: false; readonly state: CrystalariumFullState; readonly reason: string };

const goal = (family: CrystalFamily, tier: CrystalTier, quantity = 1): CrystalGoal => ({
  family,
  tier,
  quantity,
});
const l = (tier: CrystalTier, quantity = 1): CrystalGoal => goal('low', tier, quantity);
const b = (tier: CrystalTier, quantity = 1): CrystalGoal => goal('bright', tier, quantity);
const s = (tier: CrystalTier, quantity = 1): CrystalGoal => goal('bell', tier, quantity);
type PatternInput = readonly [string, readonly CrystalGoal[], number?];
const CHAPTER_INPUT: readonly (readonly [string, readonly PatternInput[]])[] = [
  [
    'First Notes',
    [
      ['First Hum', [l(1)]],
      ['Double Echo', [l(1, 2)]],
      ['Clearer Tone', [l(2)]],
      ['Pair of Crystals', [l(2), l(1)]],
      ['The Bright Note', [b(1)]],
      ['Two Voices', [l(1), b(1)]],
      ['Brook Chorus', [l(2), b(2)]],
      ['A Gentle Bell', [s(1)]],
      ['Three Notes', [l(1), b(1), s(1)]],
      ['First Resonance', [l(3)]],
    ],
  ],
  [
    'River Nursery',
    [
      ['Nursery Light', [b(2)]],
      ['Little Lullaby', [s(2)]],
      ['Crystal Sprouts', [l(2), s(2)]],
      ['A Shared Song', [l(1), b(1), s(1)], 1],
      ['Water Glass', [b(3)]],
      ['Silver Ripples', [s(2), b(2)]],
      ['Low and High', [l(3), b(1)]],
      ['Threefold Garden', [l(2), b(2), s(2)]],
      ['Lantern Leaves', [b(3), s(1)]],
      ['River Promise', [l(3), s(3)]],
    ],
  ],
  [
    'Singing Pools',
    [
      ['Pool Reflection', [s(3)]],
      ['Crystal Duet', [l(3), b(2)]],
      ['Harmonic Tide', [b(2), s(2)], 1],
      ['Singing Mirror', [l(4)]],
      ['Deep Current', [l(2, 2), s(3)]],
      ['Pool of Stars', [b(3), s(3)]],
      ['Three Ripples', [l(2), b(2), s(2)], 1],
      ['Underwater Song', [s(4)]],
      ['The Blue Choir', [l(4), b(3)]],
      ['Moonlit Reflection', [l(3), s(4)]],
    ],
  ],
  [
    'Prism Workshop',
    [
      ['First Facets', [b(4)]],
      ['Fine Polishing', [l(3), b(3)]],
      ['Prism Waltz', [l(2), b(2), s(2)], 2],
      ['Glasswork', [s(4), b(1)]],
      ['Tuned Prism', [b(4), l(2)]],
      ['Grand Harmonic', [l(3), b(3), s(3)], 1],
      ['Sunlit Shards', [b(3, 2)]],
      ['Faceted Bells', [s(4), l(3)]],
      ['The Workshop Song', [l(4), b(4)]],
      ['Crystal Crown', [s(4), b(3)]],
    ],
  ],
  [
    'Great Harmonic Garden',
    [
      ['Garden Gate', [l(4), s(3)]],
      ['Morning Harmony', [l(2), b(2), s(2)], 2],
      ['The Prismatic Sky', [b(5)]],
      ['Ancient Bells', [s(5)]],
      ['Roots of Light', [l(5)]],
      ['Shimmering Canopy', [b(4), s(4)]],
      ['The Three Choirs', [l(3), b(3), s(3)], 2],
      ['The Great Song', [l(4), b(4), s(4)], 1],
      ['Garden of Echoes', [l(5), b(4)]],
      ['Crystalarium Symphony', [l(5), b(5), s(5)], 3],
    ],
  ],
];
export const RESONANCE_CHAPTERS: readonly string[] = CHAPTER_INPUT.map(([name]) => name);
export const RESONANCE_PATTERNS: readonly ResonancePattern[] = CHAPTER_INPUT.flatMap(
  ([chapter, entries], chapterIndex) =>
    entries.map(([title, goals, harmonies = 0], index) => ({
      id: 'crystalarium:' + (chapterIndex + 1) + '-' + (index + 1),
      chapter,
      title,
      goals,
      harmonies,
    })),
);

function validPiece(value: unknown): value is CrystalPiece {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const p = value as Partial<CrystalPiece>;
  return (
    CRYSTAL_FAMILIES.includes(p.family as CrystalFamily) &&
    Number.isInteger(p.tier) &&
    Number(p.tier) >= 0 &&
    Number(p.tier) <= 5
  );
}

export function isCrystalariumFullState(value: unknown): value is CrystalariumFullState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const state = value as Partial<CrystalariumFullState>;
  return (
    (state.version === FULL_PROGRESS_VERSION || state.version === 2) &&
    Array.isArray(state.cells) &&
    state.cells.length === FULL_CELL_COUNT &&
    state.cells.every((p) => p === null || validPiece(p)) &&
    Array.isArray(state.shelf) &&
    state.shelf.length === FULL_SHELF_COUNT &&
    state.shelf.every((p) => p === null || validPiece(p)) &&
    Number.isInteger(state.completed) &&
    Number(state.completed) >= 0 &&
    Number(state.completed) <= RESONANCE_PATTERNS.length &&
    [state.merges, state.offers, state.washes, state.harmonies].every(
      (n) => Number.isSafeInteger(n) && Number(n) >= 0,
    ) &&
    Array.isArray(state.discovered) &&
    state.discovered.length <= 25 &&
    state.discovered.every((d) => typeof d === 'string' && /^(low|bright|bell):[0-5]$/.test(d)) &&
    CRYSTAL_FAMILIES.includes(state.selectedFamily as CrystalFamily) &&
    (state.version === 1 ||
      (Array.isArray(state.completedPatternIds) &&
        state.completedPatternIds.length === state.completed &&
        new Set(state.completedPatternIds).size === state.completed &&
        state.completedPatternIds.every(
          (id) =>
            typeof id === 'string' &&
            RESONANCE_PATTERNS.slice(0, state.revealedCount).some((pattern) => pattern.id === id),
        ) &&
        Number.isInteger(state.revealedCount) &&
        Number(state.revealedCount) >= state.completed &&
        Number(state.revealedCount) <= RESONANCE_PATTERNS.length &&
        Number(state.revealedCount) >=
          Math.min(
            RESONANCE_PATTERNS.length,
            Number(state.completed) +
              (Number(state.completed) === 0 ? 1 : Number(state.completed) < 10 ? 2 : 3),
          )))
  );
}

export function createCrystalariumFullState(): CrystalariumFullState {
  const cells: (CrystalPiece | null)[] = Array.from({ length: FULL_CELL_COUNT }, () => null);
  cells[0] = makeCrystalPiece('low');
  cells[1] = makeCrystalPiece('low');
  return {
    version: 1,
    cells,
    shelf: Array.from({ length: FULL_SHELF_COUNT }, () => null),
    completed: 0,
    merges: 0,
    offers: 0,
    washes: 0,
    harmonies: 0,
    discovered: ['low:0'],
    selectedFamily: 'low',
  };
}

export function activeResonancePattern(state: CrystalariumFullState): ResonancePattern | null {
  if (state.version === 2 && state.completedPatternIds && state.revealedCount !== undefined) {
    const finished = new Set(state.completedPatternIds);
    return RESONANCE_PATTERNS.slice(0, state.revealedCount).find(
      (pattern) => !finished.has(pattern.id),
    ) ?? null;
  }
  return RESONANCE_PATTERNS[state.completed] ?? null;
}
export function unlockedCrystalFamilies(state: CrystalariumFullState): readonly CrystalFamily[] {
  return state.completed < 4 ? ['low'] : state.completed < 7 ? ['low', 'bright'] : CRYSTAL_FAMILIES;
}
const rejected = (state: CrystalariumFullState, reason: string): FullActionResult => ({
  accepted: false,
  state,
  reason,
});
const accepted = (state: CrystalariumFullState, message: string): FullActionResult => ({
  accepted: true,
  state,
  message,
});
function indexOK(index: number, length: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < length;
}

export function chooseCrystalSource(
  state: CrystalariumFullState,
  family: CrystalFamily,
): FullActionResult {
  if (!unlockedCrystalFamilies(state).includes(family))
    return rejected(state, 'That crystal vein is still sleeping.');
  return accepted({ ...state, selectedFamily: family }, 'Crystal vein selected.');
}
export function spawnCrystal(state: CrystalariumFullState): FullActionResult {
  if (!unlockedCrystalFamilies(state).includes(state.selectedFamily)) {
    return rejected(state, 'That crystal vein is still sleeping.');
  }
  const index = state.cells.indexOf(null);
  if (index < 0)
    return rejected(state, 'The board is full. Use Brook Wash or move a crystal to the shelf.');
  const cells = [...state.cells];
  cells[index] = makeCrystalPiece(state.selectedFamily);
  const discovery = state.selectedFamily + ':0';
  return accepted(
    {
      ...state,
      cells,
      discovered: state.discovered.includes(discovery)
        ? state.discovered
        : [...state.discovered, discovery],
    },
    'A new shard joins the board.',
  );
}
/**
 * Grow a free basic shard from the requested rooted board-frame well.
 * Source selection and creation are one atomic rule operation: a locked well or
 * full board must return the ORIGINAL state, without a selected-family change
 * or an intermediate save. No charges, timers or fluid exist at this gate.
 */
export function growCrystalFromWell(
  state: CrystalariumFullState,
  family: CrystalFamily,
): FullActionResult {
  const selected = chooseCrystalSource(state, family);
  if (!selected.accepted) return rejected(state, selected.reason);
  const grown = spawnCrystal(selected.state);
  if (!grown.accepted) return rejected(state, grown.reason);
  return accepted(grown.state, `A free ${family} shard grew from the crystal well.`);
}

/** Optional free advanced vein: reduces late-game repetition without replacing tier-zero shards. */
export function refinedSourceTier(state: CrystalariumFullState): CrystalTier | null {
  if (state.completed < 20) return null;
  return state.completed >= 40 ? 2 : 1;
}

export function spawnRefinedCrystal(state: CrystalariumFullState): FullActionResult {
  const tier = refinedSourceTier(state);
  if (tier === null) {
    return rejected(state, 'Restore the Singing Pools before using the refined crystal vein.');
  }
  if (!unlockedCrystalFamilies(state).includes(state.selectedFamily)) {
    return rejected(state, 'That crystal vein is still sleeping.');
  }
  const index = state.cells.indexOf(null);
  if (index < 0) {
    return rejected(state, 'The board is full. Use Brook Wash or free a shelf space.');
  }
  const cells = [...state.cells];
  cells[index] = makeCrystalPiece(state.selectedFamily, tier);
  const discovery = state.selectedFamily + ':' + tier;
  return accepted(
    {
      ...state,
      cells,
      discovered: state.discovered.includes(discovery)
        ? state.discovered
        : [...state.discovered, discovery],
    },
    'A refined crystal joins the board. The original shard source is still available.',
  );
}

export function moveOrMergeCrystal(
  state: CrystalariumFullState,
  source: number,
  target: number,
): FullActionResult {
  if (!indexOK(source, FULL_CELL_COUNT) || !indexOK(target, FULL_CELL_COUNT) || source === target) {
    return rejected(state, 'Choose two different sockets.');
  }
  const piece = state.cells[source];
  if (!piece) return rejected(state, 'Choose a crystal to move.');
  const other = state.cells[target];
  const upgrade = other ? combineCrystalPieces(piece, other) : null;
  if (other && !upgrade) return rejected(state, 'Match the same crystal and tier.');
  const cells = [...state.cells];
  cells[source] = null;
  cells[target] = upgrade ?? piece;
  const discovery = upgrade ? upgrade.family + ':' + upgrade.tier : null;
  return accepted(
    {
      ...state,
      cells,
      merges: state.merges + (upgrade ? 1 : 0),
      discovered:
        discovery && !state.discovered.includes(discovery)
          ? [...state.discovered, discovery]
          : state.discovered,
    },
    upgrade ? 'Resonance! Two crystals became one.' : 'Crystal moved.',
  );
}
export function shelveCrystal(state: CrystalariumFullState, cellIndex: number): FullActionResult {
  if (!indexOK(cellIndex, FULL_CELL_COUNT) || !state.cells[cellIndex])
    return rejected(state, 'Select a crystal first.');
  const slot = state.shelf.indexOf(null);
  if (slot < 0) return rejected(state, 'The shelf is full. Return a crystal first.');
  const cells = [...state.cells],
    shelf = [...state.shelf];
  shelf[slot] = cells[cellIndex];
  cells[cellIndex] = null;
  return accepted({ ...state, cells, shelf }, 'Stored safely on the shelf.');
}
export function restoreCrystal(state: CrystalariumFullState, shelfIndex: number): FullActionResult {
  if (!indexOK(shelfIndex, FULL_SHELF_COUNT) || !state.shelf[shelfIndex])
    return rejected(state, 'That shelf slot is empty.');
  const target = state.cells.indexOf(null);
  if (target < 0) return rejected(state, 'Use Brook Wash to clear a space first.');
  const cells = [...state.cells],
    shelf = [...state.shelf];
  cells[target] = shelf[shelfIndex];
  shelf[shelfIndex] = null;
  return accepted({ ...state, cells, shelf }, 'Crystal returned to the board.');
}
/** Restoring to an explicit free socket supports true shelf-to-board dragging. */
export function restoreCrystalToCell(
  state: CrystalariumFullState,
  shelfIndex: number,
  targetIndex: number,
): FullActionResult {
  if (!indexOK(shelfIndex, FULL_SHELF_COUNT) || !state.shelf[shelfIndex]) {
    return rejected(state, 'Choose a crystal on the shelf first.');
  }
  if (!indexOK(targetIndex, FULL_CELL_COUNT) || state.cells[targetIndex]) {
    return rejected(state, 'Drop the shelf crystal into an empty socket.');
  }
  const cells = [...state.cells];
  const shelf = [...state.shelf];
  cells[targetIndex] = shelf[shelfIndex];
  shelf[shelfIndex] = null;
  return accepted({ ...state, cells, shelf }, 'Crystal placed back on the board.');
}
export function washCrystal(state: CrystalariumFullState, cellIndex: number): FullActionResult {
  if (!indexOK(cellIndex, FULL_CELL_COUNT) || !state.cells[cellIndex])
    return rejected(state, 'Choose a crystal to wash away.');
  const cells = [...state.cells];
  cells[cellIndex] = null;
  return accepted(
    { ...state, cells, washes: state.washes + 1 },
    'Brook Wash made space. No cost or penalty.',
  );
}
function availablePieces(state: CrystalariumFullState): readonly (CrystalPiece | null)[] {
  return [...state.cells, ...state.shelf];
}
function requiredIndices(
  state: CrystalariumFullState,
  goals: readonly CrystalGoal[],
): number[] | null {
  const pieces = availablePieces(state);
  const taken = new Set<number>();
  for (const request of goals) {
    for (let i = 0; i < request.quantity; i += 1) {
      const index = pieces.findIndex(
        (piece, at) =>
          !taken.has(at) && piece?.family === request.family && piece.tier === request.tier,
      );
      if (index < 0) return null;
      taken.add(index);
    }
  }
  return [...taken];
}
export function canOfferPattern(state: CrystalariumFullState): boolean {
  const pattern = activeResonancePattern(state);
  return Boolean(
    pattern && state.harmonies >= pattern.harmonies && requiredIndices(state, pattern.goals),
  );
}
export function offerResonancePattern(state: CrystalariumFullState): FullActionResult {
  const pattern = activeResonancePattern(state);
  if (!pattern) return rejected(state, 'The complete songbook is yours. Keep experimenting!');
  const indices = requiredIndices(state, pattern.goals);
  if (!indices || state.harmonies < pattern.harmonies) {
    return rejected(state, 'Keep merging to complete the requested formation.');
  }
  const cells = [...state.cells],
    shelf = [...state.shelf];
  for (const index of indices) {
    if (index < FULL_CELL_COUNT) cells[index] = null;
    else shelf[index - FULL_CELL_COUNT] = null;
  }
  return accepted(
    {
      ...state,
      cells,
      shelf,
      completed: state.completed + 1,
      offers: state.offers + 1,
      harmonies: state.harmonies - pattern.harmonies,
    },
    'Pattern complete! ' + pattern.title + ' is now part of the Crystalarium.',
  );
}
export function createHarmony(state: CrystalariumFullState): FullActionResult {
  const goals = [l(1), b(1), s(1)];
  if (unlockedCrystalFamilies(state).length < 3)
    return rejected(state, 'Discover all three crystal voices first.');
  const indices = requiredIndices(state, goals);
  if (!indices)
    return rejected(state, 'A harmony needs one polished shard of each crystal family.');
  const cells = [...state.cells],
    shelf = [...state.shelf];
  for (const index of indices) {
    if (index < FULL_CELL_COUNT) cells[index] = null;
    else shelf[index - FULL_CELL_COUNT] = null;
  }
  return accepted(
    { ...state, cells, shelf, harmonies: state.harmonies + 1 },
    'A musical harmony was crafted from all three voices.',
  );
}
/** Polishing trades one crafted three-voice harmony for a single tier advance. */
export function polishCrystal(state: CrystalariumFullState, index: number): FullActionResult {
  if (state.completed < 30) {
    return rejected(state, 'Unlock the Prism Workshop by restoring the Singing Pools.');
  }
  if (!indexOK(index, FULL_CELL_COUNT)) return rejected(state, 'Select a crystal to polish.');
  const piece = state.cells[index];
  if (!piece) return rejected(state, 'Choose a crystal on the board.');
  if (piece.tier === 5) return rejected(state, 'That rare formation is already perfect.');
  if (state.harmonies < 1)
    return rejected(state, 'Craft one three-voice harmony to power the basin.');
  const result = makeCrystalPiece(piece.family, (piece.tier + 1) as CrystalTier);
  const cells = [...state.cells];
  cells[index] = result;
  const discovery = result.family + ':' + result.tier;
  return accepted(
    {
      ...state,
      cells,
      harmonies: state.harmonies - 1,
      discovered: state.discovered.includes(discovery)
        ? state.discovered
        : [...state.discovered, discovery],
    },
    'The polishing basin refined a crystal using one crafted harmony.',
  );
}

/** Never overwrites campaign achievements: use only for a fresh board on request. */
export function startFreshCrystalariumBoard(state: CrystalariumFullState): CrystalariumFullState {
  const fresh = createCrystalariumFullState();
  return {
    ...fresh,
    version: state.version,
    completedPatternIds: state.completedPatternIds,
    revealedCount: state.revealedCount,
    completed: state.completed,
    merges: state.merges,
    offers: state.offers,
    washes: state.washes,
    harmonies: state.harmonies,
    discovered: state.discovered,
  };
}
