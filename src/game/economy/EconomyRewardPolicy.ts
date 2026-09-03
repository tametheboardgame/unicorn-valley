import { FIREFLY_LANTERN_KEEPER_DISCOVERY_ID } from '../../content/r5FireflyLantern';
import { PIP_HOLLOW_TREE_QUEST_ID } from '../../content/r6GladeHomeContent';
import { MAPLE_CAKE_QUEST_ID, TANSY_MAP_QUEST_ID } from '../../content/r6VillageContent';
import type { SaveGame } from '../save/saveSchema';

export type EconomyRewardSource = 'quest' | 'discovery' | 'activity';

export interface EconomyRewardDefinition {
  id: string;
  source: EconomyRewardSource;
  amount: number;
  label: string;
  isEarned: (save: SaveGame) => boolean;
}

export const ECONOMY_REWARD_MEMORY_PREFIX = 'memory:economy-reward:';

export const ECONOMY_BALANCE_BANDS = {
  earlyPurchase: 2,
  standardPurchase: 4,
  aspirationalPurchase: 6,
  questReward: 2,
  firstActivityReward: 2,
} as const;

const SUBSTANTIVE_QUEST_REWARDS = [
  ['quest:willows-moonflowers', "Willow's Moonflowers"],
  ['quest:nova-first-race', "Nova's First Race"],
  ['quest:pips-strange-egg', "Pip's Strange Egg"],
  ['quest:marigold-picnic', "Marigold's Picnic Problem"],
  ['quest:pebble-curious-pieces', "Pebble's Peculiar Pieces"],
  ['quest:ripple-brook-song', "Ripple's Brook Song"],
  [TANSY_MAP_QUEST_ID, 'Tansy and the Lost Map Corners'],
  [MAPLE_CAKE_QUEST_ID, 'Maple and the Wobbly Cake Plan'],
  [PIP_HOLLOW_TREE_QUEST_ID, 'Pip and the Hollow Tree Whispers'],
] as const;

const DISCOVERY_MILESTONES = [
  { count: 5, amount: 1 },
  { count: 10, amount: 1 },
  { count: 20, amount: 2 },
  { count: 30, amount: 2 },
] as const;

function questCompleted(save: SaveGame, questId: string): boolean {
  return save.quests.byQuestId[questId]?.status === 'completed';
}

function uniqueDiscoveryCount(save: SaveGame): number {
  return new Set([...save.collections.discoveryIds, ...save.world.uniqueDiscoveryIds]).size;
}

export const R6_ECONOMY_REWARD_DEFINITIONS: readonly EconomyRewardDefinition[] = [
  ...SUBSTANTIVE_QUEST_REWARDS.map(
    ([questId, label]): EconomyRewardDefinition => ({
      id: `completed:${questId}`,
      source: 'quest',
      amount: ECONOMY_BALANCE_BANDS.questReward,
      label,
      isEarned: (save) => questCompleted(save, questId),
    }),
  ),
  ...DISCOVERY_MILESTONES.map(
    ({ count, amount }): EconomyRewardDefinition => ({
      id: `discovery-milestone:${count}`,
      source: 'discovery',
      amount,
      label: `${count} discoveries`,
      isEarned: (save) => uniqueDiscoveryCount(save) >= count,
    }),
  ),
  {
    id: 'activity:firefly-lantern:first-complete',
    source: 'activity',
    amount: ECONOMY_BALANCE_BANDS.firstActivityReward,
    label: 'Firefly Lantern first complete glow',
    isEarned: (save) =>
      save.collections.discoveryIds.includes(FIREFLY_LANTERN_KEEPER_DISCOVERY_ID) ||
      save.world.uniqueDiscoveryIds.includes(FIREFLY_LANTERN_KEEPER_DISCOVERY_ID),
  },
];

export function getEconomyRewardMemoryId(rewardId: string): string {
  return `${ECONOMY_REWARD_MEMORY_PREFIX}${rewardId}`;
}

export function isEconomyRewardClaimed(save: SaveGame, rewardId: string): boolean {
  return save.collections.memoryIds.includes(getEconomyRewardMemoryId(rewardId));
}
