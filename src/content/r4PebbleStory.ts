import type {
  CharacterDefinition,
  DialogueDefinition,
  DiscoveryDefinition,
  ItemDefinition,
  QuestDefinition,
} from './contentTypes';
import type { SecretDiscoveryDefinition } from './r4Secrets';

export const PEBBLE_CHARACTER_ID = 'character:pebble' as const;
export const PEBBLE_COLLECTION_QUEST_ID = 'quest:pebble-curious-pieces' as const;
export const PEBBLE_CURIOUS_PIECE_ITEM_ID = 'item:pebble-curious-piece' as const;
export const PEBBLE_DISPLAY_REWARD_ITEM_ID = 'item:pebble-curiosity-display' as const;
export const PEBBLE_FOUNTAIN_REPAIRED_FLAG = 'flag:pebble-sunbeam-fountain-repaired' as const;

export const PEBBLE_MOON_GLASS_DISCOVERY_ID = 'discovery:pebble-moon-glass-washer' as const;
export const PEBBLE_STORY_SCREW_DISCOVERY_ID = 'discovery:pebble-story-house-star-screw' as const;
export const PEBBLE_RAINBOW_SPRING_DISCOVERY_ID = 'discovery:pebble-rainbow-spring' as const;

export const R4_PEBBLE_ITEMS = [
  {
    id: PEBBLE_CURIOUS_PIECE_ITEM_ID,
    name: 'Curious Piece',
    description: 'One of three peculiar little pieces Pebble can use to mend the Sunbeam Fountain.',
    category: 'quest',
    icon: '🔎',
    questCritical: true,
  },
  {
    id: PEBBLE_DISPLAY_REWARD_ITEM_ID,
    name: "Pebble's Curiosity Display",
    description: 'A tiny display box Pebble made for the best harmless oddments from your adventures.',
    category: 'decoration',
    icon: '🗃️',
  },
] as const satisfies readonly ItemDefinition[];

export const R4_PEBBLE_CHARACTERS = [
  {
    id: PEBBLE_CHARACTER_ID,
    name: 'Pebble',
    role: 'Collector, tinkerer and finder of useful odd things',
  },
] as const satisfies readonly CharacterDefinition[];

export const R4_PEBBLE_QUESTS = [
  {
    id: PEBBLE_COLLECTION_QUEST_ID,
    name: "Pebble's Peculiar Pieces",
    steps: [
      { type: 'collect-item', itemId: PEBBLE_CURIOUS_PIECE_ITEM_ID, quantity: 3 },
      { type: 'talk-to-character', characterId: PEBBLE_CHARACTER_ID },
      { type: 'consume-item', itemId: PEBBLE_CURIOUS_PIECE_ITEM_ID, quantity: 3 },
      { type: 'award-item', itemId: PEBBLE_DISPLAY_REWARD_ITEM_ID, quantity: 1 },
      { type: 'award-friendship', characterId: PEBBLE_CHARACTER_ID, amount: 10 },
      { type: 'set-world-flag', flagId: PEBBLE_FOUNTAIN_REPAIRED_FLAG, value: true },
    ],
  },
] as const satisfies readonly QuestDefinition[];

export const R4_PEBBLE_DISCOVERIES = [
  {
    id: PEBBLE_MOON_GLASS_DISCOVERY_ID,
    name: 'Moon-glass Washer',
    description: 'A cloudy little ring of moon-glass that gleams around its edges.',
    kind: 'secret',
    icon: '🌙',
    undiscoveredHint: 'Something round is hiding near an old Glade display.',
  },
  {
    id: PEBBLE_STORY_SCREW_DISCOVERY_ID,
    name: 'Star-headed Screw',
    description: 'A tiny brass screw with a five-pointed head, warm from the village sunshine.',
    kind: 'secret',
    icon: '⭐',
    undiscoveredHint: 'A lost piece may be tucked beyond the Story House.',
  },
  {
    id: PEBBLE_RAINBOW_SPRING_DISCOVERY_ID,
    name: 'Rainbow Spring',
    description: 'A springy coil that flashes a different colour every time it bounces.',
    kind: 'secret',
    icon: '🌈',
    undiscoveredHint: 'The meadow path to the south catches strange flashes of colour.',
  },
] as const satisfies readonly DiscoveryDefinition[];

