import { afterEach, describe, expect, it } from 'vitest';
import { CRYSTAL_CASCADE_RACE_ID } from '../../content/r5RaceIds';
import {
  CRYSTAL_CASCADE_RACE_COURSE,
  PRACTICE_RAINBOW_RUN_COURSE,
  SUNRISE_SPRINT_RAINBOW_RUN_COURSE,
  getActiveRaceCourse,
  resetActiveRaceCourse,
  selectRaceCourse,
  validateRaceCourse,
} from './RaceCourse';

afterEach(() => {
  resetActiveRaceCourse();
});

describe('R5 second race course', () => {
  it('defines a valid course with a genuinely different obstacle pattern', () => {
    expect(validateRaceCourse(CRYSTAL_CASCADE_RACE_COURSE)).toEqual([]);
    expect(CRYSTAL_CASCADE_RACE_COURSE.obstacles).not.toEqual(
      SUNRISE_SPRINT_RAINBOW_RUN_COURSE.obstacles,
    );
    expect(CRYSTAL_CASCADE_RACE_COURSE.obstacles).toHaveLength(4);
    expect(CRYSTAL_CASCADE_RACE_COURSE.boostZones.some(({ label }) => label.includes('shortcut'))).toBe(
      true,
    );
  });

  it('keeps the shared race geometry length compatible with the existing RaceScene', () => {
    expect(CRYSTAL_CASCADE_RACE_COURSE.length).toBe(SUNRISE_SPRINT_RAINBOW_RUN_COURSE.length);
  });

  it('feeds selected course data through the existing RaceScene course contract', () => {
    expect(PRACTICE_RAINBOW_RUN_COURSE.id).toBe(SUNRISE_SPRINT_RAINBOW_RUN_COURSE.id);

    selectRaceCourse(CRYSTAL_CASCADE_RACE_ID);

    expect(getActiveRaceCourse().id).toBe(CRYSTAL_CASCADE_RACE_ID);
    expect(PRACTICE_RAINBOW_RUN_COURSE.id).toBe(CRYSTAL_CASCADE_RACE_ID);
    expect(PRACTICE_RAINBOW_RUN_COURSE.name).toBe('Crystal Cascade');
  });
});
