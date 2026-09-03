import type {
  CharacterDefinition,
  DiscoveryDefinition,
  ItemDefinition,
  QuestDefinition,
} from './contentTypes';
import { MAPLE_CHARACTER_ID, MAPLE_CAKE_QUEST_ID } from './r6VillageContent';

export const CLOVER_CHARACTER_ID = 'character:clover' as const;
export const JUNIPER_CHARACTER_ID = 'character:juniper' as const;

export const WILLOW_AFTER_DARK_QUEST_ID = 'quest:willow-moonflowers-after-dark' as const;
export const NOVA_NO_FINISH_LINE_QUEST_ID = 'quest:nova-race-with-no-finish-line' as const;
export const PEBBLE_ODD_STONE_QUEST_ID = 'quest:pebble-stone-that-doesnt-match' as const;
export const JUNIPER_BUTTERFLY_COUNT_QUEST_ID = 'quest:juniper-butterfly-count' as const;
export const MAPLE_PICNIC_SPOT_QUEST_ID = 'quest:maple-perfect-picnic-spot' as const;

export const WILLOW_AFTER_DARK_COMPLETE_FLAG = 'flag:r6-wp11-willow-after-dark-complete' as const;
export const NOVA_NO_FINISH_LINE_COMPLETE_FLAG =
  'flag:r6-wp11-nova-no-finish-line-complete' as const;
export const PEBBLE_ODD_STONE_COMPLETE_FLAG = 'flag:r6-wp11-pebble-odd-stone-complete' as const;
export const JUNIPER_BUTTERFLY_COUNT_COMPLETE_FLAG =
  'flag:r6-wp11-juniper-butterfly-count-complete' as const;
export const MAPLE_PICNIC_SPOT_COMPLETE_FLAG = 'flag:r6-wp11-maple-picnic-spot-complete' as const;

export const MOONFLOWERS_AFTER_DARK_DISCOVERY_ID = 'discovery:moonflowers-after-dark' as const;
export const NO_FINISH_POND_TURN_DISCOVERY_ID = 'discovery:no-finish-line-pond-turn' as const;
export const NO_FINISH_PICNIC_TURN_DISCOVERY_ID = 'discovery:no-finish-line-picnic-turn' as const;
export const NO_FINISH_WINDMILL_TURN_DISCOVERY_ID =
  'discovery:no-finish-line-windmill-turn' as const;
export const ODD_STONE_DISCOVERY_ID = 'discovery:stone-that-doesnt-match' as const;
export const ODD_STONE_STORYHOUSE_RUBBING_DISCOVERY_ID =
  'discovery:odd-stone-storyhouse-rubbing' as const;
export const ODD_STONE_REFLECTION_DISCOVERY_ID = 'discovery:odd-stone-reflection-match' as const;
export const JUNIPER_BUTTERFLY_COUNT_DISCOVERY_ID = 'discovery:juniper-butterfly-count' as const;
export const MAPLE_PICNIC_SPOT_DISCOVERY_ID = 'discovery:maple-perfect-picnic-spot' as const;

export const MOONFLOWER_NIGHT_MEMORY_ITEM_ID = 'item:moonflower-night-memory' as const;
export const FRIENDSHIP_ROUTE_PENNANT_ITEM_ID = 'item:friendship-route-pennant' as const;
export const ODD_STONE_BOOKEND_ITEM_ID = 'item:odd-stone-bookend' as const;

export const R6_EXISTING_VALLEY_QUEST_CHARACTERS = [
  {
    id: CLOVER_CHARACTER_ID,
    name: 'Clover',
    role: 'Cheerful race regular who likes interesting routes more than perfect lines',
  },
  {
    id: JUNIPER_CHARACTER_ID,
    name: 'Juniper',
    role: 'Tiny-nature watcher who notices butterflies, beetles and footprints first',
  },
] as const satisfies readonly CharacterDefinition[];

