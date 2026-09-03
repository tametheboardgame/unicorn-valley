import type { DiscoveryDefinition, ItemDefinition, QuestDefinition } from './contentTypes';

export const FERN_FIREFLY_WAY_QUEST_ID = 'quest:fern-fireflies-know-the-way' as const;
export const FERN_FIREFLY_WAY_ACTIVE_FLAG = 'flag:r6-fern-fireflies-active' as const;
export const FERN_FIREFLY_WAY_COMPLETE_FLAG = 'flag:r6-fern-fireflies-complete' as const;
export const FIREFLY_GROVE_OPEN_FLAG = 'flag:r6-firefly-grove-open' as const;
export const FIREFLY_GROVE_LIT_FLAG = 'flag:r6-firefly-grove-lit' as const;
export const WOODS_LIGHT_TRAIL_FLAG = 'flag:r6-woods-light-trail' as const;

export const TINY_TRACKS_QUEST_ID = 'quest:woods-tiny-tracks' as const;
export const TINY_TRACKS_ACTIVE_FLAG = 'flag:r6-woods-tiny-tracks-active' as const;
export const TINY_TRACKS_COMPLETE_FLAG = 'flag:r6-woods-tiny-tracks-complete' as const;

export const FIREFLY_GROVE_DISCOVERY_ID = 'discovery:woods-firefly-grove' as const;
export const FERN_LIGHT_TRAIL_DISCOVERY_ID = 'discovery:woods-fern-light-trail' as const;
export const ANCIENT_FRIENDLY_TREE_DISCOVERY_ID = 'discovery:woods-ancient-friendly-tree' as const;
export const FIREFLY_GROVE_HEART_DISCOVERY_ID = 'discovery:woods-firefly-grove-heart' as const;
export const MUSHROOM_RING_DISCOVERY_ID = 'discovery:woods-mushroom-ring' as const;
export const HIDDEN_LEAF_PATH_DISCOVERY_ID = 'discovery:woods-hidden-leaf-path' as const;
export const TINY_TRACKS_DISCOVERY_ID = 'discovery:woods-tiny-tracks' as const;
export const HOLLOW_LOG_PEEK_DISCOVERY_ID = 'discovery:woods-hollow-log-peek' as const;
export const LITTLE_MOSS_TAIL_DISCOVERY_ID = 'discovery:woods-little-moss-tail' as const;

export const FERN_FIREFLY_LANTERN_ITEM_ID = 'item:fern-firefly-lantern' as const;

export const R6_WHISPERING_WOODS_DEPTH_ITEMS = [
  {
    id: FERN_FIREFLY_LANTERN_ITEM_ID,
    name: 'Fern’s Firefly Lantern',
    description:
      'A tiny leaf-framed lantern whose warm dots of light remember the path into Firefly Grove.',
    category: 'decoration',
    icon: '🏮',
  },
] as const satisfies readonly ItemDefinition[];

