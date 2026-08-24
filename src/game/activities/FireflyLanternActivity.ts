import {
  FIREFLY_ENDLESS_GLOW_DISCOVERY_ID,
  FIREFLY_LANTERN_KEEPER_DISCOVERY_ID,
  FIREFLY_MIDNIGHT_MASTER_DISCOVERY_ID,
  FIREFLY_PRISM_KEEPER_DISCOVERY_ID,
} from '../../content/r5FireflyLantern';
import type { SaveService } from '../save/SaveService';
import type { SaveGame } from '../save/saveSchema';
import {
  FIREFLY_ENDLESS_GLOW_THRESHOLD,
  FIREFLY_ENDLESS_MASTERY_THRESHOLD,
  FIREFLY_NORMAL_TARGET,
  type FireflyLanternMode,
} from './FireflyLanternRules';

export const FIREFLY_LANTERN_ACTIVITY_ID = 'minigame:firefly-lantern';
export const FIREFLY_LANTERN_MULTICOLOUR_ACTIVITY_ID = 'minigame:firefly-lantern-multicolour';
export const FIREFLY_LANTERN_ENDLESS_ACTIVITY_ID = 'minigame:firefly-lantern-endless';

export const FIREFLY_LANTERN_FIRST_COMPLETION_MEMORY =
  'memory:r5-firefly-lantern-first-completion';
export const FIREFLY_LANTERN_MULTICOLOUR_COMPLETION_MEMORY =
  'memory:r5-firefly-lantern-multicolour-completion';
export const FIREFLY_LANTERN_ENDLESS_GLOW_MEMORY = 'memory:r5-firefly-lantern-endless-glow';
export const FIREFLY_LANTERN_ENDLESS_MASTERY_MEMORY = 'memory:r5-firefly-lantern-endless-mastery';

export type FireflyLanternMilestone =
  | 'normal-first'
  | 'multicolour-first'
  | 'endless-glow'
  | 'endless-mastery';

export interface FireflyLanternProgress {
  modesUnlocked: boolean;
  normalBest: number;
  multicolourBest: number;
  endlessBest: number;
}

export interface FireflyLanternAttemptResult extends FireflyLanternProgress {
  firstCompletion: boolean;
  newMilestones: readonly FireflyLanternMilestone[];
}

export interface RecordFireflyLanternAttemptOptions {
  mode: FireflyLanternMode;
  score: number;
  completed: boolean;
}

const MILESTONE_CONTENT = [
  {
    milestone: 'normal-first',
    memoryId: FIREFLY_LANTERN_FIRST_COMPLETION_MEMORY,
    discoveryId: FIREFLY_LANTERN_KEEPER_DISCOVERY_ID,
  },
  {
    milestone: 'multicolour-first',
    memoryId: FIREFLY_LANTERN_MULTICOLOUR_COMPLETION_MEMORY,
    discoveryId: FIREFLY_PRISM_KEEPER_DISCOVERY_ID,
  },
  {
    milestone: 'endless-glow',
    memoryId: FIREFLY_LANTERN_ENDLESS_GLOW_MEMORY,
    discoveryId: FIREFLY_ENDLESS_GLOW_DISCOVERY_ID,
  },
  {
    milestone: 'endless-mastery',
    memoryId: FIREFLY_LANTERN_ENDLESS_MASTERY_MEMORY,
    discoveryId: FIREFLY_MIDNIGHT_MASTER_DISCOVERY_ID,
  },
] as const;

function safeScore(score: number): number {
  return Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
}

function recordIdForMode(mode: FireflyLanternMode): string {
  switch (mode) {
    case 'normal':
      return FIREFLY_LANTERN_ACTIVITY_ID;
    case 'multicolour':
      return FIREFLY_LANTERN_MULTICOLOUR_ACTIVITY_ID;
    case 'endless':
      return FIREFLY_LANTERN_ENDLESS_ACTIVITY_ID;
  }
}