export const R6_EXISTING_VALLEY_QUEST_ITEMS = [
  {
    id: MOONFLOWER_NIGHT_MEMORY_ITEM_ID,
    name: 'Moonflower Night Memory',
    description:
      'A little glowing keepsake from the night Willow’s Moonflowers answered the stars.',
    category: 'decoration',
    icon: '🌙',
    discoveryId: MOONFLOWERS_AFTER_DARK_DISCOVERY_ID,
  },
  {
    id: FRIENDSHIP_ROUTE_PENNANT_ITEM_ID,
    name: 'Friendship Route Pennant',
    description:
      'A bright pennant from Nova and Clover for a Meadow route where stopping to look around counts as winning.',
    category: 'decoration',
    icon: '🚩',
    discoveryId: NO_FINISH_WINDMILL_TURN_DISCOVERY_ID,
  },
  {
    id: ODD_STONE_BOOKEND_ITEM_ID,
    name: 'Odd Stone Bookend',
    description:
      'Pebble turned the stone that did not match into a bookend, keeping its strange reflection pattern visible.',
    category: 'decoration',
    icon: '🪨',
    discoveryId: ODD_STONE_REFLECTION_DISCOVERY_ID,
  },
] as const satisfies readonly ItemDefinition[];

export const R6_EXISTING_VALLEY_QUEST_DISCOVERIES = [
  {
    id: MOONFLOWERS_AFTER_DARK_DISCOVERY_ID,
    name: 'Moonflowers After Dark',
    description:
      'Willow’s planted Moonflowers answer one another with tiny points of light when the Glade grows quiet.',
    kind: 'secret',
    icon: '🌙',
    undiscoveredHint: 'Willow’s garden may have something new to show after the sun goes down.',
  },
  {
    id: NO_FINISH_POND_TURN_DISCOVERY_ID,
    name: 'No-Finish Pond Turn',
    description:
      'Nova and Clover’s untimed Meadow route curls around Rainbow Pond instead of aiming for a finish gate.',
    icon: '🐸',
    undiscoveredHint: 'Clover’s doodled route starts by bending around the pond.',
  },
  {
    id: NO_FINISH_PICNIC_TURN_DISCOVERY_ID,
    name: 'No-Finish Picnic Turn',
    description:
      'The route climbs Picnic Hill slowly enough to see the flags, flowers and windmill at once.',
    icon: '🧺',
    undiscoveredHint: 'The untimed route has a second marker somewhere with a very good view.',
  },
  {
    id: NO_FINISH_WINDMILL_TURN_DISCOVERY_ID,
    name: 'No-Finish Windmill Turn',
    description:
      'The last marker loops beneath Windmill Lookout and points back into the Meadow instead of towards a finish line.',
    icon: '🌬️',
    undiscoveredHint: 'One final route marker waits near the windmill.',
  },
  {
    id: ODD_STONE_DISCOVERY_ID,
    name: 'The Stone That Does Not Match',
    description: 'A smooth Brook stone has a pale pattern unlike any of the pebbles around it.',
    kind: 'secret',
    icon: '🪨',
    undiscoveredHint: 'One pebble near the quieter Brook bank looks strangely out of place.',
  },
  {
    id: ODD_STONE_STORYHOUSE_RUBBING_DISCOVERY_ID,
    name: 'Old Story House Stone Rubbing',
    description: 'A Story House card shows the same curling marks as Pebble’s odd Brook stone.',
    kind: 'secret',
    icon: '📜',
    undiscoveredHint: 'The Story House keeps old drawings of unusual valley patterns.',
  },
  {
    id: ODD_STONE_REFLECTION_DISCOVERY_ID,
    name: 'Matching Reflection',
    description:
      'Held beside the Reflection Pool, the odd stone’s pale curls line up with reflected crystal-light.',
    kind: 'secret',
    icon: '💧',
    undiscoveredHint: 'The stone may make more sense beside very still water.',
  },
  {
    id: JUNIPER_BUTTERFLY_COUNT_DISCOVERY_ID,
    name: 'Juniper’s Butterfly Count',
    description:
      'Juniper’s counting game reveals that the Meadow butterflies keep visiting the same flower-circle gaps.',
    icon: '🦋',
    undiscoveredHint:
      'Juniper has turned butterfly-watching into a tiny game near the flower circle.',
  },
  {
    id: MAPLE_PICNIC_SPOT_DISCOVERY_ID,
    name: 'Maple’s Perfect Picnic Spot',
    description:
      'Maple’s favourite patch of Picnic Hill is flat enough for cake and high enough to watch the Meadow change.',
    icon: '🧺',
    undiscoveredHint: 'Maple keeps testing picnic spots after the Wobbly Cake Plan.',
  },
] as const satisfies readonly DiscoveryDefinition[];

