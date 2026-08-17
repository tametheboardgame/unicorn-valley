import { describe, expect, it } from 'vitest';
import {
  PRACTICE_RAINBOW_RUN_COURSE,
  validateRaceCourse,
  type RaceCourseDefinition,
} from './RaceCourse';
import { RACE_FORWARD_SPEED, createRaceMovementState } from './RaceMovement';
import {
  RACE_SLOWDOWN_MULTIPLIER,
  createRaceRunState,
  stepRaceRun,
  type RaceRunState,
} from './RaceRun';

const TEST_COURSE: RaceCourseDefinition = {
  id: 'race-course:test',
  name: 'Test Course',
  length: 80,
  obstacles: [
    {
      id: 'obstacle:test-log',
      kind: 'log',
      label: 'Test log',
      progress: 15,
      width: 20,
      clearanceHeight: 60,
    },
  ],
  boostZones: [
    {
      id: 'boost:test',
      label: 'Test boost',
      startProgress: 20,
      endProgress: 50,
      speedMultiplier: 1.4,
    },
  ],
  collectables: [
    {
      id: 'collectable:test',
      label: 'Test sparkle',
      progress: 15,
      heightAboveGround: 0,
      pickupRadius: 20,
    },
  ],
};

function stateAt(progress: number): RaceRunState {
  return {
    ...createRaceRunState(),
    movement: {
      ...createRaceMovementState(),
      progress,
    },
  };
}

describe('Rainbow Run course data', () => {
  it('keeps every authored feature valid and inside the course', () => {
    expect(validateRaceCourse(PRACTICE_RAINBOW_RUN_COURSE)).toEqual([]);
  });
});

describe('stepRaceRun', () => {
  it('turns a grounded obstacle hit into a temporary slowdown instead of a failure', () => {
    const hit = stepRaceRun(stateAt(8), TEST_COURSE, 0.02, false);

    expect(hit.events.some((event) => event.type === 'obstacle-hit')).toBe(true);
    expect(hit.state.movement.finished).toBe(false);
    expect(hit.state.slowdownRemaining).toBeGreaterThan(0);

    const beforeSlowStep = hit.state.movement.progress;
    const slowed = stepRaceRun(hit.state, TEST_COURSE, 0.05, false);
    const slowedDistance = slowed.state.movement.progress - beforeSlowStep;

    expect(slowedDistance).toBeCloseTo(
      RACE_FORWARD_SPEED * RACE_SLOWDOWN_MULTIPLIER * 0.05,
      5,
    );
  });

  it('lets a sufficiently high jump clear an obstacle cleanly', () => {
    const airborne: RaceRunState = {
      ...stateAt(8),
      movement: {
        ...createRaceMovementState(),
        progress: 8,
        jumpOffset: -90,
        verticalVelocity: 0,
        grounded: false,
      },
    };

    const result = stepRaceRun(airborne, TEST_COURSE, 0.02, false);

    expect(result.events.some((event) => event.type === 'obstacle-hit')).toBe(false);
    expect(result.state.hitObstacleIds).toEqual([]);
  });

  it('moves faster while the unicorn is inside a boost zone', () => {
    const boosted = stepRaceRun(stateAt(25), TEST_COURSE, 0.05, false);
    const boostedDistance = boosted.state.movement.progress - 25;

    expect(boostedDistance).toBeCloseTo(RACE_FORWARD_SPEED * 1.4 * 0.05, 5);
    expect(boosted.events.some((event) => event.type === 'boost-entered')).toBe(true);
  });

  it('collects an optional race sparkle when the player crosses it at the right height', () => {
    const result = stepRaceRun(stateAt(8), TEST_COURSE, 0.02, false);

    expect(result.state.collectedIds).toContain('collectable:test');
    expect(result.events.some((event) => event.type === 'collectable-collected')).toBe(true);
  });

  it('allows a missed collectable and still fires the finish trigger', () => {
    const shortCourse: RaceCourseDefinition = {
      ...TEST_COURSE,
      length: 20,
      obstacles: [],
      boostZones: [],
      collectables: [
        {
          id: 'collectable:high',
          label: 'High sparkle',
          progress: 15,
          heightAboveGround: 150,
          pickupRadius: 24,
        },
      ],
    };

    const result = stepRaceRun(stateAt(8), shortCourse, 0.05, false);

    expect(result.state.movement.finished).toBe(true);
    expect(result.state.collectedIds).toEqual([]);
    expect(result.events.some((event) => event.type === 'finished')).toBe(true);
  });
});
