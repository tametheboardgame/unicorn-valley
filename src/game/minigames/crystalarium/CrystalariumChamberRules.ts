import {
  CRYSTAL_FAMILIES,
  FULL_CELL_COUNT,
  RESONANCE_PATTERNS,
  type CrystalariumFullState,
} from './CrystalariumFullRules';
import {
  isCrystalariumQueueState,
  readCrystalariumQueue,
  type CrystalariumQueueState,
} from './CrystalariumMultiOrderRules';
import type { CrystalPiece } from './CrystalariumOpeningRules';

/**
 * C19 storage mechanics candidate. Pure functions only: the active v2 save
 * writer and four-slot playable UI are not changed by this stage.
 */
export const CHAMBER_VERSION = 3 as const;
export const CHAMBER_COLUMNS = 4;
export const CHAMBER_ROWS = 3;
export const CHAMBER_CAPACITY = CHAMBER_COLUMNS * CHAMBER_ROWS;

export interface CrystalariumChamberState extends Omit<CrystalariumQueueState, 'version' | 'shelf'> {
  readonly version: typeof CHAMBER_VERSION;
  readonly shelf: readonly (CrystalPiece | null)[];
}

export type ChamberActionResult =
  | { readonly accepted: true; readonly state: CrystalariumChamberState; readonly message: string }
  | { readonly accepted: false; readonly state: CrystalariumChamberState; readonly reason: string };

const indexOK = (index: number, length: number): boolean =>
  Number.isInteger(index) && index >= 0 && index < length;

const validPiece = (value: CrystalPiece | null): boolean =>
  value === null ||
  (typeof value === 'object' &&
    !Array.isArray(value) &&
    CRYSTAL_FAMILIES.includes(value.family) &&
    Number.isInteger(value.tier) &&
    value.tier >= 0 &&
    value.tier <= 5);

function reject(state: CrystalariumChamberState, reason: string): ChamberActionResult {
  return { accepted: false, state, reason };
}

function accept(state: CrystalariumChamberState, message: string): ChamberActionResult {
  return { accepted: true, state, message };
}

/** A malformed or newer chamber record is not silently treated as an older save. */
export function isCrystalariumChamberState(value: unknown): value is CrystalariumChamberState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Partial<CrystalariumChamberState>;
  if (
    candidate.version !== CHAMBER_VERSION ||
    !Array.isArray(candidate.shelf) ||
    candidate.shelf.length !== CHAMBER_CAPACITY ||
    !candidate.shelf.every(validPiece)
  ) {
    return false;
  }
  // Keep C18's order-ledger, counter, cell and reveal-frontier validation.
  // Only the capacity and nested version differ from the approved v2 model.
  const legacyProjection = {
    ...candidate,
    version: 2,
    shelf: candidate.shelf.slice(0, 4),
  };
  return isCrystalariumQueueState(legacyProjection);
}

/** Idempotent v1/v2 -> v3 copy. Every original shelf piece keeps its slot. */
export function migrateCrystalariumChamber(
  value: CrystalariumFullState | CrystalariumQueueState | CrystalariumChamberState,
): CrystalariumChamberState | null {
  if (isCrystalariumChamberState(value)) return value;
  const queue = readCrystalariumQueue(value);
  if (!queue) return null;
  const upgraded: CrystalariumChamberState = {
    ...queue,
    version: CHAMBER_VERSION,
    shelf: [...queue.shelf, ...Array.from({ length: CHAMBER_CAPACITY - 4 }, () => null)],
  };
  return isCrystalariumChamberState(upgraded) ? upgraded : null;
}

export function readCrystalariumChamber(value: unknown): CrystalariumChamberState | null {
  if (isCrystalariumChamberState(value)) return value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return migrateCrystalariumChamber(value as CrystalariumFullState);
}

/** Board -> first free slot, or an exact free slot when a chamber grid is open. */
export function storeBoardCrystal(
  state: CrystalariumChamberState,
  cellIndex: number,
  preferredSlot?: number,
): ChamberActionResult {
  if (!indexOK(cellIndex, FULL_CELL_COUNT) || !state.cells[cellIndex]) {
    return reject(state, 'Choose a crystal on the board first.');
  }
  const slot = preferredSlot ?? state.shelf.indexOf(null);
  if (!indexOK(slot, CHAMBER_CAPACITY) || state.shelf[slot] !== null) {
    return reject(state, 'Storage is full or that slot is occupied.');
  }
  const cells = [...state.cells];
  const shelf = [...state.shelf];
  shelf[slot] = cells[cellIndex];
  cells[cellIndex] = null;
  return accept({ ...state, cells, shelf }, 'Crystal stored safely.');
}

/** Slot -> slot; occupied destinations are swapped, never overwritten. */
export function moveStoredCrystal(
  state: CrystalariumChamberState,
  sourceSlot: number,
  targetSlot: number,
): ChamberActionResult {
  if (
    !indexOK(sourceSlot, CHAMBER_CAPACITY) ||
    !indexOK(targetSlot, CHAMBER_CAPACITY) ||
    sourceSlot === targetSlot ||
    !state.shelf[sourceSlot]
  ) {
    return reject(state, 'Choose a stored crystal and another chamber slot.');
  }
  const shelf = [...state.shelf];
  [shelf[sourceSlot], shelf[targetSlot]] = [shelf[targetSlot], shelf[sourceSlot]];
  return accept({ ...state, shelf }, 'Storage rearranged safely.');
}

/** Slot -> first free board socket, or an explicit empty socket. */
export function returnStoredCrystal(
  state: CrystalariumChamberState,
  sourceSlot: number,
  targetCell?: number,
): ChamberActionResult {
  if (!indexOK(sourceSlot, CHAMBER_CAPACITY) || !state.shelf[sourceSlot]) {
    return reject(state, 'Choose a crystal in Storage first.');
  }
  const cellIndex = targetCell ?? state.cells.indexOf(null);
  if (!indexOK(cellIndex, FULL_CELL_COUNT) || state.cells[cellIndex] !== null) {
    return reject(state, 'Choose an empty board socket, or use Brook Wash.');
  }
  const cells = [...state.cells];
  const shelf = [...state.shelf];
  cells[cellIndex] = shelf[sourceSlot];
  shelf[sourceSlot] = null;
  return accept({ ...state, cells, shelf }, 'Crystal returned safely to the board.');
}

/** Chapter and order counts never depend on the number of storage slots. */
export const CHAMBER_CAMPAIGN_ORDER_COUNT = RESONANCE_PATTERNS.length;
