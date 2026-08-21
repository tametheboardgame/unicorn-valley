import { RIPPLE_BROOK_QUEST_ID } from '../../content/r5CrystalBrookStory';
import { getQuestStepId } from '../quests/QuestEngine';
import type { QuestProgress } from '../save/saveSchema';

export type RippleStoryPhase = 'introduction' | 'collecting' | 'return-to-ripple' | 'completed';

export function getRippleStoryPhase(progress: QuestProgress): RippleStoryPhase {
  if (progress.status === 'completed') {
    return 'completed';
  }
  if (
    progress.status === 'not-started' ||
    progress.currentStepId === getQuestStepId(RIPPLE_BROOK_QUEST_ID, 0)
  ) {
    return 'introduction';
  }
  if (progress.currentStepId === getQuestStepId(RIPPLE_BROOK_QUEST_ID, 2)) {
    return 'return-to-ripple';
  }
  return 'collecting';
}
