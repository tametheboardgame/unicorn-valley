import {
  PEBBLE_COLLECTION_QUEST_ID,
  PEBBLE_FOUNTAIN_REPAIRED_FLAG,
} from '../../content/r4PebbleStory';
import { getQuestStepId } from '../quests/QuestEngine';
import type { QuestProgress, SaveGame } from '../save/saveSchema';

export type PebbleStoryPhase =
  | 'introduction'
  | 'collecting'
  | 'return-to-pebble'
  | 'resolving'
  | 'completed';

export function getPebbleStoryPhase(progress: QuestProgress): PebbleStoryPhase {
  if (progress.status === 'not-started') {
    return 'introduction';
  }

  if (progress.status === 'completed') {
    return 'completed';
  }

  if (progress.currentStepId === getQuestStepId(PEBBLE_COLLECTION_QUEST_ID, 0)) {
    return 'collecting';
  }

  if (progress.currentStepId === getQuestStepId(PEBBLE_COLLECTION_QUEST_ID, 1)) {
    return 'return-to-pebble';
  }

  return 'resolving';
}

export function isPebbleFountainRepaired(save: SaveGame | null): boolean {
  return save?.world.flags[PEBBLE_FOUNTAIN_REPAIRED_FLAG] === true;
}
