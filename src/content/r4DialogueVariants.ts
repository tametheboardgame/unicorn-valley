import type { DialogueVariantSet } from './contentTypes';
import { WILLOW_GARDEN_PLANTED_FLAG, WILLOW_MOONFLOWERS_QUEST_ID } from './r2Quests';

export const WILLOW_POST_MOONFLOWERS_VARIANTS_ID =
  'dialogue-variants:willow-post-moonflowers' as const;
export const WILLOW_POST_MOONFLOWERS_SEEN_FLAG = 'r4:willow-post-moonflowers-seen';

export const R4_DIALOGUE_VARIANT_SETS = [
  {
    id: WILLOW_POST_MOONFLOWERS_VARIANTS_ID,
    variants: [
      {
        dialogueId: 'dialogue:willow-moonflowers-good-friend-followup',
        priority: 400,
        conditions: [
          {
            type: 'quest-status',
            questId: WILLOW_MOONFLOWERS_QUEST_ID,
            status: 'completed',
          },
          { type: 'world-flag', flagId: WILLOW_GARDEN_PLANTED_FLAG, value: true },
          {
            type: 'relationship-flag',
            characterId: 'character:willow',
            flag: WILLOW_POST_MOONFLOWERS_SEEN_FLAG,
          },
          {
            type: 'minimum-friendship-tier',
            characterId: 'character:willow',
            tier: 'good-friend',
          },
        ],
      },
      {
        dialogueId: 'dialogue:willow-moonflowers-returning-followup',
        priority: 300,
        conditions: [
          {
            type: 'quest-status',
            questId: WILLOW_MOONFLOWERS_QUEST_ID,
            status: 'completed',
          },
          { type: 'world-flag', flagId: WILLOW_GARDEN_PLANTED_FLAG, value: true },
          {
            type: 'relationship-flag',
            characterId: 'character:willow',
            flag: WILLOW_POST_MOONFLOWERS_SEEN_FLAG,
          },
        ],
      },
      {
        dialogueId: 'dialogue:willow-moonflowers-friend-followup',
        priority: 200,
        conditions: [
          {
            type: 'quest-status',
            questId: WILLOW_MOONFLOWERS_QUEST_ID,
            status: 'completed',
          },
          { type: 'world-flag', flagId: WILLOW_GARDEN_PLANTED_FLAG, value: true },
          {
            type: 'minimum-friendship-tier',
            characterId: 'character:willow',
            tier: 'friend',
          },
        ],
      },
      {
        dialogueId: 'dialogue:willow-moonflowers-followup',
        priority: 100,
        conditions: [
          {
            type: 'quest-status',
            questId: WILLOW_MOONFLOWERS_QUEST_ID,
            status: 'completed',
          },
        ],
      },
    ],
  },
] as const satisfies readonly DialogueVariantSet[];
