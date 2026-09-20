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
export { LUMA_COMPANION_HATCHED_FLAG } from '../game/home/CottageStoryFlags';
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
    name: 'Silver Feather by the Stream',
    description: 'A tiny silver feather caught in the reeds beside the Moonflower Glade stream.',
  },
  {
    id: PIP_EGG_CLUE_DISCOVERY_IDS[1],
    name: 'Warm Moon-Moss',
    description: 'A disturbed patch of moon-moss on the far bank that feels strangely warm.',
  },
  {
    id: PIP_EGG_CLUE_DISCOVERY_IDS[2],
    name: 'Tiny Starry Tracks',
    description: 'A little trail of star-shaped prints leading towards Moonflower Field.',
  },
  {
    id: PIP_STRANGE_EGG_DISCOVERY_ID,
    name: "Pip's Strange Egg",
    description:
      'A mysterious speckled egg nestled amongst the Moonflowers at the end of the trail.',
  },
] as const satisfies readonly DiscoveryDefinition[];

export const R4_EGG_QUESTS = [
  {
    id: PIP_STRANGE_EGG_QUEST_ID,
    name: "Pip's Mysterious Trail",
    steps: [
      // Pip starts the mystery himself. The four discoveries then form one readable physical trail.
      { type: 'talk-to-character', characterId: 'character:pip' },
      { type: 'unlock-discovery', discoveryId: PIP_EGG_CLUE_DISCOVERY_IDS[0] },
      { type: 'unlock-discovery', discoveryId: PIP_EGG_CLUE_DISCOVERY_IDS[1] },
      { type: 'unlock-discovery', discoveryId: PIP_EGG_CLUE_DISCOVERY_IDS[2] },
      { type: 'unlock-discovery', discoveryId: PIP_STRANGE_EGG_DISCOVERY_ID },
      // Finding the egg is not the ending. The player must bring the discovery back to Pip so the
      // story has an explicit conclusion before the egg appears safely in the cottage.
      { type: 'talk-to-character', characterId: 'character:pip' },
      { type: 'set-world-flag', flagId: PIP_STRANGE_EGG_FOUND_FLAG, value: true },
      { type: 'award-friendship', characterId: 'character:pip', amount: 1 },
    ],
  },
] as const satisfies readonly QuestDefinition[];
