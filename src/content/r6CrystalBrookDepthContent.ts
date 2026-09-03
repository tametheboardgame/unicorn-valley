import type { DiscoveryDefinition, ItemDefinition, QuestDefinition } from './contentTypes';

export const ECHO_CRYSTAL_SONG_QUEST_ID = 'quest:echo-crystal-song' as const;
export const ECHO_CRYSTAL_SONG_ACTIVE_FLAG = 'flag:r6-echo-crystal-song-active' as const;
export const ECHO_CRYSTAL_SONG_COMPLETE_FLAG = 'flag:r6-echo-crystal-song-complete' as const;
export const CRYSTAL_GROTTO_OPEN_FLAG = 'flag:r6-crystal-grotto-open' as const;
export const CRYSTAL_GROTTO_GLOWING_FLAG = 'flag:r6-crystal-grotto-glowing' as const;

export const CRYSTAL_GROTTO_CHAMBER_DISCOVERY_ID = 'discovery:crystal-grotto-chamber' as const;
export const CRYSTAL_GROTTO_LOW_NOTE_DISCOVERY_ID = 'discovery:crystal-grotto-low-note' as const;
export const CRYSTAL_GROTTO_BRIGHT_NOTE_DISCOVERY_ID =
  'discovery:crystal-grotto-bright-note' as const;
export const CRYSTAL_GROTTO_BELL_NOTE_DISCOVERY_ID = 'discovery:crystal-grotto-bell-note' as const;
export const CRYSTAL_GROTTO_SONG_DISCOVERY_ID = 'discovery:crystal-grotto-song' as const;
export const BROOK_WATERFALL_RAINBOW_DISCOVERY_ID = 'discovery:brook-waterfall-rainbow' as const;
export const BROOK_REFLECTION_POOL_DISCOVERY_ID = 'discovery:brook-reflection-pool' as const;
export const BROOK_STEPPING_CHIME_DISCOVERY_ID = 'discovery:brook-stepping-stone-chime' as const;

export const ECHO_CRYSTAL_CHIME_ITEM_ID = 'item:echo-crystal-chime' as const;

export const R6_CRYSTAL_BROOK_DEPTH_ITEMS = [
  {
    id: ECHO_CRYSTAL_CHIME_ITEM_ID,
    name: 'Echo Crystal Chime',
    description:
      'Three smooth Brook crystals hung together so their tiny notes can follow you home.',
    category: 'decoration',
    icon: '🔔',
  },
] as const satisfies readonly ItemDefinition[];

export const R6_CRYSTAL_BROOK_DEPTH_DISCOVERIES = [
  {
    id: CRYSTAL_GROTTO_CHAMBER_DISCOVERY_ID,
    name: 'Crystal Grotto Chamber',
    description:
      'A cool little cave beyond Prism Grotto where crystal points glow around a shallow singing pool.',
    icon: '💎',
    undiscoveredHint: 'Echo keeps listening near the far Grotto Clearing.',
  },
  {
    id: CRYSTAL_GROTTO_LOW_NOTE_DISCOVERY_ID,
    name: 'Grotto Low Note',
    description: 'A broad blue crystal answers with a low, warm hum when it is touched.',
    kind: 'secret',
    icon: '🎵',
    undiscoveredHint: 'The biggest grotto crystal seems to be waiting for a gentle tap.',
  },
  {
    id: CRYSTAL_GROTTO_BRIGHT_NOTE_DISCOVERY_ID,
    name: 'Grotto Bright Note',
    description: 'A narrow aqua crystal rings one clear bright note above the underground pool.',
    kind: 'secret',
    icon: '🎶',
    undiscoveredHint: 'A slim crystal catches more light than the others.',
  },
  {
    id: CRYSTAL_GROTTO_BELL_NOTE_DISCOVERY_ID,
    name: 'Grotto Bell Note',
    description: 'A tiny lavender crystal finishes the pattern with a soft bell-like ping.',
    kind: 'secret',
    icon: '🔔',
    undiscoveredHint: 'The smallest grotto crystal may have the last word.',
  },
  {
    id: CRYSTAL_GROTTO_SONG_DISCOVERY_ID,
    name: 'Echo’s Crystal Song',
    description:
      'Three different crystal notes join the old Brook water melody and make the whole grotto glow brighter.',
    kind: 'secret',
    icon: '✨',
    undiscoveredHint: 'Three grotto notes sound as though they belong together.',
  },
  {
    id: BROOK_WATERFALL_RAINBOW_DISCOVERY_ID,
    name: 'Waterfall Mist Rainbow',
    description: 'Fine waterfall mist catches the light and hangs a tiny rainbow above the bank.',
    kind: 'secret',
    icon: '🌈',
    undiscoveredHint: 'The waterfall mist looks different when the light changes.',
  },
  {
    id: BROOK_REFLECTION_POOL_DISCOVERY_ID,
    name: 'Reflection Pool Stars',
    description:
      'The still pool reflects a scatter of bright points that do not quite match the sky above.',
    kind: 'secret',
    icon: '💧',
    undiscoveredHint: 'The quietest pool has more to show later in the day.',
  },
  {
    id: BROOK_STEPPING_CHIME_DISCOVERY_ID,
    name: 'Stepping-Stone Chime',
    description: 'Three flat stones answer splashing hooves with three different little notes.',
    kind: 'secret',
    icon: '🪨',
    undiscoveredHint: 'One bend in the stepping stones sounds unusually musical.',
  },
] as const satisfies readonly DiscoveryDefinition[];

export const R6_CRYSTAL_BROOK_DEPTH_QUESTS = [
  {
    id: ECHO_CRYSTAL_SONG_QUEST_ID,
    name: 'Echo and the Crystal Song',
    steps: [
      { type: 'unlock-discovery', discoveryId: CRYSTAL_GROTTO_CHAMBER_DISCOVERY_ID },
      { type: 'set-world-flag', flagId: CRYSTAL_GROTTO_OPEN_FLAG, value: true },
      { type: 'set-world-flag', flagId: ECHO_CRYSTAL_SONG_ACTIVE_FLAG, value: true },
      { type: 'unlock-discovery', discoveryId: CRYSTAL_GROTTO_LOW_NOTE_DISCOVERY_ID },
      { type: 'unlock-discovery', discoveryId: CRYSTAL_GROTTO_BRIGHT_NOTE_DISCOVERY_ID },
      { type: 'unlock-discovery', discoveryId: CRYSTAL_GROTTO_BELL_NOTE_DISCOVERY_ID },
      { type: 'unlock-discovery', discoveryId: CRYSTAL_GROTTO_SONG_DISCOVERY_ID },
      { type: 'set-world-flag', flagId: ECHO_CRYSTAL_SONG_ACTIVE_FLAG, value: false },
      { type: 'set-world-flag', flagId: ECHO_CRYSTAL_SONG_COMPLETE_FLAG, value: true },
      { type: 'set-world-flag', flagId: CRYSTAL_GROTTO_GLOWING_FLAG, value: true },
      { type: 'award-item', itemId: ECHO_CRYSTAL_CHIME_ITEM_ID, quantity: 1 },
    ],
  },
] as const satisfies readonly QuestDefinition[];