export const R4_PEBBLE_SECRET_DEFINITIONS = [
  {
    id: 'secret:pebble-moon-glass-washer',
    discoveryId: PEBBLE_MOON_GLASS_DISCOVERY_ID,
    sceneKey: 'MoonflowerGladeScene',
    pattern: 'hidden-object',
    feedbackTier: 'twinkle',
    label: 'A cloudy little ring',
    actionLabel: 'Pick up',
    position: { x: 1000, y: 1435 },
    interactionRadius: 135,
    feedback: 'Odd thing found!\nA moon-glass washer was hiding in the grass. 🌙',
    conditions: [{ type: 'quest-status', questId: PEBBLE_COLLECTION_QUEST_ID, status: 'active' }],
    rewardItemId: PEBBLE_CURIOUS_PIECE_ITEM_ID,
  },
  {
    id: 'secret:pebble-story-house-star-screw',
    discoveryId: PEBBLE_STORY_SCREW_DISCOVERY_ID,
    sceneKey: 'SunbeamVillageScene',
    pattern: 'hidden-object',
    feedbackTier: 'secret',
    label: 'A star-shaped glint',
    actionLabel: 'Pick up',
    position: { x: 2325, y: 1450 },
    interactionRadius: 140,
    feedback: 'Curious piece found!\nA tiny star-headed screw was sparkling by the path. ⭐',
    conditions: [{ type: 'quest-status', questId: PEBBLE_COLLECTION_QUEST_ID, status: 'active' }],
    rewardItemId: PEBBLE_CURIOUS_PIECE_ITEM_ID,
  },
  {
    id: 'secret:pebble-rainbow-spring',
    discoveryId: PEBBLE_RAINBOW_SPRING_DISCOVERY_ID,
    sceneKey: 'RainbowMeadowScene',
    pattern: 'hidden-object',
    feedbackTier: 'twinkle',
    label: 'A bouncing flash',
    actionLabel: 'Pick up',
    position: { x: 2050, y: 1770 },
    interactionRadius: 145,
    feedback: 'Odd thing found!\nA rainbow spring bounced straight into your collection. 🌈',
    conditions: [{ type: 'quest-status', questId: PEBBLE_COLLECTION_QUEST_ID, status: 'active' }],
    rewardItemId: PEBBLE_CURIOUS_PIECE_ITEM_ID,
  },
] as const satisfies readonly SecretDiscoveryDefinition[];

export const R4_PEBBLE_DIALOGUES = [
  {
    id: 'dialogue:pebble-odd-things-intro',
    name: "Pebble's Peculiar Pieces - Introduction",
    startNodeId: 'dialogue-node:pebble-odd-things-intro-1',
    nodes: [
      {
        id: 'dialogue-node:pebble-odd-things-intro-1',
        type: 'line',
        speakerId: PEBBLE_CHARACTER_ID,
        text: 'Oh! You have excellent finding-hooves. The Sunbeam Fountain has stopped making its happy little shimmer, and I know exactly the sort of odd things that could fix it.',
        nextNodeId: 'dialogue-node:pebble-odd-things-intro-2',
      },
      {
        id: 'dialogue-node:pebble-odd-things-intro-2',
        type: 'line',
        speakerId: PEBBLE_CHARACTER_ID,
        text: 'I need three peculiar pieces. One is somewhere in Moonflower Glade, one is beyond the Story House, and one is down in Rainbow Meadow. None are rare, just well hidden.',
        nextNodeId: 'dialogue-node:pebble-odd-things-intro-3',
      },
      {
        id: 'dialogue-node:pebble-odd-things-intro-3',
        type: 'line',
        speakerId: PEBBLE_CHARACTER_ID,
        text: 'Look for little glints while you explore. If a thing looks too strange to be useful, it is probably perfect.',
      },
    ],
  },
  {
    id: 'dialogue:pebble-odd-things-reminder',
    name: "Pebble's Peculiar Pieces - Reminder",
    startNodeId: 'dialogue-node:pebble-odd-things-reminder-1',
    nodes: [
      {
        id: 'dialogue-node:pebble-odd-things-reminder-1',
        type: 'line',
        speakerId: PEBBLE_CHARACTER_ID,
        text: 'Still hunting? Try the Glade grass near an old display, the far side of the Story House, and the southern meadow path. The pieces will glint when you are close.',
      },
    ],
  },
  {
    id: 'dialogue:pebble-odd-things-return',
    name: "Pebble's Peculiar Pieces - Return",
    startNodeId: 'dialogue-node:pebble-odd-things-return-1',
    nodes: [
      {
        id: 'dialogue-node:pebble-odd-things-return-1',
        type: 'line',
        speakerId: PEBBLE_CHARACTER_ID,
        text: 'You found all three! Moon-glass, a star screw and a rainbow spring. They are completely mismatched. Wonderful.',
        nextNodeId: 'dialogue-node:pebble-odd-things-return-2',
      },
      {
        id: 'dialogue-node:pebble-odd-things-return-2',
        type: 'line',
        speakerId: PEBBLE_CHARACTER_ID,
        text: 'I can make the fountain sing again with these. I also made you a little curiosity display, because good finds deserve somewhere cosy to live.',
      },
    ],
  },
  {
    id: 'dialogue:pebble-odd-things-followup',
    name: "Pebble's Peculiar Pieces - Follow-up",
    startNodeId: 'dialogue-node:pebble-odd-things-followup-1',
    nodes: [
      {
        id: 'dialogue-node:pebble-odd-things-followup-1',
        type: 'line',
        speakerId: PEBBLE_CHARACTER_ID,
        text: 'Hear that tiny chime from the fountain? That is the sound of three ridiculous pieces being exactly the right pieces. Keep your curiosity display somewhere special.',
      },
    ],
  },
] as const satisfies readonly DialogueDefinition[];
