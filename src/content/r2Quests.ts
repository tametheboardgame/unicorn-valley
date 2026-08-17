import type { QuestDefinition } from './contentTypes';

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
] as const satisfies readonly QuestDefinition[];
