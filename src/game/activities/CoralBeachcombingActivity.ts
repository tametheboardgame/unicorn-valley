import {
  BEACHCOMBING_OUTCOMES,
  CORAL_BEACHCOMBING_ACTIVITY_ID,
  CORAL_BEACHCOMBING_FIRST_COMPLETION_MEMORY,
  type BeachcombingTrail,
} from '../../content/r65RepeatableActivities';
import type { SaveService } from '../save/SaveService';
import {
  getRepeatableActivityProgress,
  recordRepeatableActivityOutcome,
  type RepeatableActivityProgress,
  type RepeatableActivityResult,
} from './RepeatableActivityProgress';

const CONFIG = {
  activityId: CORAL_BEACHCOMBING_ACTIVITY_ID,
  firstCompletionMemoryId: CORAL_BEACHCOMBING_FIRST_COMPLETION_MEMORY,
  outcomeDiscoveryIds: BEACHCOMBING_OUTCOMES.map(({ discoveryId }) => discoveryId),
} as const;

export function getCoralBeachcombingProgress(
  saveService: SaveService,
): RepeatableActivityProgress {
  return getRepeatableActivityProgress(saveService, CONFIG);
}

export function getNextBeachcombingTrail(saveService: SaveService): BeachcombingTrail {
  const save = saveService.load() ?? saveService.createNewGame();
  const undiscovered = BEACHCOMBING_OUTCOMES.find(
    ({ discoveryId }) => !save.collections.discoveryIds.includes(discoveryId),
  );
  return undiscovered?.trail ?? 'crab-tracks';
}

export function recordCoralBeachcombingTrail(
  saveService: SaveService,
  trail: BeachcombingTrail,
): RepeatableActivityResult {
  const outcome = BEACHCOMBING_OUTCOMES.find((candidate) => candidate.trail === trail);
  if (!outcome) {
    throw new Error(`Unknown Coral beachcombing trail: ${trail}`);
  }
  return recordRepeatableActivityOutcome(saveService, CONFIG, outcome.discoveryId);
}
