import type {
  CharacterId,
  DialogueCondition,
  DialogueId,
} from './contentTypes';
import { WILLOW_GARDEN_PLANTED_FLAG, WILLOW_MOONFLOWERS_QUEST_ID } from './r2Quests';
import { NOVA_FIRST_RACE_QUEST_ID, SUNRISE_SPRINT_UNLOCKED_FLAG } from './r3Quests';

export type FriendVisitId = `friend-visit:${string}`;

export interface FriendVisitDefinition {
  id: FriendVisitId;
  characterId: CharacterId;
  priority: number;
  seenFlag: string;
  position: { x: number; y: number };
  icon: string;
  conditions: readonly DialogueCondition[];
  dialogueIds: {
    default: DialogueId;
    personalised?: DialogueId;
  };
}

export const WILLOW_COTTAGE_VISIT_SEEN_FLAG = 'r4:cottage-visit:willow-seen';
export const NOVA_COTTAGE_VISIT_SEEN_FLAG = 'r4:cottage-visit:nova-seen';

export const R4_FRIEND_VISITS = [
  {
    id: 'friend-visit:willow-cottage',
    characterId: 'character:willow',
    priority: 200,
    seenFlag: WILLOW_COTTAGE_VISIT_SEEN_FLAG,
    position: { x: 650, y: 430 },
    icon: '🌿',
    conditions: [
      {
        type: 'minimum-friendship-tier',
        characterId: 'character:willow',
        tier: 'friend',
      },
      {
        type: 'quest-status',
        questId: WILLOW_MOONFLOWERS_QUEST_ID,
        status: 'completed',
      },
      { type: 'world-flag', flagId: WILLOW_GARDEN_PLANTED_FLAG, value: true },
      {
        type: 'relationship-flag',
        characterId: 'character:willow',
        flag: WILLOW_COTTAGE_VISIT_SEEN_FLAG,
        value: false,
      },
    ],
    dialogueIds: {
      default: 'dialogue:willow-cottage-visit',
      personalised: 'dialogue:willow-cottage-visit-decorated',
    },
  },
  {
    id: 'friend-visit:nova-cottage',
    characterId: 'character:nova',
    priority: 100,
    seenFlag: NOVA_COTTAGE_VISIT_SEEN_FLAG,
    position: { x: 1180, y: 430 },
    icon: '🏁',
    conditions: [
      {
        type: 'minimum-friendship-tier',
        characterId: 'character:nova',
        tier: 'friend',
      },
      {
        type: 'quest-status',
        questId: NOVA_FIRST_RACE_QUEST_ID,
        status: 'completed',
      },
      { type: 'world-flag', flagId: SUNRISE_SPRINT_UNLOCKED_FLAG, value: true },
      {
        type: 'relationship-flag',
        characterId: 'character:nova',
        flag: NOVA_COTTAGE_VISIT_SEEN_FLAG,
        value: false,
      },
    ],
    dialogueIds: {
      default: 'dialogue:nova-cottage-visit',
      personalised: 'dialogue:nova-cottage-visit-ribbon',
    },
  },
] as const satisfies readonly FriendVisitDefinition[];
