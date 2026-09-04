import { CRYSTAL_CASCADE_RACE_ID } from '../../content/r5RaceIds';
import { MOONCAP_TRAIL_RACE_ID } from '../../content/r65RaceExpansion';

export interface RaceShortcutDefinition {
  id: string;
  raceId: string;
  label: string;
  entryStartProgress: number;
  entryEndProgress: number;
  minimumAirborneHeight: number;
  progressSkip: number;
}

export const CRYSTAL_CASCADE_PRISM_CURRENT_SHORTCUT: RaceShortcutDefinition = {
  id: 'shortcut:crystal-cascade-prism-current',
  raceId: CRYSTAL_CASCADE_RACE_ID,
  label: 'Prism Current',
  entryStartProgress: 2450,
  entryEndProgress: 2580,
  minimumAirborneHeight: 28,
  progressSkip: 300,
};

export const MOONCAP_TRAIL_ROOT_HOP_SHORTCUT: RaceShortcutDefinition = {
  id: 'shortcut:mooncap-trail-root-hop',
  raceId: MOONCAP_TRAIL_RACE_ID,
  label: 'Root Hop',
  entryStartProgress: 1450,
  entryEndProgress: 1580,
  minimumAirborneHeight: 30,
  progressSkip: 340,
};

export function getRaceShortcut(courseId: string): RaceShortcutDefinition | null {
  if (courseId === CRYSTAL_CASCADE_RACE_ID) {
    return CRYSTAL_CASCADE_PRISM_CURRENT_SHORTCUT;
  }
  if (courseId === MOONCAP_TRAIL_RACE_ID) {
    return MOONCAP_TRAIL_ROOT_HOP_SHORTCUT;
  }
  return null;
}