function progressFromSave(save: SaveGame): FireflyLanternProgress {
  return {
    modesUnlocked: save.collections.memoryIds.includes(FIREFLY_LANTERN_FIRST_COMPLETION_MEMORY),
    normalBest: save.activities.miniGameRecords[FIREFLY_LANTERN_ACTIVITY_ID] ?? 0,
    multicolourBest:
      save.activities.miniGameRecords[FIREFLY_LANTERN_MULTICOLOUR_ACTIVITY_ID] ?? 0,
    endlessBest: save.activities.miniGameRecords[FIREFLY_LANTERN_ENDLESS_ACTIVITY_ID] ?? 0,
  };
}

export function reconcileFireflyLanternProgress(saveService: SaveService): SaveGame {
  const save = saveService.load() ?? saveService.createNewGame();
  const discoveryIds = [...save.collections.discoveryIds];
  let changed = false;

  for (const milestone of MILESTONE_CONTENT) {
    if (
      save.collections.memoryIds.includes(milestone.memoryId) &&
      !discoveryIds.includes(milestone.discoveryId)
    ) {
      discoveryIds.push(milestone.discoveryId);
      changed = true;
    }
  }

  if (!changed) {
    return save;
  }

  return saveService.save({
    ...save,
    collections: {
      ...save.collections,
      discoveryIds,
    },
  });
}

export function getFireflyLanternProgress(saveService: SaveService): FireflyLanternProgress {
  return progressFromSave(reconcileFireflyLanternProgress(saveService));
}

export function getFireflyLanternBestScore(saveService: SaveService): number {
  return getFireflyLanternProgress(saveService).normalBest;
}

export function recordFireflyLanternAttempt(
  saveService: SaveService,
  options: RecordFireflyLanternAttemptOptions,
): FireflyLanternAttemptResult {
  const save = reconcileFireflyLanternProgress(saveService);
  const score = safeScore(options.score);
  const recordId = recordIdForMode(options.mode);
  const previousBest = save.activities.miniGameRecords[recordId] ?? 0;
  const memoryIds = [...save.collections.memoryIds];
  const discoveryIds = [...save.collections.discoveryIds];
  const newMilestones: FireflyLanternMilestone[] = [];

  const awardMilestone = (milestoneId: FireflyLanternMilestone): void => {
    const milestone = MILESTONE_CONTENT.find(({ milestone }) => milestone === milestoneId);
    if (!milestone || memoryIds.includes(milestone.memoryId)) {
      return;
    }
    memoryIds.push(milestone.memoryId);
    if (!discoveryIds.includes(milestone.discoveryId)) {
      discoveryIds.push(milestone.discoveryId);
    }
    newMilestones.push(milestoneId);
  };

  if (options.mode === 'normal' && options.completed && score >= FIREFLY_NORMAL_TARGET) {
    awardMilestone('normal-first');
  }
  if (options.mode === 'multicolour' && options.completed && score >= FIREFLY_NORMAL_TARGET) {
    awardMilestone('multicolour-first');
  }
  if (options.mode === 'endless' && score >= FIREFLY_ENDLESS_GLOW_THRESHOLD) {
    awardMilestone('endless-glow');
  }
  if (options.mode === 'endless' && score >= FIREFLY_ENDLESS_MASTERY_THRESHOLD) {
    awardMilestone('endless-mastery');
  }

  const bestScore = Math.max(previousBest, score);
  const nextSave = saveService.save({
    ...save,
    activities: {
      ...save.activities,
      miniGameRecords: {
        ...save.activities.miniGameRecords,
        [recordId]: bestScore,
      },
    },
    collections: {
      ...save.collections,
      memoryIds,
      discoveryIds,
    },
  });
  const progress = progressFromSave(nextSave);

  return {
    ...progress,
    firstCompletion: newMilestones.includes('normal-first'),
    newMilestones,
  };
}

export function recordFireflyLanternResult(
  saveService: SaveService,
  score: number,
): FireflyLanternAttemptResult {
  const safe = safeScore(score);
  return recordFireflyLanternAttempt(saveService, {
    mode: 'normal',
    score: safe,
    completed: safe >= FIREFLY_NORMAL_TARGET,
  });
}
