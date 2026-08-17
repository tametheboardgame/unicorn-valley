import type { QuestDefinition } from './contentTypes';

export const WILLOW_MOONFLOWERS_QUEST_ID = 'quest:willows-moonflowers' as const;
export const WILLOW_GARDEN_PLANTED_FLAG = 'flag:willow-garden-planted' as const;

export const R2_QUESTS = [
  {
    id: 'quest:engine-demo',
    name: 'A Sunny Little Errand',
    steps: [
      { type: 'talk-to-character', characterId: 'character:pip' },
      { type: 'collect-item', itemId: 'item:berry-bun', quantity: 2 },
      { type: 'award-item', itemId: 'item:sunbeam-cushion', quantity: 1 },
      { type: 'set-world-flag', flagId: 'flag:quest-engine-demo-complete', value: true },
    ],
  },
  {
    id: WILLOW_MOONFLOWERS_QUEST_ID,
    name: "Willow's Moonflowers",
    steps: [
      { type: 'talk-to-character', characterId: 'character:willow' },
      { type: 'collect-item', itemId: 'item:willow-moonflower', quantity: 3 },
      { type: 'talk-to-character', characterId: 'character:willow' },
      { type: 'consume-item', itemId: 'item:willow-moonflower', quantity: 3 },
      { type: 'award-item', itemId: 'item:moonflower-lantern', quantity: 1 },
      { type: 'award-friendship', characterId: 'character:willow', amount: 5 },
      { type: 'set-world-flag', flagId: WILLOW_GARDEN_PLANTED_FLAG, value: true },
    ],
  },
] as const satisfies readonly QuestDefinition[];
