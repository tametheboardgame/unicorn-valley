import type { DiscoveryDefinition, ItemDefinition, QuestDefinition } from './contentTypes';

export const BREEZE_WINDMILL_QUEST_ID = 'quest:breeze-windmill-view' as const;
export const BREEZE_WINDMILL_ACTIVE_FLAG = 'flag:r6-breeze-windmill-active' as const;
export const WINDMILL_LOOKOUT_OPEN_FLAG = 'flag:r6-windmill-lookout-open' as const;
export const BREEZE_WINDMILL_COMPLETE_FLAG = 'flag:r6-breeze-windmill-complete' as const;
export const MEADOW_FLOWER_CIRCLE_REVEALED_FLAG = 'flag:r6-meadow-flower-circle-revealed' as const;

export const WINDMILL_WHISPER_DISCOVERY_ID = 'discovery:windmill-whisper-bell' as const;
export const WINDMILL_LOOKOUT_DISCOVERY_ID = 'discovery:windmill-lookout' as const;
export const WINDMILL_SKY_GLINT_DISCOVERY_ID = 'discovery:windmill-sky-glint' as const;
export const MEADOW_FLOWER_CIRCLE_DISCOVERY_ID = 'discovery:meadow-hidden-flower-circle' as const;
export const MEADOW_RAINBOW_REFLECTION_DISCOVERY_ID =
  'discovery:meadow-rainbow-reflection' as const;
export const MEADOW_BUTTERFLY_PARADE_DISCOVERY_ID = 'discovery:meadow-butterfly-parade' as const;

export const WINDMILL_SKY_PENNANT_ITEM_ID = 'item:windmill-sky-pennant' as const;

export const R6_MEADOW_RUN_ITEMS = [
  {
    id: WINDMILL_SKY_PENNANT_ITEM_ID,
    name: 'Windmill Sky Pennant',
    description:
      'A little blue-and-gold pennant from Breeze, patterned after the view from Windmill Lookout.',
    category: 'decoration',
    icon: '🎏',
  },
] as const satisfies readonly ItemDefinition[];

export const R6_MEADOW_RUN_DISCOVERIES = [
  {
    id: WINDMILL_WHISPER_DISCOVERY_ID,
    name: 'Windmill Whisper Bell',
    description: 'A tiny bell beneath the old windmill answers the breeze with three clear notes.',
    kind: 'secret',
    icon: '🔔',
    undiscoveredHint: 'Breeze keeps listening for something near the old windmill.',
  },
  {
    id: WINDMILL_LOOKOUT_DISCOVERY_ID,
    name: 'Windmill Lookout',
    description:
      'A real little lookout tucked beside the Meadow windmill, high enough to see the race flags and flower paths at once.',
    icon: '🌬️',
    undiscoveredHint: 'The windmill may have a way up if its bell is answered.',
  },
  {
    id: WINDMILL_SKY_GLINT_DISCOVERY_ID,
    name: 'Sky Glint',
    description:
      'From Windmill Lookout, a bright glint reveals a curved trail through the Meadow that is easy to miss from ground level.',
    kind: 'secret',
    icon: '✨',
    undiscoveredHint: 'High places make small Meadow secrets easier to spot.',
  },
  {
    id: MEADOW_FLOWER_CIRCLE_DISCOVERY_ID,
    name: 'Hidden Flower Circle',
    description:
      'A ring of tiny flowers that only becomes obvious when Meadow light and weather make the petals shimmer together.',
    kind: 'secret',
    icon: '🌼',
    undiscoveredHint: 'One patch of Meadow flowers seems to wait for special light or weather.',
  },
  {
    id: MEADOW_RAINBOW_REFLECTION_DISCOVERY_ID,
    name: 'Rainbow Pond Reflection',
    description:
      'For a moment the Rainbow Pond reflects a complete little rainbow, even where the sky itself has none.',
    kind: 'secret',
    icon: '🌈',
    undiscoveredHint: 'The pond changes its mind about what the sky looks like.',
  },
  {
    id: MEADOW_BUTTERFLY_PARADE_DISCOVERY_ID,
    name: 'Butterfly Parade',
    description:
      'A loose line of Meadow butterflies loops from the flower patch towards the hidden circle like a tiny parade.',
    kind: 'secret',
    icon: '🦋',
    undiscoveredHint:
      'Juniper says the Meadow butterflies sometimes all choose the same direction.',
  },
] as const satisfies readonly DiscoveryDefinition[];

export const R6_MEADOW_RUN_QUESTS = [
  {
    id: BREEZE_WINDMILL_QUEST_ID,
    name: 'Breeze and the View From Up There',
    steps: [
      { type: 'unlock-discovery', discoveryId: WINDMILL_WHISPER_DISCOVERY_ID },
      { type: 'set-world-flag', flagId: BREEZE_WINDMILL_ACTIVE_FLAG, value: true },
      { type: 'unlock-discovery', discoveryId: WINDMILL_LOOKOUT_DISCOVERY_ID },
      { type: 'set-world-flag', flagId: WINDMILL_LOOKOUT_OPEN_FLAG, value: true },
      { type: 'unlock-discovery', discoveryId: WINDMILL_SKY_GLINT_DISCOVERY_ID },
      { type: 'set-world-flag', flagId: BREEZE_WINDMILL_ACTIVE_FLAG, value: false },
      { type: 'set-world-flag', flagId: BREEZE_WINDMILL_COMPLETE_FLAG, value: true },
      { type: 'award-item', itemId: WINDMILL_SKY_PENNANT_ITEM_ID, quantity: 1 },
    ],
  },
] as const satisfies readonly QuestDefinition[];
