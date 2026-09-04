import { describe, expect, it } from 'vitest';
import { NOVA_TUTORIAL_RACE_ID, SUNRISE_SPRINT_RACE_ID } from '../../content/r3RaceIds';
import { CRYSTAL_CASCADE_RACE_ID } from '../../content/r5RaceIds';
import {
  MOONCAP_TRAIL_FINISHER_RIBBON_ITEM_ID,
  MOONCAP_TRAIL_PODIUM_ROSETTE_ITEM_ID,
  MOONCAP_TRAIL_RACE_ID,
  MOONCAP_TRAIL_RIBBONS_DISCOVERY_ID,
  PETAL_PARADE_RACE_ID,
  RAINBOW_CUP_COMPLETE_FLAG,
  RAINBOW_CUP_DISCOVERY_ID,
  RAINBOW_CUP_PENNANT_ITEM_ID,
  SHORELINE_SURGE_RACE_ID,
} from '../../content/r65RaceExpansion';
import { createDefaultSave } from '../save/createDefaultSave';
import { getRainbowCupEventStates } from './RainbowCup';
import {
  MOONCAP_TRAIL_RACE_COURSE,
  PETAL_PARADE_RACE_COURSE,
  REGULAR_RACE_COURSES,
  SHORELINE_SURGE_RACE_COURSE,
  validateRaceCourse,
} from './RaceCourse';
import {
  MOONCAP_TRAIL_FINISHER_RIBBON_ID,
  MOONCAP_TRAIL_PODIUM_ROSETTE_ID,
  applyRaceResultToSave,
} from './RaceResults';
import { getRaceShortcut } from './RaceShortcut';

