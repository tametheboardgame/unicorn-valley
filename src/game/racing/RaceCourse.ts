import { NOVA_TUTORIAL_RACE_ID, SUNRISE_SPRINT_RACE_ID } from '../../content/r3RaceIds';
import { CRYSTAL_CASCADE_RACE_ID } from '../../content/r5RaceIds';
import {
  MOONCAP_TRAIL_RACE_ID,
  PETAL_PARADE_RACE_ID,
  SHORELINE_SURGE_RACE_ID,
} from '../../content/r65RaceExpansion';
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

export const NOVA_TUTORIAL_RAINBOW_RUN_COURSE = {
  id: NOVA_TUTORIAL_RACE_ID,
  name: "Nova's First Run",
  length: RACE_COURSE_LENGTH,
  obstacles: [
    {
      id: 'obstacle:first-run-flower-hurdle',
      kind: 'flower-hurdle',
      label: 'Flower hurdle',
      progress: 1810,
      width: 98,
      clearanceHeight: 72,
    },
  ],
  boostZones: [
    {
      id: 'boost:first-run-sunbeam-strip',
      label: 'Sunbeam boost',
      startProgress: 2460,
      endProgress: 2790,
      speedMultiplier: 1.3,
    },
  ],
  collectables: [
    {
      id: 'collectable:first-run-sparkle-one',
      label: 'Race sparkle',
      progress: 720,
      heightAboveGround: 38,
      pickupRadius: 58,
    },
    {
      id: 'collectable:first-run-sparkle-two',
      label: 'Race sparkle',
      progress: 1820,
      heightAboveGround: 128,
      pickupRadius: 64,
    },
    {
      id: 'collectable:first-run-sparkle-three',
      label: 'Race sparkle',
      progress: 2590,
      heightAboveGround: 42,
      pickupRadius: 60,
    },
    {
      id: 'collectable:first-run-sparkle-four',
      label: 'Race sparkle',
      progress: 3290,
      heightAboveGround: 46,
      pickupRadius: 60,
    },
  ],
} as const satisfies RaceCourseDefinition;

