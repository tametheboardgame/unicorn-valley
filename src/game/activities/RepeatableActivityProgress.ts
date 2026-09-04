import type { DiscoveryId } from '../../content/contentTypes';
import type { SaveService } from '../save/SaveService';

export interface RepeatableActivityProgressConfig {
  activityId: string;
  firstCompletionMemoryId: string;
  outcomeDiscoveryIds: readonly DiscoveryId[];
}

export interface RepeatableActivityProgress {
  bestProgress: number;
  completedOutcomeCount: number;
  totalOutcomeCount: number;
  firstCompleted: boolean;
}

export interface RepeatableActivityResult extends RepeatableActivityProgress {
  firstCompletion: boolean;
  newOutcome: boolean;
  outcomeDiscoveryId: DiscoveryId;
}

function outcomeCount(
  discoveryIds: readonly string[],
  outcomeDiscoveryIds: readonly DiscoveryId[],
): number {
  return outcomeDiscoveryIds.filter((id) => discoveryIds.includes(id)).length;
}

export function getRepeatableActivityProgress(
  saveService: SaveService,
  config: RepeatableActivityProgressConfig,
): RepeatableActivityProgress {
  const save = saveService.load() ?? saveService.createNewGame();
  const completedOutcomeCount = outcomeCount(
    save.collections.discoveryIds,
    config.outcomeDiscoveryIds,
  );
  return {
    bestProgress: save.activities.miniGameRecords[config.activityId] ?? 0,
    completedOutcomeCount,
    totalOutcomeCount: config.outcomeDiscoveryIds.length,
    firstCompleted: save.collections.memoryIds.includes(config.firstCompletionMemoryId),
  };
}

export function recordRepeatableActivityOutcome(
  saveService: SaveService,
  config: RepeatableActivityProgressConfig,
  outcomeDiscoveryId: DiscoveryId,
): RepeatableActivityResult {
  if (!config.outcomeDiscoveryIds.includes(outcomeDiscoveryId)) {
    throw new Error(`Activity ${config.activityId} does not own outcome ${outcomeDiscoveryId}`);
  }

  const save = saveService.load() ?? saveService.createNewGame();
  const firstCompletion = !save.collections.memoryIds.includes(config.firstCompletionMemoryId);
  const newOutcome = !save.collections.discoveryIds.includes(outcomeDiscoveryId);
  const memoryIds = firstCompletion
    ? [...save.collections.memoryIds, config.firstCompletionMemoryId]
    : save.collections.memoryIds;
  const discoveryIds = newOutcome
    ? [...save.collections.discoveryIds, outcomeDiscoveryId]
    : save.collections.discoveryIds;
  const uniqueDiscoveryIds = save.world.uniqueDiscoveryIds.includes(outcomeDiscoveryId)
    ? save.world.uniqueDiscoveryIds
    : [...save.world.uniqueDiscoveryIds, outcomeDiscoveryId];
  const completedOutcomeCount = outcomeCount(discoveryIds, config.outcomeDiscoveryIds);
  const bestProgress = Math.max(
    save.activities.miniGameRecords[config.activityId] ?? 0,
    completedOutcomeCount,
  );

  saveService.save({
    ...save,
    activities: {
      ...save.activities,
      miniGameRecords: {
        ...save.activities.miniGameRecords,
        [config.activityId]: bestProgress,
      },
    },
    collections: {
      ...save.collections,
      memoryIds,
      discoveryIds,
    },
    world: {
      ...save.world,
      uniqueDiscoveryIds,
    },
  });

  return {
    bestProgress,
    completedOutcomeCount,
    totalOutcomeCount: config.outcomeDiscoveryIds.length,
    firstCompleted: true,
    firstCompletion,
    newOutcome,
    outcomeDiscoveryId,
  };
}