describe('R6.5-WP12 race expansion', () => {
  it('exposes exactly five regular courses while keeping Nova tutorial-only', () => {
    expect(REGULAR_RACE_COURSES.map(({ id }) => id)).toEqual([
      SUNRISE_SPRINT_RACE_ID,
      CRYSTAL_CASCADE_RACE_ID,
      PETAL_PARADE_RACE_ID,
      MOONCAP_TRAIL_RACE_ID,
      SHORELINE_SURGE_RACE_ID,
    ]);
    expect(REGULAR_RACE_COURSES).toHaveLength(5);
    expect(REGULAR_RACE_COURSES.some(({ id }) => id === NOVA_TUTORIAL_RACE_ID)).toBe(false);
  });

  it('defines three valid new courses with different rhythms', () => {
    const courses = [
      PETAL_PARADE_RACE_COURSE,
      MOONCAP_TRAIL_RACE_COURSE,
      SHORELINE_SURGE_RACE_COURSE,
    ];
    for (const course of courses) {
      expect(validateRaceCourse(course)).toEqual([]);
    }

    const signatures = courses.map((course) =>
      JSON.stringify({
        obstacles: course.obstacles.map(({ kind, progress }) => [kind, progress]),
        boosts: course.boostZones.map(({ startProgress, endProgress }) => [
          startProgress,
          endProgress,
        ]),
        collectables: course.collectables.map(({ progress, heightAboveGround }) => [
          progress,
          heightAboveGround,
        ]),
      }),
    );
    expect(new Set(signatures).size).toBe(3);
  });

  it('gives Mooncap Trail a working shared-architecture shortcut', () => {
    const shortcut = getRaceShortcut(MOONCAP_TRAIL_RACE_ID);
    expect(shortcut).not.toBeNull();
    expect(shortcut?.raceId).toBe(MOONCAP_TRAIL_RACE_ID);
    expect(shortcut?.label).toBe('Root Hop');
    expect(shortcut?.progressSkip).toBeGreaterThan(0);
  });

  it('awards Mooncap Trail its own finisher and podium keepsakes', () => {
    const finisher = applyRaceResultToSave(createDefaultSave(), {
      raceId: MOONCAP_TRAIL_RACE_ID,
      finishTimeMs: 14_200,
      place: 4,
      participantCount: 4,
    });

    expect(finisher.save.inventory.itemQuantities[MOONCAP_TRAIL_FINISHER_RIBBON_ITEM_ID]).toBe(1);
    expect(finisher.save.inventory.itemQuantities[MOONCAP_TRAIL_PODIUM_ROSETTE_ITEM_ID] ?? 0).toBe(0);
    expect(finisher.save.activities.racesById[MOONCAP_TRAIL_RACE_ID].ribbonIds).toEqual([
      MOONCAP_TRAIL_FINISHER_RIBBON_ID,
    ]);
    expect(finisher.save.collections.discoveryIds).toContain(MOONCAP_TRAIL_RIBBONS_DISCOVERY_ID);

    const podium = applyRaceResultToSave(finisher.save, {
      raceId: MOONCAP_TRAIL_RACE_ID,
      finishTimeMs: 13_500,
      place: 2,
      participantCount: 4,
    });
    expect(podium.save.inventory.itemQuantities[MOONCAP_TRAIL_PODIUM_ROSETTE_ITEM_ID]).toBe(1);
    expect(podium.save.activities.racesById[MOONCAP_TRAIL_RACE_ID].ribbonIds).toContain(
      MOONCAP_TRAIL_PODIUM_ROSETTE_ID,
    );
  });

  it('completes the Rainbow Cup from five finishes even when every finish is last place', () => {
    let save = createDefaultSave();
    const ids = [
      SUNRISE_SPRINT_RACE_ID,
      CRYSTAL_CASCADE_RACE_ID,
      PETAL_PARADE_RACE_ID,
      MOONCAP_TRAIL_RACE_ID,
      SHORELINE_SURGE_RACE_ID,
    ];

    ids.forEach((raceId, index) => {
      const result = applyRaceResultToSave(save, {
        raceId,
        finishTimeMs: 12_000 + index * 700,
        place: 4,
        participantCount: 4,
      });
      save = result.save;
      if (index < ids.length - 1) {
        expect(result.summary.rainbowCupCompleted).toBe(false);
      } else {
        expect(result.summary.rainbowCupCompleted).toBe(true);
        expect(result.summary.rainbowCupCompletedNow).toBe(true);
        expect(result.summary.rainbowCupRewardItemId).toBe(RAINBOW_CUP_PENNANT_ITEM_ID);
      }
    });

    expect(save.world.flags[RAINBOW_CUP_COMPLETE_FLAG]).toBe(true);
    expect(save.collections.discoveryIds).toContain(RAINBOW_CUP_DISCOVERY_ID);
    expect(save.world.uniqueDiscoveryIds).toContain(RAINBOW_CUP_DISCOVERY_ID);
    expect(save.inventory.itemQuantities[RAINBOW_CUP_PENNANT_ITEM_ID]).toBe(1);

    const repeated = applyRaceResultToSave(save, {
      raceId: SHORELINE_SURGE_RACE_ID,
      finishTimeMs: 20_000,
      place: 4,
      participantCount: 4,
    });
    expect(repeated.summary.rainbowCupCompleted).toBe(true);
    expect(repeated.summary.rainbowCupCompletedNow).toBe(false);
    expect(repeated.summary.rainbowCupRewardItemId).toBeNull();
    expect(repeated.save.inventory.itemQuantities[RAINBOW_CUP_PENNANT_ITEM_ID]).toBe(1);
  });

  it('shows useful Cup readiness and lock clues from existing progression state', () => {
    const events = getRainbowCupEventStates(createDefaultSave());
    expect(events).toHaveLength(5);
    expect(events.find(({ courseId }) => courseId === PETAL_PARADE_RACE_ID)?.unlocked).toBe(true);
    expect(events.find(({ courseId }) => courseId === SUNRISE_SPRINT_RACE_ID)?.clue).toContain('Nova');
    expect(events.find(({ courseId }) => courseId === CRYSTAL_CASCADE_RACE_ID)?.clue).toContain('Nova');
    expect(events.find(({ courseId }) => courseId === MOONCAP_TRAIL_RACE_ID)?.clue).toContain(
      'Whispering Woods',
    );
    expect(events.find(({ courseId }) => courseId === SHORELINE_SURGE_RACE_ID)?.clue).toContain(
      'Skipper',
    );
  });
});
