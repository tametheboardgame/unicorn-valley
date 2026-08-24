import { afterEach, describe, expect, it } from 'vitest';
import { SUNRISE_SPRINT_RACE_ID } from '../../content/r3RaceIds';
import { CRYSTAL_CASCADE_RACE_ID } from '../../content/r5RaceIds';
import { createDefaultSave } from '../save/createDefaultSave';
import {
  SUNRISE_SPRINT_RAINBOW_RUN_COURSE,
  getActiveRaceCourse,
  resetActiveRaceCourse,
  selectRaceCourse,
} from './RaceCourse';
import {
  CRYSTAL_CASCADE_FINISHER_RIBBON_ID,
  RAINBOW_RUN_FINISHER_RIBBON_ID,
  applyRaceResultToSave,
} from './RaceResults';

afterEach(() => {
  resetActiveRaceCourse();
});

describe('R5-WP5.9D race identity regression', () => {
  it('restores Sunrise Sprint as the default course after Crystal Cascade', () => {
    selectRaceCourse(CRYSTAL_CASCADE_RACE_ID);
    expect(getActiveRaceCourse().id).toBe(CRYSTAL_CASCADE_RACE_ID);

    resetActiveRaceCourse();

    expect(getActiveRaceCourse()).toBe(SUNRISE_SPRINT_RAINBOW_RUN_COURSE);
    expect(getActiveRaceCourse().id).toBe(SUNRISE_SPRINT_RACE_ID);
  });

  it('keeps Sunrise and Crystal best times and ribbons in separate records', () => {
    const initial = createDefaultSave('2026-08-24T00:00:00.000Z');
    const sunrise = applyRaceResultToSave(initial, {
      raceId: SUNRISE_SPRINT_RACE_ID,
      finishTimeMs: 18_250,
      place: 4,
      participantCount: 4,
    });
    const crystal = applyRaceResultToSave(sunrise.save, {
      raceId: CRYSTAL_CASCADE_RACE_ID,
      finishTimeMs: 16_900,
      place: 4,
      participantCount: 4,
    });

    expect(crystal.save.activities.racesById[SUNRISE_SPRINT_RACE_ID]).toEqual({
      bestTimeMs: 18_250,
      ribbonIds: [RAINBOW_RUN_FINISHER_RIBBON_ID],
    });
    expect(crystal.save.activities.racesById[CRYSTAL_CASCADE_RACE_ID]).toEqual({
      bestTimeMs: 16_900,
      ribbonIds: [CRYSTAL_CASCADE_FINISHER_RIBBON_ID],
    });
  });

  it('improving Crystal Cascade does not overwrite the Sunrise personal best', () => {
    const initial = createDefaultSave('2026-08-24T00:00:00.000Z');
    const sunrise = applyRaceResultToSave(initial, {
      raceId: SUNRISE_SPRINT_RACE_ID,
      finishTimeMs: 17_500,
      place: 2,
      participantCount: 4,
    }).save;
    const firstCrystal = applyRaceResultToSave(sunrise, {
      raceId: CRYSTAL_CASCADE_RACE_ID,
      finishTimeMs: 18_100,
      place: 2,
      participantCount: 4,
    }).save;
    const improvedCrystal = applyRaceResultToSave(firstCrystal, {
      raceId: CRYSTAL_CASCADE_RACE_ID,
      finishTimeMs: 15_700,
      place: 1,
      participantCount: 4,
    }).save;

    expect(improvedCrystal.activities.racesById[SUNRISE_SPRINT_RACE_ID]?.bestTimeMs).toBe(17_500);
    expect(improvedCrystal.activities.racesById[CRYSTAL_CASCADE_RACE_ID]?.bestTimeMs).toBe(15_700);
  });
});
