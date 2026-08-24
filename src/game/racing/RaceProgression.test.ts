import { describe, expect, it } from 'vitest';
import { SUNRISE_SPRINT_UNLOCKED_FLAG } from '../../content/r3Quests';
import { SUNRISE_SPRINT_RACE_ID } from '../../content/r3RaceIds';
import { CRYSTAL_CASCADE_RACE_ID } from '../../content/r5RaceIds';
import { createDefaultSave } from '../save/createDefaultSave';
import { getCrystalCascadeUnlockState } from './RaceProgression';

describe('R5-WP5.9D Crystal Cascade progression', () => {
  it('keeps a new save locked with a child-friendly next-step clue', () => {
    const state = getCrystalCascadeUnlockState(createDefaultSave('2026-08-24T00:00:00.000Z'));

    expect(state).toEqual({
      unlocked: false,
      reason: 'finish-nova-story',
      clue: 'Race with Nova first, then finish Sunrise Sprint.',
    });
  });

  it('asks an eligible player to finish Sunrise Sprint before Crystal Cascade', () => {
    const save = createDefaultSave('2026-08-24T00:00:00.000Z');
    save.world.flags[SUNRISE_SPRINT_UNLOCKED_FLAG] = true;

    expect(getCrystalCascadeUnlockState(save)).toMatchObject({
      unlocked: false,
      reason: 'finish-sunrise-sprint',
    });
  });

  it('unlocks after a completed Sunrise Sprint and survives ordinary save persistence', () => {
    const save = createDefaultSave('2026-08-24T00:00:00.000Z');
    save.activities.racesById[SUNRISE_SPRINT_RACE_ID] = {
      bestTimeMs: 15_420,
      ribbonIds: [],
    };

    expect(getCrystalCascadeUnlockState(save).unlocked).toBe(true);
    expect(getCrystalCascadeUnlockState(JSON.parse(JSON.stringify(save)))).toMatchObject({
      unlocked: true,
      reason: 'unlocked',
    });
  });

  it('keeps existing completed Crystal Cascade saves unlocked even without a Sunrise record', () => {
    const save = createDefaultSave('2026-08-24T00:00:00.000Z');
    save.activities.racesById[CRYSTAL_CASCADE_RACE_ID] = {
      bestTimeMs: 14_900,
      ribbonIds: ['ribbon:crystal-cascade-finisher'],
    };

    expect(getCrystalCascadeUnlockState(save).unlocked).toBe(true);
  });
});