export const SUNRISE_SPRINT_RAINBOW_RUN_COURSE = {
  id: SUNRISE_SPRINT_RACE_ID,
  name: 'Sunrise Sprint',
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

export const CRYSTAL_CASCADE_RACE_COURSE = {
  id: CRYSTAL_CASCADE_RACE_ID,
  name: 'Crystal Cascade',
  length: RACE_COURSE_LENGTH,
  obstacles: [
    {
      id: 'obstacle:cascade-driftwood-one',
      kind: 'log',
      label: 'Driftwood log',
      progress: 650,
      width: 92,
      clearanceHeight: 60,
    },
    {
      id: 'obstacle:cascade-reed-hurdle-one',
      kind: 'flower-hurdle',
      label: 'Reed hurdle',
      progress: 1450,
      width: 110,
      clearanceHeight: 82,
    },
    {
      id: 'obstacle:cascade-driftwood-two',
      kind: 'log',
      label: 'Driftwood log',
      progress: 2220,
      width: 112,
      clearanceHeight: 66,
    },
    {
      id: 'obstacle:cascade-reed-hurdle-two',
      kind: 'flower-hurdle',
      label: 'Reed hurdle',
      progress: 3090,
      width: 116,
      clearanceHeight: 84,
    },
  ],
  boostZones: [
    {
      id: 'boost:cascade-current',
      label: 'Brook current',
      startProgress: 920,
      endProgress: 1190,
      speedMultiplier: 1.32,
    },
    {
      id: 'boost:cascade-prism-current',
      label: 'Prism Current shortcut',
      startProgress: 2500,
      endProgress: 2830,
      speedMultiplier: 1.42,
    },
  ],
  collectables: [
    {
      id: 'collectable:cascade-crystal-one',
      label: 'Cascade sparkle',
      progress: 430,
      heightAboveGround: 44,
      pickupRadius: 56,
    },
    {
      id: 'collectable:cascade-crystal-two',
      label: 'Cascade sparkle',
      progress: 680,
      heightAboveGround: 118,
      pickupRadius: 60,
    },
    {
      id: 'collectable:cascade-crystal-three',
      label: 'Cascade sparkle',
      progress: 1070,
      heightAboveGround: 40,
      pickupRadius: 58,
    },
    {
      id: 'collectable:cascade-crystal-four',
      label: 'Cascade sparkle',
      progress: 1480,
      heightAboveGround: 138,
      pickupRadius: 62,
    },
    {
      id: 'collectable:cascade-crystal-five',
      label: 'Cascade sparkle',
      progress: 1980,
      heightAboveGround: 48,
      pickupRadius: 58,
    },
    {
      id: 'collectable:cascade-crystal-six',
      label: 'Cascade sparkle',
      progress: 2580,
      heightAboveGround: 42,
      pickupRadius: 58,
    },
    {
      id: 'collectable:cascade-crystal-seven',
      label: 'Cascade sparkle',
      progress: 3130,
      heightAboveGround: 132,
      pickupRadius: 62,
    },
    {
      id: 'collectable:cascade-crystal-eight',
      label: 'Cascade sparkle',
      progress: 3450,
      heightAboveGround: 48,
      pickupRadius: 58,
    },
  ],
} as const satisfies RaceCourseDefinition;

export const PETAL_PARADE_RACE_COURSE = {
  id: PETAL_PARADE_RACE_ID,
  name: 'Petal Parade',
  length: RACE_COURSE_LENGTH,
  obstacles: [
    {
      id: 'obstacle:petal-pink-hurdle',
      kind: 'flower-hurdle',
      label: 'Pink petal hurdle',
      progress: 720,
      width: 96,
      clearanceHeight: 70,
    },
    {
      id: 'obstacle:petal-daisy-hurdle',
      kind: 'flower-hurdle',
      label: 'Daisy hurdle',
      progress: 1540,
      width: 104,
      clearanceHeight: 76,
    },
    {
      id: 'obstacle:petal-rainbow-log',
      kind: 'log',
      label: 'Flower-painted log',
      progress: 2390,
      width: 90,
      clearanceHeight: 58,
    },
    {
      id: 'obstacle:petal-gold-hurdle',
      kind: 'flower-hurdle',
      label: 'Golden petal hurdle',
      progress: 3210,
      width: 108,
      clearanceHeight: 80,
    },
  ],
  boostZones: [
    {
      id: 'boost:petal-breeze',
      label: 'Petal breeze',
      startProgress: 1010,
      endProgress: 1270,
      speedMultiplier: 1.29,
    },
    {
      id: 'boost:petal-rainbow-stream',
      label: 'Rainbow petal stream',
      startProgress: 2680,
      endProgress: 3010,
      speedMultiplier: 1.36,
    },
  ],
  collectables: [
    { id: 'collectable:petal-one', label: 'Petal sparkle', progress: 410, heightAboveGround: 42, pickupRadius: 56 },
    { id: 'collectable:petal-two', label: 'Petal sparkle', progress: 760, heightAboveGround: 124, pickupRadius: 60 },
    { id: 'collectable:petal-three', label: 'Petal sparkle', progress: 1110, heightAboveGround: 38, pickupRadius: 56 },
    { id: 'collectable:petal-four', label: 'Petal sparkle', progress: 1570, heightAboveGround: 138, pickupRadius: 62 },
    { id: 'collectable:petal-five', label: 'Petal sparkle', progress: 1950, heightAboveGround: 46, pickupRadius: 56 },
    { id: 'collectable:petal-six', label: 'Petal sparkle', progress: 2420, heightAboveGround: 112, pickupRadius: 58 },
    { id: 'collectable:petal-seven', label: 'Petal sparkle', progress: 2790, heightAboveGround: 40, pickupRadius: 58 },
    { id: 'collectable:petal-eight', label: 'Petal sparkle', progress: 3250, heightAboveGround: 140, pickupRadius: 62 },
    { id: 'collectable:petal-nine', label: 'Petal sparkle', progress: 3510, heightAboveGround: 44, pickupRadius: 56 },
  ],
} as const satisfies RaceCourseDefinition;

export const MOONCAP_TRAIL_RACE_COURSE = {
  id: MOONCAP_TRAIL_RACE_ID,
  name: 'Mooncap Trail',
  length: RACE_COURSE_LENGTH,
  obstacles: [
    {
      id: 'obstacle:mooncap-root-one',
      kind: 'log',
      label: 'Mossy root',
      progress: 590,
      width: 106,
      clearanceHeight: 64,
    },
    {
      id: 'obstacle:mooncap-fern-gate',
      kind: 'flower-hurdle',
      label: 'Glowfern gate',
      progress: 1260,
      width: 116,
      clearanceHeight: 84,
    },
    {
      id: 'obstacle:mooncap-root-two',
      kind: 'log',
      label: 'Twisting root',
      progress: 2050,
      width: 122,
      clearanceHeight: 68,
    },
    {
      id: 'obstacle:mooncap-fern-gate-two',
      kind: 'flower-hurdle',
      label: 'Moonfern gate',
      progress: 2780,
      width: 118,
      clearanceHeight: 86,
    },
    {
      id: 'obstacle:mooncap-root-three',
      kind: 'log',
      label: 'Old woodland root',
      progress: 3370,
      width: 126,
      clearanceHeight: 70,
    },
  ],
  boostZones: [
    {
      id: 'boost:mooncap-glowfern-run',
      label: 'Glowfern run',
      startProgress: 880,
      endProgress: 1100,
      speedMultiplier: 1.26,
    },
    {
      id: 'boost:mooncap-moonlight-lane',
      label: 'Moonlight lane',
      startProgress: 2270,
      endProgress: 2580,
      speedMultiplier: 1.33,
    },
  ],
  collectables: [
    { id: 'collectable:mooncap-one', label: 'Mooncap light', progress: 360, heightAboveGround: 48, pickupRadius: 56 },
    { id: 'collectable:mooncap-two', label: 'Mooncap light', progress: 960, heightAboveGround: 44, pickupRadius: 56 },
    { id: 'collectable:mooncap-three', label: 'Mooncap light', progress: 1510, heightAboveGround: 132, pickupRadius: 62 },
    { id: 'collectable:mooncap-four', label: 'Mooncap light', progress: 2320, heightAboveGround: 42, pickupRadius: 58 },
    { id: 'collectable:mooncap-five', label: 'Mooncap light', progress: 2810, heightAboveGround: 142, pickupRadius: 62 },
    { id: 'collectable:mooncap-six', label: 'Mooncap light', progress: 3450, heightAboveGround: 50, pickupRadius: 58 },
  ],
} as const satisfies RaceCourseDefinition;

export const SHORELINE_SURGE_RACE_COURSE = {
  id: SHORELINE_SURGE_RACE_ID,
  name: 'Shoreline Surge',
  length: RACE_COURSE_LENGTH,
  obstacles: [
    {
      id: 'obstacle:shoreline-driftwood-one',
      kind: 'log',
      label: 'Driftwood branch',
      progress: 780,
      width: 112,
      clearanceHeight: 64,
    },
    {
      id: 'obstacle:shoreline-grass-gate',
      kind: 'flower-hurdle',
      label: 'Dune-grass gate',
      progress: 1680,
      width: 120,
      clearanceHeight: 82,
    },
    {
      id: 'obstacle:shoreline-driftwood-two',
      kind: 'log',
      label: 'Washed-up log',
      progress: 2650,
      width: 128,
      clearanceHeight: 70,
    },
    {
      id: 'obstacle:shoreline-shell-gate',
      kind: 'flower-hurdle',
      label: 'Shell-marker gate',
      progress: 3330,
      width: 112,
      clearanceHeight: 80,
    },
  ],
  boostZones: [
    {
      id: 'boost:shoreline-outgoing-tide',
      label: 'Outgoing tide',
      startProgress: 1040,
      endProgress: 1370,
      speedMultiplier: 1.31,
    },
    {
      id: 'boost:shoreline-sea-breeze',
      label: 'Sea-breeze surge',
      startProgress: 2860,
      endProgress: 3200,
      speedMultiplier: 1.39,
    },
  ],
  collectables: [
    { id: 'collectable:shoreline-one', label: 'Shell sparkle', progress: 420, heightAboveGround: 42, pickupRadius: 58 },
    { id: 'collectable:shoreline-two', label: 'Shell sparkle', progress: 820, heightAboveGround: 126, pickupRadius: 62 },
    { id: 'collectable:shoreline-three', label: 'Shell sparkle', progress: 1180, heightAboveGround: 44, pickupRadius: 58 },
    { id: 'collectable:shoreline-four', label: 'Shell sparkle', progress: 1710, heightAboveGround: 138, pickupRadius: 64 },
    { id: 'collectable:shoreline-five', label: 'Shell sparkle', progress: 2360, heightAboveGround: 48, pickupRadius: 58 },
    { id: 'collectable:shoreline-six', label: 'Shell sparkle', progress: 2940, heightAboveGround: 42, pickupRadius: 58 },
    { id: 'collectable:shoreline-seven', label: 'Shell sparkle', progress: 3370, heightAboveGround: 132, pickupRadius: 62 },
  ],
} as const satisfies RaceCourseDefinition;

export const REGULAR_RACE_COURSES = [
  SUNRISE_SPRINT_RAINBOW_RUN_COURSE,
  CRYSTAL_CASCADE_RACE_COURSE,
  PETAL_PARADE_RACE_COURSE,
  MOONCAP_TRAIL_RACE_COURSE,
  SHORELINE_SURGE_RACE_COURSE,
] as const satisfies readonly RaceCourseDefinition[];

export const REGULAR_RACE_COURSE_IDS = REGULAR_RACE_COURSES.map(({ id }) => id);

const PLAYABLE_RACE_COURSES: readonly RaceCourseDefinition[] = REGULAR_RACE_COURSES;

let activeRaceCourse: RaceCourseDefinition = SUNRISE_SPRINT_RAINBOW_RUN_COURSE;

export const PRACTICE_RAINBOW_RUN_COURSE: RaceCourseDefinition = new Proxy(
  {} as RaceCourseDefinition,
  {
    get: (_target, property) => activeRaceCourse[property as keyof RaceCourseDefinition],
  },
);

export function selectRaceCourse(courseId: string): RaceCourseDefinition {
  const course = PLAYABLE_RACE_COURSES.find((candidate) => candidate.id === courseId);
  if (!course) {
    throw new Error(`Unknown playable race course: ${courseId}`);
  }
  activeRaceCourse = course;
  return activeRaceCourse;
}

export function getActiveRaceCourse(): RaceCourseDefinition {
  return activeRaceCourse;
}

export function resetActiveRaceCourse(): RaceCourseDefinition {
  activeRaceCourse = SUNRISE_SPRINT_RAINBOW_RUN_COURSE;
  return activeRaceCourse;
}

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
