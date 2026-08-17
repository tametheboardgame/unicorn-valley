import { RACE_COURSE_LENGTH } from './RaceMovement';

export type RaceObstacleKind = 'log' | 'flower-hurdle';

export interface RaceObstacleDefinition {
  id: string;
  kind: RaceObstacleKind;
  label: string;
  progress: number;
  width: number;
  clearanceHeight: number;
}

export interface RaceBoostZoneDefinition {
  id: string;
  label: string;
  startProgress: number;
  endProgress: number;
  speedMultiplier: number;
}

export interface RaceCollectableDefinition {
  id: string;
  label: string;
  progress: number;
  heightAboveGround: number;
  pickupRadius: number;
}

export interface RaceCourseDefinition {
  id: string;
  name: string;
  length: number;
  obstacles: readonly RaceObstacleDefinition[];
  boostZones: readonly RaceBoostZoneDefinition[];
  collectables: readonly RaceCollectableDefinition[];
}

export const PRACTICE_RAINBOW_RUN_COURSE = {
  id: 'race-course:rainbow-run-practice',
  name: 'Practice Dash',
  length: RACE_COURSE_LENGTH,
  obstacles: [
    {
      id: 'obstacle:rainbow-log-one',
      kind: 'log',
      label: 'Rainbow log',
      progress: 880,
      width: 94,
      clearanceHeight: 58,
    },
    {
      id: 'obstacle:flower-hurdle',
      kind: 'flower-hurdle',
      label: 'Flower hurdle',
      progress: 2010,
      width: 104,
      clearanceHeight: 78,
    },
    {
      id: 'obstacle:rainbow-log-two',
      kind: 'log',
      label: 'Rainbow log',
      progress: 2950,
      width: 102,
      clearanceHeight: 62,
    },
  ],
  boostZones: [
    {
      id: 'boost:sunbeam-strip',
      label: 'Sunbeam boost',
      startProgress: 1190,
      endProgress: 1460,
      speedMultiplier: 1.34,
    },
    {
      id: 'boost:prism-strip',
      label: 'Prism boost',
      startProgress: 2480,
      endProgress: 2720,
      speedMultiplier: 1.38,
    },
  ],
  collectables: [
    {
      id: 'collectable:sparkle-one',
      label: 'Race sparkle',
      progress: 610,
      heightAboveGround: 38,
      pickupRadius: 54,
    },
    {
      id: 'collectable:sparkle-two',
      label: 'Race sparkle',
      progress: 890,
      heightAboveGround: 112,
      pickupRadius: 58,
    },
    {
      id: 'collectable:sparkle-three',
      label: 'Race sparkle',
      progress: 1320,
      heightAboveGround: 42,
      pickupRadius: 58,
    },
    {
      id: 'collectable:sparkle-four',
      label: 'Race sparkle',
      progress: 1710,
      heightAboveGround: 76,
      pickupRadius: 58,
    },
    {
      id: 'collectable:sparkle-five',
      label: 'Race sparkle',
      progress: 2020,
      heightAboveGround: 136,
      pickupRadius: 62,
    },
    {
      id: 'collectable:sparkle-six',
      label: 'Race sparkle',
      progress: 2570,
      heightAboveGround: 42,
      pickupRadius: 58,
    },
    {
      id: 'collectable:sparkle-seven',
      label: 'Race sparkle',
      progress: 3020,
      heightAboveGround: 108,
      pickupRadius: 58,
    },
    {
      id: 'collectable:sparkle-eight',
      label: 'Race sparkle',
      progress: 3380,
      heightAboveGround: 42,
      pickupRadius: 58,
    },
  ],
} as const satisfies RaceCourseDefinition;

export function validateRaceCourse(course: RaceCourseDefinition): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();

  const registerId = (id: string): void => {
    if (ids.has(id)) {
      issues.push(`Duplicate race feature ID: ${id}`);
    }
    ids.add(id);
  };

  if (!Number.isFinite(course.length) || course.length <= 0) {
    issues.push('Course length must be a positive finite number.');
  }

  for (const obstacle of course.obstacles) {
    registerId(obstacle.id);
    if (obstacle.progress <= 0 || obstacle.progress >= course.length) {
      issues.push(`Obstacle ${obstacle.id} must sit inside the course.`);
    }
    if (obstacle.width <= 0 || obstacle.clearanceHeight <= 0) {
      issues.push(`Obstacle ${obstacle.id} must have positive dimensions.`);
    }
  }

  for (const boost of course.boostZones) {
    registerId(boost.id);
    if (
      boost.startProgress < 0 ||
      boost.endProgress <= boost.startProgress ||
      boost.endProgress > course.length
    ) {
      issues.push(`Boost ${boost.id} has an invalid course range.`);
    }
    if (!Number.isFinite(boost.speedMultiplier) || boost.speedMultiplier <= 1) {
      issues.push(`Boost ${boost.id} must increase forward speed.`);
    }
  }

  for (const collectable of course.collectables) {
    registerId(collectable.id);
    if (collectable.progress <= 0 || collectable.progress >= course.length) {
      issues.push(`Collectable ${collectable.id} must sit inside the course.`);
    }
    if (collectable.heightAboveGround < 0 || collectable.pickupRadius <= 0) {
      issues.push(`Collectable ${collectable.id} has invalid pickup geometry.`);
    }
  }

  return issues;
}
