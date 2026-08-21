import type {
  CharacterDefinition,
  DialogueDefinition,
  DiscoveryDefinition,
  ItemDefinition,
  QuestDefinition,
} from './contentTypes';
import type { SecretDiscoveryDefinition } from './r4Secrets';
import { SINGING_SHELL_ITEM_ID } from './r5CrystalBrook';

export const RIPPLE_CHARACTER_ID = 'character:ripple' as const;
export const RIPPLE_BROOK_QUEST_ID = 'quest:ripple-brook-song' as const;
export const BROOK_PRISM_MOBILE_ITEM_ID = 'item:brook-prism-mobile' as const;
export const BROOK_SONG_RESTORED_FLAG = 'flag:r5-brook-song-restored' as const;
export const BROOK_ECHO_TRAIL_REVEALED_FLAG = 'flag:r5-brook-echo-trail-revealed' as const;

export const REED_WHISPER_DISCOVERY_ID = 'discovery:brook-reed-whisper' as const;
export const CRYSTAL_CHIME_DISCOVERY_ID = 'discovery:brook-crystal-chime' as const;
export const WATER_SONG_DISCOVERY_ID = 'discovery:brook-water-song' as const;

export const R5_CRYSTAL_BROOK_STORY_ITEMS = [
  {
    id: BROOK_PRISM_MOBILE_ITEM_ID,
    name: 'Brook Prism Mobile',
    description: 'A hanging crystal mobile that throws little river rainbows around the cottage.',
    category: 'decoration',
    icon: '🔷',
  },
] as const satisfies readonly ItemDefinition[];

export const R5_CRYSTAL_BROOK_STORY_CHARACTERS = [
  {
    id: RIPPLE_CHARACTER_ID,
    name: 'Ripple',
    role: 'Brook guide and collector of tiny water songs',
  },
] as const satisfies readonly CharacterDefinition[];

export const R5_CRYSTAL_BROOK_STORY_QUESTS = [
  {
    id: RIPPLE_BROOK_QUEST_ID,
    name: "Ripple's Brook Song",
    steps: [
      { type: 'talk-to-character', characterId: RIPPLE_CHARACTER_ID },
      { type: 'collect-item', itemId: SINGING_SHELL_ITEM_ID, quantity: 2 },
      { type: 'talk-to-character', characterId: RIPPLE_CHARACTER_ID },
      { type: 'award-item', itemId: BROOK_PRISM_MOBILE_ITEM_ID, quantity: 1 },
      { type: 'award-friendship', characterId: RIPPLE_CHARACTER_ID, amount: 10 },
      { type: 'set-world-flag', flagId: BROOK_SONG_RESTORED_FLAG, value: true },
    ],
  },
] as const satisfies readonly QuestDefinition[];

export const R5_CRYSTAL_BROOK_STORY_DISCOVERIES = [
  {
    id: REED_WHISPER_DISCOVERY_ID,
    name: 'Reed Whisper',
    description: 'The tall brook reeds make a soft shushing note when the water bends around them.',
    kind: 'secret',
    icon: '🌾',
    undiscoveredHint: 'Some reeds near the upper bank seem to move in time with the water.',
  },
  {
    id: CRYSTAL_CHIME_DISCOVERY_ID,
    name: 'Crystal Chime',
    description:
      'A river crystal rings like a tiny bell when a drop lands in just the right place.',
    kind: 'secret',
    icon: '🔔',
    undiscoveredHint: 'A crystal close to the middle stream keeps catching single bright drops.',
  },
  {
    id: WATER_SONG_DISCOVERY_ID,
    name: 'Crystal Brook Water Song',
    description: 'The reed whisper and crystal chime fit together as one gentle brook melody.',
    kind: 'secret',
    icon: '🎵',
    undiscoveredHint: 'Two small sounds may be parts of one bigger song.',
  },
] as const satisfies readonly DiscoveryDefinition[];

