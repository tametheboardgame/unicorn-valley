import type {
  CharacterDefinition,
  ContentBundle,
  DialogueDefinition,
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

export const DIALOGUES = [
  {
    id: 'dialogue:interaction-sample',
    name: 'Interaction Sample',
    startNodeId: 'dialogue-node:sample-hello',
    nodes: [
      {
        id: 'dialogue-node:sample-hello',
        type: 'line',
        speakerId: 'character:pip',
        text: 'Hello! This is a little test note from Pip. The real welcome comes later.',
        nextNodeId: 'dialogue-node:sample-choice',
      },
      {
        id: 'dialogue-node:sample-choice',
        type: 'choice',
        speakerId: 'character:pip',
        prompt: 'What sounds nicest in a magical valley?',
        choices: [
          {
            id: 'explore',
            label: 'Finding secrets!',
            nextNodeId: 'dialogue-node:sample-goodbye',
            effects: [{ type: 'set-flag', flagId: 'flag:dialogue-test-explorer', value: true }],
          },
          {
            id: 'home',
            label: 'Making a cosy home!',
            nextNodeId: 'dialogue-node:sample-goodbye',
            effects: [{ type: 'set-flag', flagId: 'flag:dialogue-test-homebody', value: true }],
          },
        ],
      },
      {
        id: 'dialogue-node:sample-goodbye',
        type: 'line',
        speakerId: 'character:pip',
        text: 'Good choice! The valley can remember choices like that. See you properly soon!',
      },
    ],
  },
] as const satisfies readonly DialogueDefinition[];

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
  dialogues: DIALOGUES,
};
