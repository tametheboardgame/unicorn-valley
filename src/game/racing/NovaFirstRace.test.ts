import { describe, expect, it } from 'vitest';
import { NOVA_TUTORIAL_RACE_ID, SUNRISE_SPRINT_RACE_ID } from '../../content/r3RaceIds';
import { createDefaultSave } from '../save/createDefaultSave';
import {
  NOVA_TUTORIAL_RAINBOW_RUN_COURSE,
  PRACTICE_RAINBOW_RUN_COURSE,
  validateRaceCourse,
} from './RaceCourse';
import {
  RAINBOW_RUN_FINISHER_RIBBON_ID,
  RAINBOW_RUN_FINISHER_RIBBON_ITEM_ID,
  applyRaceResultToSave,
} from './RaceResults';

describe("Nova's first race", () => {
  it('uses a simpler tutorial course before the named Sunrise Sprint', () => {
    expect(NOVA_TUTORIAL_RAINBOW_RUN_COURSE.id).toBe(NOVA_TUTORIAL_RACE_ID);
    expect(PRACTICE_RAINBOW_RUN_COURSE.id).toBe(SUNRISE_SPRINT_RACE_ID);
    expect(PRACTICE_RAINBOW_RUN_COURSE.name).toBe('Sunrise Sprint');
    expect(NOVA_TUTORIAL_RAINBOW_RUN_COURSE.obstacles.length).toBeLessThan(
      PRACTICE_RAINBOW_RUN_COURSE.obstacles.length,
    );
    expect(validateRaceCourse(NOVA_TUTORIAL_RAINBOW_RUN_COURSE)).toEqual([]);
    expect(validateRaceCourse(PRACTICE_RAINBOW_RUN_COURSE)).toEqual([]);
  });

  it('awards the first finisher ribbon even when Nova finishes first', () => {
    const save = createDefaultSave('2026-08-18T06:00:00.000Z');
    const result = applyRaceResultToSave(save, {
      raceId: NOVA_TUTORIAL_RACE_ID,
      finishTimeMs: 16_000,
      place: 2,
      participantCount: 2,
    });

    expect(result.summary.newRibbonIds).toContain(RAINBOW_RUN_FINISHER_RIBBON_ID);
    expect(result.save.inventory.itemQuantities[RAINBOW_RUN_FINISHER_RIBBON_ITEM_ID]).toBe(1);
  });

  it('does not pretend the same keepsake is new when the follow-up race is unlocked', () => {
    const save = createDefaultSave('2026-08-18T06:00:00.000Z');
    const tutorial = applyRaceResultToSave(save, {
      raceId: NOVA_TUTORIAL_RACE_ID,
      finishTimeMs: 15_000,
      place: 2,
      participantCount: 2,
    });
    const followUp = applyRaceResultToSave(tutorial.save, {
      raceId: SUNRISE_SPRINT_RACE_ID,
      finishTimeMs: 14_000,
      place: 4,
      participantCount: 4,
    });

    expect(followUp.summary.newRibbonIds).not.toContain(RAINBOW_RUN_FINISHER_RIBBON_ID);
    expect(followUp.save.inventory.itemQuantities[RAINBOW_RUN_FINISHER_RIBBON_ITEM_ID]).toBe(1);
  });
});
