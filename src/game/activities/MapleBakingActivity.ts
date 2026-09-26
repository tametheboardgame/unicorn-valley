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
