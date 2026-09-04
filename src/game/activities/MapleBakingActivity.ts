import {
  BAKERY_OUTCOMES,
  MAPLE_BAKING_ACTIVITY_ID,
  MAPLE_BAKING_FIRST_COMPLETION_MEMORY,
  type BakeryCakeTheme,
} from '../../content/r65RepeatableActivities';
import type { SaveService } from '../save/SaveService';
import {
  getRepeatableActivityProgress,
  recordRepeatableActivityOutcome,
  type RepeatableActivityProgress,
  type RepeatableActivityResult,
} from './RepeatableActivityProgress';

const CONFIG = {
  activityId: MAPLE_BAKING_ACTIVITY_ID,
  firstCompletionMemoryId: MAPLE_BAKING_FIRST_COMPLETION_MEMORY,
  outcomeDiscoveryIds: BAKERY_OUTCOMES.map(({ discoveryId }) => discoveryId),
} as const;

export function getMapleBakingProgress(saveService: SaveService): RepeatableActivityProgress {
  return getRepeatableActivityProgress(saveService, CONFIG);
}

export function recordMapleBakingCake(
  saveService: SaveService,
  theme: BakeryCakeTheme,
): RepeatableActivityResult {
  const outcome = BAKERY_OUTCOMES.find((candidate) => candidate.theme === theme);
  if (!outcome) {
    throw new Error(`Unknown Maple baking theme: ${theme}`);
  }
  return recordRepeatableActivityOutcome(saveService, CONFIG, outcome.discoveryId);
}
