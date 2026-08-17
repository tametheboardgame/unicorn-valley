import type {
  CharacterDefinition,
  ContentBundle,
  DiscoveryDefinition,
  ItemDefinition,
  QuestDefinition,
} from './contentTypes';

export const ITEMS = [
  {
    id: 'item:moonflower-petal',
    name: 'Moonflower Petal',
    discoveryId: 'discovery:moonflower-glade',
  },
  {
    id: 'item:sparkle-berry',
    name: 'Sparkle Berry',
  },
] as const satisfies readonly ItemDefinition[];

export const CHARACTERS = [
  {
    id: 'character:pip',
    name: 'Pip',
    role: 'First valley friend',
  },
] as const satisfies readonly CharacterDefinition[];

export const DISCOVERIES = [
  {
    id: 'discovery:moonflower-glade',
    name: 'Moonflower Glade',
    description: 'The gentle glade around Moonflower Cottage.',
  },
] as const satisfies readonly DiscoveryDefinition[];

export const QUESTS = [
  {
    id: 'quest:first-sparkle',
    name: 'A Little Sparkle',
    steps: [
      { type: 'talk-to-character', characterId: 'character:pip' },
      { type: 'collect-item', itemId: 'item:moonflower-petal', quantity: 1 },
      { type: 'unlock-discovery', discoveryId: 'discovery:moonflower-glade' },
    ],
  },
] as const satisfies readonly QuestDefinition[];

export const PLACEHOLDER_CONTENT: ContentBundle = {
  items: ITEMS,
  characters: CHARACTERS,
  quests: QUESTS,
  discoveries: DISCOVERIES,
};