export const R6_EXISTING_VALLEY_QUESTS = [
  {
    id: WILLOW_AFTER_DARK_QUEST_ID,
    name: 'Willow and the Moonflowers After Dark',
    steps: [
      { type: 'unlock-discovery', discoveryId: MOONFLOWERS_AFTER_DARK_DISCOVERY_ID },
      { type: 'talk-to-character', characterId: 'character:willow' },
      { type: 'award-item', itemId: MOONFLOWER_NIGHT_MEMORY_ITEM_ID, quantity: 1 },
      { type: 'award-friendship', characterId: 'character:willow', amount: 8 },
      { type: 'set-world-flag', flagId: WILLOW_AFTER_DARK_COMPLETE_FLAG, value: true },
    ],
  },
  {
    id: NOVA_NO_FINISH_LINE_QUEST_ID,
    name: 'Nova, Clover and a Race With No Finish Line',
    steps: [
      { type: 'talk-to-character', characterId: 'character:nova' },
      { type: 'unlock-discovery', discoveryId: NO_FINISH_POND_TURN_DISCOVERY_ID },
      { type: 'unlock-discovery', discoveryId: NO_FINISH_PICNIC_TURN_DISCOVERY_ID },
      { type: 'unlock-discovery', discoveryId: NO_FINISH_WINDMILL_TURN_DISCOVERY_ID },
      { type: 'talk-to-character', characterId: 'character:nova' },
      { type: 'award-item', itemId: FRIENDSHIP_ROUTE_PENNANT_ITEM_ID, quantity: 1 },
      { type: 'award-friendship', characterId: 'character:nova', amount: 8 },
      { type: 'award-friendship', characterId: CLOVER_CHARACTER_ID, amount: 6 },
      { type: 'set-world-flag', flagId: NOVA_NO_FINISH_LINE_COMPLETE_FLAG, value: true },
    ],
  },
  {
    id: PEBBLE_ODD_STONE_QUEST_ID,
    name: 'Pebble and the Stone That Does Not Match',
    steps: [
      { type: 'unlock-discovery', discoveryId: ODD_STONE_DISCOVERY_ID },
      { type: 'talk-to-character', characterId: 'character:pebble' },
      { type: 'unlock-discovery', discoveryId: ODD_STONE_STORYHOUSE_RUBBING_DISCOVERY_ID },
      { type: 'unlock-discovery', discoveryId: ODD_STONE_REFLECTION_DISCOVERY_ID },
      { type: 'talk-to-character', characterId: 'character:pebble' },
      { type: 'award-item', itemId: ODD_STONE_BOOKEND_ITEM_ID, quantity: 1 },
      { type: 'award-friendship', characterId: 'character:pebble', amount: 8 },
      { type: 'set-world-flag', flagId: PEBBLE_ODD_STONE_COMPLETE_FLAG, value: true },
    ],
  },
  {
    id: JUNIPER_BUTTERFLY_COUNT_QUEST_ID,
    name: 'Juniper’s Butterfly Count',
    steps: [
      { type: 'unlock-discovery', discoveryId: JUNIPER_BUTTERFLY_COUNT_DISCOVERY_ID },
      { type: 'award-friendship', characterId: JUNIPER_CHARACTER_ID, amount: 4 },
      { type: 'set-world-flag', flagId: JUNIPER_BUTTERFLY_COUNT_COMPLETE_FLAG, value: true },
    ],
  },
  {
    id: MAPLE_PICNIC_SPOT_QUEST_ID,
    name: 'Maple’s Perfect Picnic Spot',
    steps: [
      { type: 'unlock-discovery', discoveryId: MAPLE_PICNIC_SPOT_DISCOVERY_ID },
      { type: 'award-friendship', characterId: MAPLE_CHARACTER_ID, amount: 4 },
      { type: 'set-world-flag', flagId: MAPLE_PICNIC_SPOT_COMPLETE_FLAG, value: true },
    ],
  },
] as const satisfies readonly QuestDefinition[];

export const MAPLE_PICNIC_STORY_PREREQUISITE_QUEST_ID = MAPLE_CAKE_QUEST_ID;
