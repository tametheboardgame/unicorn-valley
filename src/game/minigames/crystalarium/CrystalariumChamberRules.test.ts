import { describe, expect, it } from 'vitest';
import { makeCrystalPiece } from './CrystalariumOpeningRules';
import { createCrystalariumFullState } from './CrystalariumFullRules';
import { migrateCrystalariumQueue } from './CrystalariumMultiOrderRules';
import {
  CHAMBER_CAMPAIGN_ORDER_COUNT,
  CHAMBER_CAPACITY,
  CHAMBER_COLUMNS,
  CHAMBER_ROWS,
  isCrystalariumChamberState,
  migrateCrystalariumChamber,
  moveStoredCrystal,
  readCrystalariumChamber,
  returnStoredCrystal,
  storeBoardCrystal,
} from './CrystalariumChamberRules';

function fresh() {
  const value = migrateCrystalariumChamber(createCrystalariumFullState());
  if (!value) throw new Error('Cannot create a Crystalarium chamber test state');
  return value;
}

describe('C19 Crystalarium Storage Chamber pure transfer contract', () => {
  it('migrates the 4 old shelf positions to 12 without losing cells or the C18 ledger', () => {
    const original = {
      ...createCrystalariumFullState(),
      shelf: [
        makeCrystalPiece('low'),
        makeCrystalPiece('bright', 2),
        null,
        makeCrystalPiece('bell', 5),
      ],
      completed: 4,
    };
    const queue = migrateCrystalariumQueue(original);
    expect(queue).not.toBeNull();
    const migrated = migrateCrystalariumChamber(queue!);
    expect(migrated?.version).toBe(3);
    expect(migrated?.shelf).toHaveLength(12);
    expect(migrated?.shelf.slice(0, 4)).toEqual(original.shelf);
    expect(migrated?.shelf.slice(4).every((piece) => piece === null)).toBe(true);
    expect(migrated?.cells).toEqual(original.cells);
    expect(migrated?.completedPatternIds).toEqual(queue?.completedPatternIds);
    expect(migrated?.revealedCount).toBe(queue?.revealedCount);
    expect(migrateCrystalariumChamber(migrated!)).toBe(migrated);
    expect(CHAMBER_COLUMNS * CHAMBER_ROWS).toBe(CHAMBER_CAPACITY);
    expect(CHAMBER_CAMPAIGN_ORDER_COUNT).toBe(50);
  });

  it('moves into the first free slot and exact free slots without mutation or duplication', () => {
    const initial = fresh();
    const stored = storeBoardCrystal(initial, 0);
    expect(stored.accepted).toBe(true);
    if (!stored.accepted) return;
    expect(initial.cells[0]).not.toBeNull();
    expect(initial.shelf.every((item) => item === null)).toBe(true);
    expect(stored.state.cells[0]).toBeNull();
    expect(stored.state.shelf[0]).toEqual(initial.cells[0]);
    const exact = storeBoardCrystal(stored.state, 1, 11);
    expect(exact.accepted).toBe(true);
    if (!exact.accepted) return;
    expect(exact.state.shelf[11]).toEqual(initial.cells[1]);
    expect(exact.state.shelf[1]).toBeNull();
    expect(storeBoardCrystal(exact.state, 1).accepted).toBe(false);
    expect(storeBoardCrystal(exact.state, 0, 11).accepted).toBe(false);
  });

  it('rearranges or swaps occupied slots without destroying either crystal', () => {
    const initial = { ...fresh(), shelf: [
      makeCrystalPiece('low'), makeCrystalPiece('bright', 3), ...Array(10).fill(null),
    ] };
    const moved = moveStoredCrystal(initial, 0, 9);
    expect(moved.accepted).toBe(true);
    if (!moved.accepted) return;
    expect(moved.state.shelf[0]).toBeNull();
    expect(moved.state.shelf[9]).toEqual(initial.shelf[0]);
    const swapped = moveStoredCrystal(moved.state, 9, 1);
    expect(swapped.accepted).toBe(true);
    if (!swapped.accepted) return;
    expect(swapped.state.shelf[1]).toEqual(initial.shelf[0]);
    expect(swapped.state.shelf[9]).toEqual(initial.shelf[1]);
    expect(moveStoredCrystal(swapped.state, 1, 1).state).toBe(swapped.state);
    expect(moveStoredCrystal(swapped.state, 0, 11).accepted).toBe(false);
  });

  it('returns to the first vacant socket or chosen socket and never overwrites a crystal', () => {
    const initial = {
      ...fresh(),
      shelf: [makeCrystalPiece('bell', 4), ...Array(11).fill(null)],
    };
    const rejected = returnStoredCrystal(initial, 0, 0);
    expect(rejected.accepted).toBe(false);
    expect(rejected.state).toBe(initial);
    const specific = returnStoredCrystal(initial, 0, 41);
    expect(specific.accepted).toBe(true);
    if (!specific.accepted) return;
    expect(specific.state.cells[41]).toEqual(initial.shelf[0]);
    expect(specific.state.shelf[0]).toBeNull();
    expect(returnStoredCrystal(specific.state, 0).accepted).toBe(false);
    const automatic = returnStoredCrystal(initial, 0);
    expect(automatic.accepted).toBe(true);
    if (!automatic.accepted) return;
    expect(automatic.state.cells[2]).toEqual(initial.shelf[0]);
  });

  it('rejects full chambers and full boards atomically, with an unmodified save', () => {
    const fullChamber = {
      ...fresh(),
      shelf: Array.from({ length: 12 }, (_, i) => makeCrystalPiece(i % 2 ? 'bright' : 'low')),
    };
    const attempt = storeBoardCrystal(fullChamber, 0);
    expect(attempt.accepted).toBe(false);
    expect(attempt.state).toBe(fullChamber);
    const fullBoard = {
      ...fullChamber,
      cells: Array.from({ length: 42 }, () => makeCrystalPiece('low')),
    };
    const back = returnStoredCrystal(fullBoard, 0);
    expect(back.accepted).toBe(false);
    expect(back.state).toBe(fullBoard);
    expect(returnStoredCrystal(fullBoard, 0, 41).accepted).toBe(false);
  });

  it('fails closed for corrupt and future saves, and never truncates a 12-slot record', () => {
    const valid = fresh();
    expect(isCrystalariumChamberState(valid)).toBe(true);
    expect(readCrystalariumChamber(valid)).toBe(valid);
    expect(readCrystalariumChamber({ ...valid, version: 4 })).toBeNull();
    expect(readCrystalariumChamber({ ...valid, shelf: valid.shelf.slice(0, 11) })).toBeNull();
    expect(readCrystalariumChamber({ ...valid, shelf: [...valid.shelf.slice(0, 11), {}] })).toBeNull();
    expect(readCrystalariumChamber({ ...valid, completed: 60 })).toBeNull();
    expect(readCrystalariumChamber({ ...valid, completedPatternIds: ['unknown'] })).toBeNull();
    expect(isCrystalariumChamberState({ ...valid, cells: [] })).toBe(false);
  });

  it('keeps independent World and Just Games state snapshots with every crystal intact', () => {
    const world = fresh();
    const sandbox = readCrystalariumChamber(JSON.parse(JSON.stringify(world)));
    expect(sandbox).not.toBeNull();
    const stored = storeBoardCrystal(world, 0);
    expect(stored.accepted).toBe(true);
    expect(sandbox?.cells[0]).toEqual(world.cells[0]);
    expect(sandbox?.shelf[0]).toBeNull();
    expect(isCrystalariumChamberState(stored.state)).toBe(true);
  });
});
