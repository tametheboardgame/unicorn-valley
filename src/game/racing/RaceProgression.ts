import { SUNRISE_SPRINT_UNLOCKED_FLAG } from '../../content/r3Quests';
import { SUNRISE_SPRINT_RACE_ID } from '../../content/r3RaceIds';
import { CRYSTAL_CASCADE_RACE_ID } from '../../content/r5RaceIds';
import type { SaveGame } from '../save/saveSchema';

export type CrystalCascadeUnlockReason =
  | 'unlocked'
  | 'finish-sunrise-sprint'
  | 'finish-nova-story';

export interface CrystalCascadeUnlockState {
  unlocked: boolean;
  reason: CrystalCascadeUnlockReason;
  clue: string;
}

function hasFinishedRace(save: SaveGame, raceId: string): boolean {
  const record = save.activities.racesById[raceId];
  return record?.bestTimeMs !== null && record?.bestTimeMs !== undefined;
}

export function getCrystalCascadeUnlockState(save: SaveGame): CrystalCascadeUnlockState {
  if (hasFinishedRace(save, CRYSTAL_CASCADE_RACE_ID) || hasFinishedRace(save, SUNRISE_SPRINT_RACE_ID)) {
    return {
      unlocked: true,
      reason: 'unlocked',
      clue: 'Crystal Cascade is ready!',
    };
  }

  if (save.world.flags[SUNRISE_SPRINT_UNLOCKED_FLAG] === true) {
    return {
      unlocked: false,
      reason: 'finish-sunrise-sprint',
      clue: 'Finish Sunrise Sprint in Rainbow Meadow first.',
    };
  }

  return {
    unlocked: false,
    reason: 'finish-nova-story',
    clue: 'Race with Nova first, then finish Sunrise Sprint.',
  };
}