export const R6_WHISPERING_WOODS_DEPTH_DISCOVERIES = [
  {
    id: FIREFLY_GROVE_DISCOVERY_ID,
    name: 'Firefly Grove',
    description:
      'A sheltered grove beyond Lantern Clearing where the fireflies gather in slow, friendly swirls.',
    icon: '✨',
    undiscoveredHint: 'Fern keeps watching a cluster of lights beyond Lantern Clearing.',
  },
  {
    id: FERN_LIGHT_TRAIL_DISCOVERY_ID,
    name: 'Fern’s Light Trail',
    description:
      'A short chain of patient fireflies waits between the main path and the hidden grove instead of drifting away.',
    kind: 'secret',
    icon: '🌟',
    undiscoveredHint: 'Some of the Lantern Clearing lights seem to be lining up deliberately.',
  },
  {
    id: ANCIENT_FRIENDLY_TREE_DISCOVERY_ID,
    name: 'Ancient Friendly Tree',
    description:
      'An enormous old tree answers a gentle touch with one warm wooden hum and a shower of harmless leaves.',
    kind: 'secret',
    icon: '🌳',
    undiscoveredHint: 'One very old trunk looks more welcoming than mysterious.',
  },
  {
    id: FIREFLY_GROVE_HEART_DISCOVERY_ID,
    name: 'Heart of Firefly Grove',
    description:
      'The grove lights gather around one little lantern plant and make the whole clearing glow together.',
    kind: 'secret',
    icon: '🏮',
    undiscoveredHint:
      'The deepest part of Firefly Grove has one lantern plant that never quite closes.',
  },
  {
    id: MUSHROOM_RING_DISCOVERY_ID,
    name: 'Mooncap Ring',
    description:
      'A neat ring of mooncaps wakes after dark or during magical weather and lights itself one mushroom at a time.',
    kind: 'secret',
    icon: '🍄',
    undiscoveredHint:
      'A circle of mooncaps near the lower path looks ordinary in bright clear weather.',
  },
  {
    id: HIDDEN_LEAF_PATH_DISCOVERY_ID,
    name: 'Hidden Leaf Path',
    description:
      'A soft trail under fallen leaves links the south grove back towards the friendly old tree.',
    kind: 'secret',
    icon: '🍂',
    undiscoveredHint: 'One patch of leaves keeps settling into a suspiciously tidy line.',
  },
  {
    id: TINY_TRACKS_DISCOVERY_ID,
    name: 'Tiny Mossy Tracks',
    description: 'Three-toed little marks cross the path and disappear underneath a hollow log.',
    kind: 'secret',
    icon: '🐾',
    undiscoveredHint: 'Something very small has crossed the path near Mooncap Grove.',
  },
  {
    id: HOLLOW_LOG_PEEK_DISCOVERY_ID,
    name: 'Hollow Log Rustle',
    description:
      'The tiny tracks reach a hollow log where a pair of bright eyes blink once from behind the moss.',
    kind: 'secret',
    icon: '🪵',
    undiscoveredHint: 'The tracks seem to point towards an old mossy log.',
  },
  {
    id: LITTLE_MOSS_TAIL_DISCOVERY_ID,
    name: 'Little Moss-tail',
    description:
      'A tiny leafy tail flicks out of sight. Whatever made the tracks is shy, harmless and definitely real.',
    kind: 'secret',
    icon: '🌿',
    undiscoveredHint:
      'Stay curious after the hollow-log rustle; the little visitor may peek out once more.',
  },
] as const satisfies readonly DiscoveryDefinition[];

export const R6_WHISPERING_WOODS_DEPTH_QUESTS = [
  {
    id: FERN_FIREFLY_WAY_QUEST_ID,
    name: 'Fern: Fireflies Know the Way',
    steps: [
      { type: 'unlock-discovery', discoveryId: FIREFLY_GROVE_DISCOVERY_ID },
      { type: 'set-world-flag', flagId: FIREFLY_GROVE_OPEN_FLAG, value: true },
      { type: 'set-world-flag', flagId: FERN_FIREFLY_WAY_ACTIVE_FLAG, value: true },
      { type: 'unlock-discovery', discoveryId: FERN_LIGHT_TRAIL_DISCOVERY_ID },
      { type: 'unlock-discovery', discoveryId: ANCIENT_FRIENDLY_TREE_DISCOVERY_ID },
      { type: 'unlock-discovery', discoveryId: FIREFLY_GROVE_HEART_DISCOVERY_ID },
      { type: 'set-world-flag', flagId: FERN_FIREFLY_WAY_ACTIVE_FLAG, value: false },
      { type: 'set-world-flag', flagId: FERN_FIREFLY_WAY_COMPLETE_FLAG, value: true },
      { type: 'set-world-flag', flagId: FIREFLY_GROVE_LIT_FLAG, value: true },
      { type: 'set-world-flag', flagId: WOODS_LIGHT_TRAIL_FLAG, value: true },
      { type: 'award-item', itemId: FERN_FIREFLY_LANTERN_ITEM_ID, quantity: 1 },
    ],
  },
  {
    id: TINY_TRACKS_QUEST_ID,
    name: 'Who Left These Tiny Tracks?',
    steps: [
      { type: 'unlock-discovery', discoveryId: TINY_TRACKS_DISCOVERY_ID },
      { type: 'set-world-flag', flagId: TINY_TRACKS_ACTIVE_FLAG, value: true },
      { type: 'unlock-discovery', discoveryId: HOLLOW_LOG_PEEK_DISCOVERY_ID },
      { type: 'unlock-discovery', discoveryId: LITTLE_MOSS_TAIL_DISCOVERY_ID },
      { type: 'set-world-flag', flagId: TINY_TRACKS_ACTIVE_FLAG, value: false },
      { type: 'set-world-flag', flagId: TINY_TRACKS_COMPLETE_FLAG, value: true },
    ],
  },
] as const satisfies readonly QuestDefinition[];
