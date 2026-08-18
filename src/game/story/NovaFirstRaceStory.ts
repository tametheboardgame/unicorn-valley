import { NOVA_FIRST_RACE_QUEST_ID } from '../../content/r3Quests';
import type { QuestProgress, SaveGame } from '../save/saveSchema';
import { getQuestStepId } from '../quests/QuestEngine';

export const NOVA_CHARACTER_ID = 'character:nova' as const;
export const NOVA_FIRST_RACE_WON_FLAG = 'flag:nova-first-race-won' as const;

export type NovaFirstRacePhase = 'invitation' | 'ready-to-race' | 'result-ready' | 'complete';

export function getNovaFirstRacePhase(progress: QuestProgress): NovaFirstRacePhase {
  if (progress.status === 'completed') {
    return 'complete';
  }

  if (progress.status === 'not-started') {
    return 'invitation';
  }

  if (progress.currentStepId === getQuestStepId(NOVA_FIRST_RACE_QUEST_ID, 1)) {
    return 'ready-to-race';
  }

  if (progress.currentStepId === getQuestStepId(NOVA_FIRST_RACE_QUEST_ID, 2)) {
    return 'result-ready';
  }

  return 'invitation';
}

export function didWinNovaFirstRace(save: SaveGame): boolean {
  return save.world.flags[NOVA_FIRST_RACE_WON_FLAG] === true;
}

export function recordNovaFirstRaceResult(save: SaveGame, place: number): SaveGame {
  if (!Number.isInteger(place) || place < 1) {
    throw new Error(`Nova first-race place must be a positive integer. Received: ${place}`);
  }

  return {
    ...save,
    world: {
      ...save.world,
      flags: {
        ...save.world.flags,
        [NOVA_FIRST_RACE_WON_FLAG]: place === 1,
      },
    },
  };
}
