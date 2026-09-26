import {
  BAKERY_OUTCOMES,
  MAPLE_BAKING_ACTIVITY_ID,
  MAPLE_BAKING_FIRST_COMPLETION_MEMORY,
  type BakeryCakeTheme,
} from '../../content/r65RepeatableActivities';
import {
  MAPLE_CAKE_MOONFLOWER_FLAG,
  MAPLE_CAKE_RAINBOW_FLAG,
  MAPLE_CAKE_SUNSHINE_FLAG,
  WOBBLY_CAKE_ITEM_ID,
} from '../../content/r6VillageContent';
import { gameEventBus } from '../events/GameEventBus';
import { InventoryService } from '../inventory/InventoryService';
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


export const MAPLE_REPEAT_BAKE_COST = 1 as const;

export type MapleCakeRating = 'lovely-wobble' | 'brilliant-wobble' | 'wobble-masterpiece';

export interface MapleCakeScoreBreakdown {
  ingredients: number;
  mixing: number;
  stacking: number;
  icing: number;
}

export interface MapleCakeJudgement {
  score: number;
  rating: MapleCakeRating;
  ratingLabel: string;
  shimmerPayout: 1 | 2 | 3;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function judgeMapleCake(scores: MapleCakeScoreBreakdown): MapleCakeJudgement {
  const score = clampScore(
    clampScore(scores.ingredients) * 0.3 +
      clampScore(scores.mixing) * 0.35 +
      clampScore(scores.stacking) * 0.25 +
      clampScore(scores.icing) * 0.1,
  );

  if (score >= 80) {
    return {
      score,
      rating: 'wobble-masterpiece',
      ratingLabel: 'Wobble Masterpiece',
      shimmerPayout: 3,
    };
  }
  if (score >= 55) {
    return {
      score,
      rating: 'brilliant-wobble',
      ratingLabel: 'Brilliant Wobble',
      shimmerPayout: 2,
    };
  }
  return {
    score,
    rating: 'lovely-wobble',
    ratingLabel: 'Lovely Wobble',
    shimmerPayout: 1,
  };
}

const QUEST_THEME_FLAGS = {
  sunshine: MAPLE_CAKE_SUNSHINE_FLAG,
  moonflower: MAPLE_CAKE_MOONFLOWER_FLAG,
  rainbow: MAPLE_CAKE_RAINBOW_FLAG,
} as const satisfies Record<BakeryCakeTheme, string>;

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

export function completeMapleQuestCake(saveService: SaveService, theme: BakeryCakeTheme): void {
  const save = saveService.load() ?? saveService.createNewGame();
  const flags = {
    ...save.world.flags,
    [MAPLE_CAKE_SUNSHINE_FLAG]: theme === 'sunshine',
    [MAPLE_CAKE_MOONFLOWER_FLAG]: theme === 'moonflower',
    [MAPLE_CAKE_RAINBOW_FLAG]: theme === 'rainbow',
  };

  saveService.save({
    ...save,
    world: {
      ...save.world,
      flags,
    },
  });

  for (const [candidate, flagId] of Object.entries(QUEST_THEME_FLAGS) as Array<
    [BakeryCakeTheme, (typeof QUEST_THEME_FLAGS)[BakeryCakeTheme]]
  >) {
    gameEventBus.emit('WORLD_FLAG_CHANGED', {
      flagId,
      value: candidate === theme,
    });
  }

  new InventoryService(saveService).addItem(WOBBLY_CAKE_ITEM_ID, 1);
}
