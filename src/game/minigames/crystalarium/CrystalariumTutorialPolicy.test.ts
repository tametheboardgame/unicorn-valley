import { describe, expect, it } from 'vitest';
import {
  createCrystalariumFullState,
  moveOrMergeCrystal,
  offerResonancePattern,
  spawnCrystal,
} from './CrystalariumFullRules';
import {
  feasibleFirstLesson,
  firstLessonAllows,
  firstLessonPair,
} from './CrystalariumTutorialPolicy';

describe('H6.9C11B first-play action authorisation foundation', () => {
  it('derives legal spotlight targets from the saved board and teaches the newly grown piece', () => {
    const fresh = createCrystalariumFullState();
    expect(feasibleFirstLesson(fresh)).toEqual({ step: 'grow', pair: null });
    expect(firstLessonAllows('grow', null, { kind: 'grow' })).toBe(true);
    expect(firstLessonAllows('grow', null, { kind: 'other' })).toBe(false);
    const result = spawnCrystal(fresh);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(firstLessonPair(result.state)).toEqual({ source: 2, target: 0 });
    const pair = firstLessonPair(result.state);
    expect(feasibleFirstLesson(result.state)).toEqual({ step: 'pick-up', pair });
    expect(firstLessonAllows('pick-up', pair, { kind: 'pick', index: 2 })).toBe(true);
    expect(firstLessonAllows('pick-up', pair, { kind: 'pick', index: 0 })).toBe(false);
    expect(firstLessonAllows('merge', pair, { kind: 'merge', source: 2, target: 0 })).toBe(true);
    expect(firstLessonAllows('merge', pair, { kind: 'merge', source: 0, target: 2 })).toBe(false);
    expect(firstLessonAllows('merge', pair, { kind: 'grow' })).toBe(false);
    expect(firstLessonAllows('merge', pair, { kind: 'pick', index: 2 })).toBe(true);
    expect(firstLessonAllows('merge', pair, { kind: 'pick', index: 0 })).toBe(false);
    const merged = moveOrMergeCrystal(result.state, 2, 0);
    expect(merged.accepted).toBe(true);
    if (!merged.accepted) return;
    expect(feasibleFirstLesson(merged.state)).toEqual({ step: 'offer', pair: null });
    expect(firstLessonAllows('offer', null, { kind: 'offer' })).toBe(true);
    const completed = offerResonancePattern(merged.state);
    expect(completed.accepted).toBe(true);
    if (!completed.accepted) return;
    expect(feasibleFirstLesson(completed.state)).toBeNull();
  });

  it('does not require the first lesson on progressed or unsolvable existing boards', () => {
    const fresh = createCrystalariumFullState();
    expect(feasibleFirstLesson({ ...fresh, completed: 1 })).toBeNull();
    expect(feasibleFirstLesson({ ...fresh, merges: 1 })).toBeNull();
    const cells = [...fresh.cells];
    cells.fill(null);
    cells[0] = { family: 'low' as const, tier: 5 as const };
    cells[1] = { family: 'bright' as const, tier: 5 as const };
    cells[2] = { family: 'bell' as const, tier: 5 as const };
    expect(feasibleFirstLesson({ ...fresh, cells })).toBeNull();
  });

  it('only permits exactly its own target and rejects unrelated gameplay', () => {
    const pair = { source: 13, target: 7 };
    for (const step of ['grow', 'pick-up', 'merge', 'offer'] as const) {
      expect(firstLessonAllows(step, pair, { kind: 'other' })).toBe(false);
    }
    expect(firstLessonAllows('merge', null, { kind: 'merge', source: 13, target: 7 })).toBe(false);
    expect(firstLessonAllows('pick-up', pair, { kind: 'pick', index: 7 })).toBe(false);
    expect(firstLessonAllows('offer', pair, { kind: 'pick', index: 13 })).toBe(false);
  });
});
