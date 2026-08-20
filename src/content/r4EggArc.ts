import type { CharacterDefinition, DiscoveryDefinition, QuestDefinition } from './contentTypes';

export const PIP_STRANGE_EGG_QUEST_ID = 'quest:pips-strange-egg' as const;
export const PIP_EGG_CLUE_DISCOVERY_IDS = [
  'discovery:pip-egg-clue-silver-feather',
  'discovery:pip-egg-clue-warm-moss',
  'discovery:pip-egg-clue-starlight-shell',
] as const;
export const PIP_STRANGE_EGG_DISCOVERY_ID = 'discovery:pip-strange-egg' as const;
export const PIP_STRANGE_EGG_FOUND_FLAG = 'flag:pip-strange-egg-found' as const;
export const PIP_EGG_HATCH_READY_FLAG = 'flag:pip-strange-egg-hatch-ready' as const;
export const LUMA_COMPANION_HATCHED_FLAG = 'flag:companion-luma-hatched' as const;
export const LUMA_CHARACTER_ID = 'character:luma' as const;

export const R4_EGG_CHARACTERS = [
  {
    id: LUMA_CHARACTER_ID,
    name: 'Luma',
    role: 'Tiny starry companion',
  },
] as const satisfies readonly CharacterDefinition[];

export const R4_EGG_DISCOVERIES = [
  {
    id: PIP_EGG_CLUE_DISCOVERY_IDS[0],
    name: 'Silver Feather',
    description: 'A tiny silver feather that shimmers even in the shade.',
  },
  {
    id: PIP_EGG_CLUE_DISCOVERY_IDS[1],
    name: 'Warm Moss',
    description: 'A patch of moon-moss that feels strangely warm beneath your hoof.',
  },
  {
    id: PIP_EGG_CLUE_DISCOVERY_IDS[2],
    name: 'Starlight Shell Mark',
    description: 'A little star-shaped mark pressed into the earth beside the moonflowers.',
  },
  {
    id: PIP_STRANGE_EGG_DISCOVERY_ID,
    name: "Pip's Strange Egg",
    description: 'A mysterious speckled egg with a soft glow hidden deep in Moonflower Glade.',
  },
] as const satisfies readonly DiscoveryDefinition[];

export const R4_EGG_QUESTS = [
  {
    id: PIP_STRANGE_EGG_QUEST_ID,
    name: "Pip's Strange Egg",
    steps: [
      { type: 'talk-to-character', characterId: 'character:pip' },
      { type: 'unlock-discovery', discoveryId: PIP_EGG_CLUE_DISCOVERY_IDS[0] },
      { type: 'unlock-discovery', discoveryId: PIP_EGG_CLUE_DISCOVERY_IDS[1] },
      { type: 'unlock-discovery', discoveryId: PIP_EGG_CLUE_DISCOVERY_IDS[2] },
      { type: 'unlock-discovery', discoveryId: PIP_STRANGE_EGG_DISCOVERY_ID },
      { type: 'set-world-flag', flagId: PIP_STRANGE_EGG_FOUND_FLAG, value: true },
      { type: 'award-friendship', characterId: 'character:pip', amount: 1 },
    ],
  },
] as const satisfies readonly QuestDefinition[];