export const R5_CRYSTAL_BROOK_STORY_SECRETS = [
  {
    id: 'secret:brook-reed-whisper',
    discoveryId: REED_WHISPER_DISCOVERY_ID,
    sceneKey: 'CrystalBrookScene',
    pattern: 'conditional-clue',
    feedbackTier: 'twinkle',
    label: 'Rustling reeds',
    actionLabel: 'Listen',
    position: { x: 1660, y: 470 },
    interactionRadius: 145,
    feedback: 'A little clue!\nThe reeds are whispering in a three-beat rhythm. 🌾',
  },
  {
    id: 'secret:brook-crystal-chime',
    discoveryId: CRYSTAL_CHIME_DISCOVERY_ID,
    sceneKey: 'CrystalBrookScene',
    pattern: 'conditional-clue',
    feedbackTier: 'twinkle',
    label: 'A ringing crystal',
    actionLabel: 'Listen',
    position: { x: 2090, y: 880 },
    interactionRadius: 145,
    feedback: 'Another clue!\nA falling drop makes the crystal answer like a tiny bell. 🔔',
  },
  {
    id: 'secret:brook-water-song',
    discoveryId: WATER_SONG_DISCOVERY_ID,
    sceneKey: 'CrystalBrookScene',
    pattern: 'hidden-path',
    feedbackTier: 'grand',
    label: 'Two sounds meeting',
    actionLabel: 'Follow the song',
    position: { x: 2570, y: 1580 },
    interactionRadius: 165,
    feedback:
      'Big discovery!\nThe reed whisper and crystal chime join into Crystal Brook’s water song. 🎵',
    worldFlagId: BROOK_ECHO_TRAIL_REVEALED_FLAG,
    conditions: [
      { type: 'discovery', discoveryId: REED_WHISPER_DISCOVERY_ID },
      { type: 'discovery', discoveryId: CRYSTAL_CHIME_DISCOVERY_ID },
    ],
    revealedPath: [
      { x: 2100, y: 1160 },
      { x: 2210, y: 1280 },
      { x: 2320, y: 1390 },
      { x: 2440, y: 1500 },
      { x: 2570, y: 1580 },
    ],
  },
] as const satisfies readonly SecretDiscoveryDefinition[];

export const R5_CRYSTAL_BROOK_STORY_DIALOGUES = [
  {
    id: 'dialogue:ripple-brook-song-intro',
    name: "Ripple's Brook Song - Introduction",
    startNodeId: 'dialogue-node:ripple-brook-song-intro-1',
    nodes: [
      {
        id: 'dialogue-node:ripple-brook-song-intro-1',
        type: 'line',
        speakerId: RIPPLE_CHARACTER_ID,
        text: 'Hello! I am Ripple. Crystal Brook usually hums when the water reaches this bend, but today one little part of the tune is missing.',
        nextNodeId: 'dialogue-node:ripple-brook-song-intro-2',
      },
      {
        id: 'dialogue-node:ripple-brook-song-intro-2',
        type: 'line',
        speakerId: RIPPLE_CHARACTER_ID,
        text: 'Two Singing Shells should help me hear where the tune has gone. There are always a couple resting beside the reeds and lower pool.',
      },
    ],
  },
  {
    id: 'dialogue:ripple-brook-song-reminder',
    name: "Ripple's Brook Song - Reminder",
    startNodeId: 'dialogue-node:ripple-brook-song-reminder-1',
    nodes: [
      {
        id: 'dialogue-node:ripple-brook-song-reminder-1',
        type: 'line',
        speakerId: RIPPLE_CHARACTER_ID,
        text: 'Listen near the reed bank and the lower pool. The shells are not hiding very hard, they like being found.',
      },
    ],
  },
  {
    id: 'dialogue:ripple-brook-song-return',
    name: "Ripple's Brook Song - Return",
    startNodeId: 'dialogue-node:ripple-brook-song-return-1',
    nodes: [
      {
        id: 'dialogue-node:ripple-brook-song-return-1',
        type: 'line',
        speakerId: RIPPLE_CHARACTER_ID,
        text: 'You found both! Hear how they answer each other? That was the missing bit. The brook sounds like itself again.',
        nextNodeId: 'dialogue-node:ripple-brook-song-return-2',
      },
      {
        id: 'dialogue-node:ripple-brook-song-return-2',
        type: 'line',
        speakerId: RIPPLE_CHARACTER_ID,
        text: 'I made you a prism mobile from safe little crystal chips. Hang it at home and you can keep a piece of the brook light with you.',
      },
    ],
  },
  {
    id: 'dialogue:ripple-brook-song-followup',
    name: "Ripple's Brook Song - Follow-up",
    startNodeId: 'dialogue-node:ripple-brook-song-followup-1',
    nodes: [
      {
        id: 'dialogue-node:ripple-brook-song-followup-1',
        type: 'line',
        speakerId: RIPPLE_CHARACTER_ID,
        text: 'The water song is still here. Sometimes I stand quietly and try to spot which little sound it will use next.',
      },
    ],
  },
] as const satisfies readonly DialogueDefinition[];
