import { CRYSTAL_CASCADE_RACE_ID } from '../../content/r5RaceIds';

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

export function getRaceShortcut(courseId: string): RaceShortcutDefinition | null {
  return courseId === CRYSTAL_CASCADE_RACE_ID ? CRYSTAL_CASCADE_PRISM_CURRENT_SHORTCUT : null;
}
