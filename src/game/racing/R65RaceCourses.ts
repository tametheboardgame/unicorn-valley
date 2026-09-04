import {
  MOONCAP_TRAIL_RACE_ID,
  PETAL_PARADE_RACE_ID,
  SHORELINE_SURGE_RACE_ID,
} from '../../content/r65RaceExpansion';
import type { RaceCollectableDefinition, RaceCourseDefinition } from './RaceCourse';
import { RACE_COURSE_LENGTH } from './RaceMovement';

function collectable(
  id: string,
  label: string,
  progress: number,
  heightAboveGround: number,
  pickupRadius: number,
): RaceCollectableDefinition {
  return { id, label, progress, heightAboveGround, pickupRadius };
}

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
    collectable('collectable:petal-one', 'Petal sparkle', 410, 42, 56),
    collectable('collectable:petal-two', 'Petal sparkle', 760, 124, 60),
    collectable('collectable:petal-three', 'Petal sparkle', 1110, 38, 56),
    collectable('collectable:petal-four', 'Petal sparkle', 1570, 138, 62),
    collectable('collectable:petal-five', 'Petal sparkle', 1950, 46, 56),
    collectable('collectable:petal-six', 'Petal sparkle', 2420, 112, 58),
    collectable('collectable:petal-seven', 'Petal sparkle', 2790, 40, 58),
    collectable('collectable:petal-eight', 'Petal sparkle', 3250, 140, 62),
    collectable('collectable:petal-nine', 'Petal sparkle', 3510, 44, 56),
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
    collectable('collectable:mooncap-one', 'Mooncap light', 360, 48, 56),
    collectable('collectable:mooncap-two', 'Mooncap light', 960, 44, 56),
    collectable('collectable:mooncap-three', 'Mooncap light', 1510, 132, 62),
    collectable('collectable:mooncap-four', 'Mooncap light', 2320, 42, 58),
    collectable('collectable:mooncap-five', 'Mooncap light', 2810, 142, 62),
    collectable('collectable:mooncap-six', 'Mooncap light', 3450, 50, 58),
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
    collectable('collectable:shoreline-one', 'Shell sparkle', 420, 42, 58),
    collectable('collectable:shoreline-two', 'Shell sparkle', 820, 126, 62),
    collectable('collectable:shoreline-three', 'Shell sparkle', 1180, 44, 58),
    collectable('collectable:shoreline-four', 'Shell sparkle', 1710, 138, 64),
    collectable('collectable:shoreline-five', 'Shell sparkle', 2360, 48, 58),
    collectable('collectable:shoreline-six', 'Shell sparkle', 2940, 42, 58),
    collectable('collectable:shoreline-seven', 'Shell sparkle', 3370, 132, 62),
  ],
} as const satisfies RaceCourseDefinition;
