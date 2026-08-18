import type { QuestDefinition } from './contentTypes';
import { NOVA_TUTORIAL_RACE_ID } from './r3RaceIds';

export const NOVA_FIRST_RACE_QUEST_ID = 'quest:nova-first-race' as const;
export const SUNRISE_SPRINT_UNLOCKED_FLAG = 'flag:sunrise-sprint-unlocked' as const;

export const R3_QUESTS = [
  {
    id: NOVA_FIRST_RACE_QUEST_ID,
    name: "Nova's First Race",
    steps: [
      { type: 'talk-to-character', characterId: 'character:nova' },
      {
        type: 'finish-race',
        raceId: NOVA_TUTORIAL_RACE_ID,
        label: 'Finish your first Rainbow Run',
      },
      { type: 'talk-to-character', characterId: 'character:nova' },
      { type: 'award-friendship', characterId: 'character:nova', amount: 5 },
      { type: 'set-world-flag', flagId: SUNRISE_SPRINT_UNLOCKED_FLAG, value: true },
    ],
  },
] as const satisfies readonly QuestDefinition[];
