import type { SaveService } from '../save/SaveService';

export const FIREFLY_LANTERN_ACTIVITY_ID = 'minigame:firefly-lantern';
export const FIREFLY_LANTERN_FIRST_COMPLETION_MEMORY =
  'memory:r5-firefly-lantern-first-completion';

export interface FireflyLanternRecordResult {
  bestScore: number;
  firstCompletion: boolean;
}

export function getFireflyLanternBestScore(saveService: SaveService): number {
  return saveService.load()?.activities.miniGameRecords[FIREFLY_LANTERN_ACTIVITY_ID] ?? 0;
}

export function recordFireflyLanternResult(
  saveService: SaveService,
  score: number,
): FireflyLanternRecordResult {
  const save = saveService.load() ?? saveService.createNewGame();
  const previousBest = save.activities.miniGameRecords[FIREFLY_LANTERN_ACTIVITY_ID] ?? 0;
  const firstCompletion = !save.collections.memoryIds.includes(
    FIREFLY_LANTERN_FIRST_COMPLETION_MEMORY,
  );
  const bestScore = Math.max(previousBest, Math.max(0, Math.floor(score)));
  const memoryIds = firstCompletion
    ? [...save.collections.memoryIds, FIREFLY_LANTERN_FIRST_COMPLETION_MEMORY]
    : save.collections.memoryIds;

  saveService.save({
    ...save,
    activities: {
      ...save.activities,
      miniGameRecords: {
        ...save.activities.miniGameRecords,
        [FIREFLY_LANTERN_ACTIVITY_ID]: bestScore,
      },
    },
    collections: {
      ...save.collections,
      memoryIds,
    },
  });

  return { bestScore, firstCompletion };
}
