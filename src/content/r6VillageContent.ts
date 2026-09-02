import type {
  CharacterDefinition,
  DiscoveryDefinition,
  ItemDefinition,
  ItemId,
  QuestDefinition,
} from './contentTypes';

export const TANSY_CHARACTER_ID = 'character:tansy' as const;
export const MAPLE_CHARACTER_ID = 'character:maple' as const;

export const TANSY_MAP_QUEST_ID = 'quest:tansy-lost-map-corners' as const;
export const MAPLE_CAKE_QUEST_ID = 'quest:maple-wobbly-cake-plan' as const;

export const TANSY_MAP_HUNT_ACTIVE_FLAG = 'flag:tansy-map-hunt-active' as const;
export const TANSY_MAP_RESTORED_FLAG = 'flag:tansy-map-restored' as const;
export const MAPLE_CAKE_READY_FLAG = 'flag:maple-cake-ready' as const;
export const MAPLE_CAKE_SUNSHINE_FLAG = 'flag:maple-cake-theme-sunshine' as const;
export const MAPLE_CAKE_MOONFLOWER_FLAG = 'flag:maple-cake-theme-moonflower' as const;
export const MAPLE_CAKE_RAINBOW_FLAG = 'flag:maple-cake-theme-rainbow' as const;

export const TANSY_NOTICE_MAP_CORNER_DISCOVERY_ID =
  'discovery:tansy-map-corner-notice-board' as const;
export const TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID =
  'discovery:tansy-map-corner-bakery-shelf' as const;
export const TANSY_SUNDIAL_MAP_CORNER_DISCOVERY_ID = 'discovery:tansy-map-corner-sundial' as const;

export const SUNBEAM_PICNIC_BASKET_ITEM_ID = 'item:sunbeam-picnic-basket' as const;
export const WOBBLY_CAKE_ITEM_ID = 'item:wobbly-cake' as const;

export type MapleCakeTheme = 'sunshine' | 'moonflower' | 'rainbow';

export const MAPLE_CAKE_THEME_FLAGS = {
  sunshine: MAPLE_CAKE_SUNSHINE_FLAG,
  moonflower: MAPLE_CAKE_MOONFLOWER_FLAG,
  rainbow: MAPLE_CAKE_RAINBOW_FLAG,
} as const satisfies Record<MapleCakeTheme, `flag:${string}`>;

export const R6_VILLAGE_CHARACTERS = [
  {
    id: TANSY_CHARACTER_ID,
    name: 'Tansy',
    role: 'Story House helper, map enthusiast and collector of misplaced bookmarks',
  },
  {
    id: MAPLE_CHARACTER_ID,
    name: 'Maple',
    role: 'Sunbeam Bakery helper and enthusiastic picnic planner',
  },
] as const satisfies readonly CharacterDefinition[];

export const R6_VILLAGE_ITEMS = [
  {
    id: SUNBEAM_PICNIC_BASKET_ITEM_ID,
    name: 'Sunbeam Picnic Basket',
    description: 'A sunny little basket for making the cottage feel ready for an adventure picnic.',
    category: 'decoration',
    icon: '🧺',
  },
  {
    id: WOBBLY_CAKE_ITEM_ID,
    name: 'Wobbly Celebration Cake',
    description: 'A cheerfully imperfect cake decorated with Maple at Sunbeam Bakery.',
    category: 'quest',
    icon: '🎂',
    questCritical: true,
  },
] as const satisfies readonly ItemDefinition[];

export const R6_VILLAGE_DISCOVERIES = [
  {
    id: TANSY_NOTICE_MAP_CORNER_DISCOVERY_ID,
    name: 'Notice-board Map Corner',
    description: 'A tiny corner of Tansy’s map was tucked behind an old Village notice.',
    kind: 'secret',
    icon: '🗺️',
    undiscoveredHint: 'One map corner may be hiding where the Village posts its little notices.',
  },
  {
    id: TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID,
    name: 'Bakery Map Corner',
    description:
      'A flour-dusted map corner had somehow become a bookmark on the Bakery recipe shelf.',
    kind: 'secret',
    icon: '📜',
    undiscoveredHint: 'Maple remembers seeing a very papery-looking recipe marker in the Bakery.',
  },
  {
    id: TANSY_SUNDIAL_MAP_CORNER_DISCOVERY_ID,
    name: 'Sundial Map Corner',
    description: 'The final map corner was wedged safely beneath the little Village sundial.',
    kind: 'secret',
    icon: '☀️',
    undiscoveredHint: 'Tansy thinks one corner blew somewhere sunny in the Village square.',
  },
] as const satisfies readonly DiscoveryDefinition[];

export const R6_VILLAGE_QUESTS = [
  {
    id: TANSY_MAP_QUEST_ID,
    name: 'Tansy and the Lost Map Corners',
    steps: [
      { type: 'talk-to-character', characterId: TANSY_CHARACTER_ID },
      { type: 'set-world-flag', flagId: TANSY_MAP_HUNT_ACTIVE_FLAG, value: true },
      { type: 'unlock-discovery', discoveryId: TANSY_NOTICE_MAP_CORNER_DISCOVERY_ID },
      { type: 'unlock-discovery', discoveryId: TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID },
      { type: 'unlock-discovery', discoveryId: TANSY_SUNDIAL_MAP_CORNER_DISCOVERY_ID },
      { type: 'talk-to-character', characterId: TANSY_CHARACTER_ID },
      { type: 'set-world-flag', flagId: TANSY_MAP_HUNT_ACTIVE_FLAG, value: false },
      { type: 'set-world-flag', flagId: TANSY_MAP_RESTORED_FLAG, value: true },
      { type: 'award-friendship', characterId: TANSY_CHARACTER_ID, amount: 12 },
    ],
  },
  {
    id: MAPLE_CAKE_QUEST_ID,
    name: 'Maple and the Wobbly Cake Plan',
    steps: [
      { type: 'talk-to-character', characterId: MAPLE_CHARACTER_ID },
      { type: 'collect-item', itemId: WOBBLY_CAKE_ITEM_ID, quantity: 1 },
      { type: 'consume-item', itemId: WOBBLY_CAKE_ITEM_ID, quantity: 1 },
      { type: 'set-world-flag', flagId: MAPLE_CAKE_READY_FLAG, value: true },
      { type: 'talk-to-character', characterId: MAPLE_CHARACTER_ID },
      { type: 'award-friendship', characterId: MAPLE_CHARACTER_ID, amount: 12 },
    ],
  },
] as const satisfies readonly QuestDefinition[];

export interface BakeryStockEntry {
  itemId: ItemId;
  price: number;
  unique: boolean;
  unlockAfterQuestId?: `quest:${string}`;
  unlockHint?: string;
}

export const R6_BAKERY_STOCK = [
  {
    itemId: 'item:berry-bun',
    price: 1,
    unique: false,
  },
  {
    itemId: SUNBEAM_PICNIC_BASKET_ITEM_ID,
    price: 4,
    unique: true,
    unlockAfterQuestId: MAPLE_CAKE_QUEST_ID,
    unlockHint: 'Help Maple with the Wobbly Cake Plan to unlock the picnic basket.',
  },
] as const satisfies readonly BakeryStockEntry[];
