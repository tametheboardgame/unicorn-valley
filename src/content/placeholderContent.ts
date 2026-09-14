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
    role: "A tiny glimmerling explorer and the player's first friend in the valley.",
  },
] as const satisfies readonly CharacterDefinition[];

export const DISCOVERIES = [
  {
    id: 'discovery:moonflower-glade',
    name: 'Moonflower Glade',
    description: 'The gentle glade around Moonflower Cottage.',
  },
  {
    id: 'discovery:moonflower-sparkle',
    name: 'Moonflower Sparkle',
    description: 'A tiny warm sparkle found beside the moonflowers near home.',
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
  {
    id: 'dialogue:pip-welcome',
    name: 'Pip Welcome',
    startNodeId: 'dialogue-node:pip-welcome-hello',
    nodes: [
      {
        id: 'dialogue-node:pip-welcome-hello',
        type: 'line',
        speakerId: 'character:pip',
        text: "Poof! Oh! Hello! I'm Pip. I'm a glimmerling. Sorry about the smoke. I was practising a dramatic entrance!",
        nextNodeId: 'dialogue-node:pip-welcome-home',
      },
      {
        id: 'dialogue-node:pip-welcome-home',
        type: 'line',
        speakerId: 'character:pip',
        text: 'Welcome to Moonflower Glade. That cosy cottage is your new home, and I can show you around.',
        nextNodeId: 'dialogue-node:pip-welcome-explore',
      },
      {
        id: 'dialogue-node:pip-welcome-explore',
        type: 'line',
        speakerId: 'character:pip',
        text: 'First, I spotted a little golden sparkle beside the path. Go and take a look. I will wait right here!',
      },
    ],
  },
  {
    id: 'dialogue:pip-first-discovery',
    name: 'Pip First Discovery',
    startNodeId: 'dialogue-node:pip-found-sparkle',
    nodes: [
      {
        id: 'dialogue-node:pip-found-sparkle',
        type: 'line',
        speakerId: 'character:pip',
        text: 'You found the Moonflower Sparkle! I knew it would like you.',
        nextNodeId: 'dialogue-node:pip-next-mystery',
      },
      {
        id: 'dialogue-node:pip-next-mystery',
        type: 'line',
        speakerId: 'character:pip',
        text: 'Come and talk to me. I noticed something else strange near the stream, and I think we have a mystery to solve.',
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
  dialogueVariantSets: [],
};
