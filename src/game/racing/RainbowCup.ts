import type { ItemId } from '../../content/contentTypes';
import { SUNRISE_SPRINT_UNLOCKED_FLAG } from '../../content/r3Quests';
import { SUNRISE_SPRINT_RACE_ID } from '../../content/r3RaceIds';
import { CRYSTAL_CASCADE_RACE_ID } from '../../content/r5RaceIds';
import { WHISPERING_WOODS_REGION_DISCOVERY_ID } from '../../content/r5WhisperingWoods';
import {
  MOONCAP_TRAIL_RACE_ID,
  PETAL_PARADE_RACE_ID,
  RAINBOW_CUP_COMPLETE_FLAG,
  RAINBOW_CUP_DISCOVERY_ID,
  RAINBOW_CUP_PENNANT_ITEM_ID,
  SHORELINE_SURGE_RACE_ID,
} from '../../content/r65RaceExpansion';
import { BEACH_RACE_ROUTE_READY_FLAG } from '../../content/r65StarlightBeach';
import type { SaveGame } from '../save/saveSchema';
import { REGULAR_RACE_COURSE_IDS } from './RaceCourse';
import { getCrystalCascadeUnlockState } from './RaceProgression';

export interface RainbowCupEventState {
  courseId: string;
  name: string;
  icon: string;
  unlocked: boolean;
  completed: boolean;
  bestTimeMs: number | null;
  clue: string;
}

export interface RainbowCupCompletionResult {
  save: SaveGame;
  completed: boolean;
  completedNow: boolean;
  rewardItemId: ItemId | null;
}

const EVENT_METADATA = [
  { courseId: SUNRISE_SPRINT_RACE_ID, name: 'Sunrise Sprint', icon: '🌅' },
  { courseId: PETAL_PARADE_RACE_ID, name: 'Petal Parade', icon: '🌸' },
  { courseId: CRYSTAL_CASCADE_RACE_ID, name: 'Crystal Cascade', icon: '💎' },
  { courseId: MOONCAP_TRAIL_RACE_ID, name: 'Mooncap Trail', icon: '🍄' },
  { courseId: SHORELINE_SURGE_RACE_ID, name: 'Shoreline Surge', icon: '🐚' },
] as const;

function raceBestTime(save: SaveGame, raceId: string): number | null {
  const value = save.activities.racesById[raceId]?.bestTimeMs;
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

export function hasFinishedRegularRace(save: SaveGame, raceId: string): boolean {
  return raceBestTime(save, raceId) !== null;
}

export function isRainbowCupComplete(save: SaveGame): boolean {
  return REGULAR_RACE_COURSE_IDS.every((raceId) => hasFinishedRegularRace(save, raceId));
}

function unlockStateForRace(save: SaveGame, raceId: string): { unlocked: boolean; clue: string } {
  if (hasFinishedRegularRace(save, raceId)) {
    return { unlocked: true, clue: 'Finished — race again any time.' };
  }

  if (raceId === SUNRISE_SPRINT_RACE_ID) {
    return save.world.flags[SUNRISE_SPRINT_UNLOCKED_FLAG] === true
      ? { unlocked: true, clue: 'Ready in Rainbow Meadow.' }
      : { unlocked: false, clue: 'Race with Nova first.' };
  }

  if (raceId === CRYSTAL_CASCADE_RACE_ID) {
    const state = getCrystalCascadeUnlockState(save);
    return { unlocked: state.unlocked, clue: state.clue };
  }

  if (raceId === PETAL_PARADE_RACE_ID) {
    return { unlocked: true, clue: 'Ready beside the Rainbow Meadow race hub.' };
  }

  if (raceId === MOONCAP_TRAIL_RACE_ID) {
    const unlocked = save.collections.discoveryIds.includes(WHISPERING_WOODS_REGION_DISCOVERY_ID);
    return unlocked
      ? { unlocked: true, clue: 'Ready near Mooncap Grove.' }
      : { unlocked: false, clue: 'Visit Whispering Woods first.' };
  }

  if (raceId === SHORELINE_SURGE_RACE_ID) {
    const unlocked = save.world.flags[BEACH_RACE_ROUTE_READY_FLAG] === true;
    return unlocked
      ? { unlocked: true, clue: 'Skipper’s shoreline route is ready.' }
      : { unlocked: false, clue: 'Help Skipper finish Follow the Wind at Starlight Beach.' };
  }

  return { unlocked: false, clue: 'This course is not part of the Rainbow Cup.' };
}

export function getRainbowCupEventStates(save: SaveGame): readonly RainbowCupEventState[] {
  return EVENT_METADATA.map(({ courseId, name, icon }) => {
    const bestTimeMs = raceBestTime(save, courseId);
    const unlock = unlockStateForRace(save, courseId);
    return {
      courseId,
      name,
      icon,
      unlocked: unlock.unlocked,
      completed: bestTimeMs !== null,
      bestTimeMs,
      clue: unlock.clue,
    };
  });
}

function appendUnique(values: readonly string[], value: string): string[] {
  return values.includes(value) ? [...values] : [...values, value];
}

export function applyRainbowCupCompletion(save: SaveGame): RainbowCupCompletionResult {
  if (!isRainbowCupComplete(save)) {
    return {
      save,
      completed: false,
      completedNow: false,
      rewardItemId: null,
    };
  }

  const alreadyCompleted = save.world.flags[RAINBOW_CUP_COMPLETE_FLAG] === true;
  const alreadyOwnsReward = (save.inventory.itemQuantities[RAINBOW_CUP_PENNANT_ITEM_ID] ?? 0) > 0;
  const itemQuantities = { ...save.inventory.itemQuantities };
  if (!alreadyOwnsReward) {
    itemQuantities[RAINBOW_CUP_PENNANT_ITEM_ID] = 1;
  }

  const nextSave: SaveGame = {
    ...save,
    inventory: {
      ...save.inventory,
      itemQuantities,
    },
    collections: {
      ...save.collections,
      discoveryIds: appendUnique(save.collections.discoveryIds, RAINBOW_CUP_DISCOVERY_ID),
    },
    world: {
      ...save.world,
      flags: {
        ...save.world.flags,
        [RAINBOW_CUP_COMPLETE_FLAG]: true,
      },
      uniqueDiscoveryIds: appendUnique(save.world.uniqueDiscoveryIds, RAINBOW_CUP_DISCOVERY_ID),
    },
  };

  return {
    save: nextSave,
    completed: true,
    completedNow: !alreadyCompleted,
    rewardItemId: !alreadyOwnsReward ? RAINBOW_CUP_PENNANT_ITEM_ID : null,
  };
}
