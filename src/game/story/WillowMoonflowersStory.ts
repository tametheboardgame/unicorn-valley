import {
  WILLOW_GARDEN_PLANTED_FLAG,
  WILLOW_MOONFLOWERS_QUEST_ID,
} from '../../content/r2Quests';
import type { QuestProgress, SaveGame } from '../save/saveSchema';
import { getQuestStepId } from '../quests/QuestEngine';

export const WILLOW_CHARACTER_ID = 'character:willow' as const;
export const WILLOW_MOONFLOWER_ITEM_ID = 'item:willow-moonflower' as const;
export const WILLOW_MOONFLOWER_REQUIRED_QUANTITY = 3;
export const WILLOW_LANTERN_ITEM_ID = 'item:moonflower-lantern' as const;

export type WillowStoryPhase =
  | 'not-started'
  | 'introduction'
  | 'collecting'
  | 'return-to-willow'
  | 'resolving'
  | 'completed';

export function getWillowStoryPhase(progress: QuestProgress): WillowStoryPhase {
  if (progress.status === 'not-started') {
    return 'not-started';
  }

  if (progress.status === 'completed') {
    return 'completed';
  }

  if (progress.currentStepId === getQuestStepId(WILLOW_MOONFLOWERS_QUEST_ID, 0)) {
    return 'introduction';
  }

  if (progress.currentStepId === getQuestStepId(WILLOW_MOONFLOWERS_QUEST_ID, 1)) {
    return 'collecting';
  }

  if (progress.currentStepId === getQuestStepId(WILLOW_MOONFLOWERS_QUEST_ID, 2)) {
    return 'return-to-willow';
  }

  return 'resolving';
}

export function isWillowGardenPlanted(save: SaveGame | null): boolean {
  return save?.world.flags[WILLOW_GARDEN_PLANTED_FLAG] === true;
}
