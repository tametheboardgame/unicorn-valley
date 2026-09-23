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
export const CLOUD_BISCUIT_ITEM_ID = 'item:cloud-biscuit' as const;
export const SUNBEAM_SWIRL_ITEM_ID = 'item:sunbeam-swirl' as const;
export const WOBBLY_CAKE_SLICE_ITEM_ID = 'item:wobbly-cake-slice' as const;
export const WOBBLY_CAKE_ITEM_ID = 'item:wobbly-cake' as const;
export const HONEY_OAT_LOAF_ITEM_ID = 'item:honey-oat-loaf' as const;
export const MOONRISE_BAGUETTE_ITEM_ID = 'item:moonrise-baguette' as const;
export const STARSEED_ROLLS_ITEM_ID = 'item:starseed-rolls' as const;
export const STRAWBERRY_STAR_DOUGHNUT_ITEM_ID = 'item:strawberry-star-doughnut' as const;
export const MOON_SUGAR_RING_ITEM_ID = 'item:moon-sugar-ring' as const;
export const RAINBOW_GLAZE_DOUGHNUT_ITEM_ID = 'item:rainbow-glaze-doughnut' as const;
export const BERRY_CLOUD_CUPCAKE_ITEM_ID = 'item:berry-cloud-cupcake' as const;
export const LEMON_SPARKLE_CUPCAKE_ITEM_ID = 'item:lemon-sparkle-cupcake' as const;
export const MOONFLOWER_CUPCAKE_ITEM_ID = 'item:moonflower-cupcake' as const;

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
    id: HONEY_OAT_LOAF_ITEM_ID,
    name: 'Honey Oat Loaf',
    description: 'A soft golden loaf brushed with honey and scattered with toasted oats.',
    category: 'food',
    icon: '🍞',
  },
  {
    id: MOONRISE_BAGUETTE_ITEM_ID,
    name: 'Moonrise Baguette',
    description: 'A crisp little baguette with a pale flour crescent across the crust.',
    category: 'food',
    icon: '🥖',
  },
  {
    id: STARSEED_ROLLS_ITEM_ID,
    name: 'Starseed Rolls',
    description: 'A cluster of fluffy rolls dotted with tiny toasted seeds.',
    category: 'food',
    icon: '🥯',
  },
  {
    id: STRAWBERRY_STAR_DOUGHNUT_ITEM_ID,
    name: 'Strawberry Star Doughnut',
    description: 'A strawberry-glazed ring finished with tiny sugar stars.',
    category: 'food',
    icon: '🍩',
  },
  {
    id: MOON_SUGAR_RING_ITEM_ID,
    name: 'Moon Sugar Ring',
    description: 'A pale vanilla doughnut dusted with sparkling moon sugar.',
    category: 'food',
    icon: '🍩',
  },
  {
    id: RAINBOW_GLAZE_DOUGHNUT_ITEM_ID,
    name: 'Rainbow Glaze Doughnut',
    description: 'A bright glazed doughnut with a different colour in every bite.',
    category: 'food',
    icon: '🍩',
  },
  {
    id: BERRY_CLOUD_CUPCAKE_ITEM_ID,
    name: 'Berry Cloud Cupcake',
    description: 'Berry sponge under a soft swirl of cloud-like icing.',
    category: 'food',
    icon: '🧁',
  },
  {
    id: LEMON_SPARKLE_CUPCAKE_ITEM_ID,
    name: 'Lemon Sparkle Cupcake',
    description: 'A sunny lemon cupcake topped with tiny golden sugar sparks.',
    category: 'food',
    icon: '🧁',
  },
  {
    id: MOONFLOWER_CUPCAKE_ITEM_ID,
    name: 'Moonflower Cupcake',
    description: 'A lavender-iced cupcake with a delicate moonflower sugar petal.',
    category: 'food',
    icon: '🧁',
  },
  {
    id: CLOUD_BISCUIT_ITEM_ID,
    name: 'Cloud Biscuit',
    description: 'A soft vanilla biscuit dusted with enough sugar to look like a tiny cloud.',
    category: 'food',
    icon: '🍪',
  },
  {
    id: SUNBEAM_SWIRL_ITEM_ID,
    name: 'Sunbeam Swirl',
    description: 'A warm golden pastry twisted into a sunny spiral.',
    category: 'food',
    icon: '☀️',
  },
  {
    id: WOBBLY_CAKE_SLICE_ITEM_ID,
    name: 'Wobbly Cake Slice',
    description: 'A deliberately wonky celebration slice inspired by Maple’s famous cake plan.',
    category: 'food',
    icon: '🍰',
  },
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
    description: 'A cheerfully imperfect cake designed with Maple and baked at Sunbeam Bakery.',
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

export type BakerySectionId = 'pastries' | 'bread' | 'doughnuts' | 'cupcakes';

export interface BakeryTemporaryEffectDefinition {
  abilityId: `ability:${string}`;
  durationMs: number;
  description: string;
}

export const BAKERY_SECTIONS = [
  { id: 'pastries', label: 'Pastries', icon: '🥐' },
  { id: 'bread', label: 'Bread', icon: '🍞' },
  { id: 'doughnuts', label: 'Doughnuts', icon: '🍩' },
  { id: 'cupcakes', label: 'Cupcakes', icon: '🧁' },
] as const satisfies readonly {
  id: BakerySectionId;
  label: string;
  icon: string;
}[];

export interface BakeryStockEntry {
  itemId: ItemId;
  price: number;
  unique: boolean;
  section: BakerySectionId;
  maxDailyStock: number;
  temporaryEffect: BakeryTemporaryEffectDefinition | null;
  unlockAfterQuestId?: `quest:${string}`;
  unlockHint?: string;
}

export const R6_BAKERY_STOCK = [
  {
    itemId: 'item:berry-bun',
    price: 1,
    unique: false,
    section: 'pastries',
    maxDailyStock: 5,
    temporaryEffect: null,
  },
  {
    itemId: CLOUD_BISCUIT_ITEM_ID,
    price: 2,
    unique: false,
    section: 'pastries',
    maxDailyStock: 4,
    temporaryEffect: null,
  },
  {
    itemId: SUNBEAM_SWIRL_ITEM_ID,
    price: 2,
    unique: false,
    section: 'pastries',
    maxDailyStock: 4,
    temporaryEffect: null,
  },
  {
    itemId: SUNBEAM_PICNIC_BASKET_ITEM_ID,
    price: 4,
    unique: true,
    section: 'pastries',
    maxDailyStock: 1,
    temporaryEffect: null,
    unlockAfterQuestId: MAPLE_CAKE_QUEST_ID,
    unlockHint: 'Help Maple with the Wobbly Cake Plan to unlock the picnic basket.',
  },
  {
    itemId: WOBBLY_CAKE_SLICE_ITEM_ID,
    price: 3,
    unique: false,
    section: 'pastries',
    maxDailyStock: 2,
    temporaryEffect: null,
    unlockAfterQuestId: MAPLE_CAKE_QUEST_ID,
    unlockHint: 'Finish Maple’s Wobbly Cake Plan to put celebration slices on the counter.',
  },
  {
    itemId: HONEY_OAT_LOAF_ITEM_ID,
    price: 2,
    unique: false,
    section: 'bread',
    maxDailyStock: 4,
    temporaryEffect: null,
  },
  {
    itemId: MOONRISE_BAGUETTE_ITEM_ID,
    price: 2,
    unique: false,
    section: 'bread',
    maxDailyStock: 3,
    temporaryEffect: null,
  },
  {
    itemId: STARSEED_ROLLS_ITEM_ID,
    price: 2,
    unique: false,
    section: 'bread',
    maxDailyStock: 4,
    temporaryEffect: null,
  },
  {
    itemId: STRAWBERRY_STAR_DOUGHNUT_ITEM_ID,
    price: 2,
    unique: false,
    section: 'doughnuts',
    maxDailyStock: 3,
    temporaryEffect: null,
  },
  {
    itemId: MOON_SUGAR_RING_ITEM_ID,
    price: 2,
    unique: false,
    section: 'doughnuts',
    maxDailyStock: 3,
    temporaryEffect: null,
  },
  {
    itemId: RAINBOW_GLAZE_DOUGHNUT_ITEM_ID,
    price: 3,
    unique: false,
    section: 'doughnuts',
    maxDailyStock: 2,
    temporaryEffect: null,
  },
  {
    itemId: BERRY_CLOUD_CUPCAKE_ITEM_ID,
    price: 2,
    unique: false,
    section: 'cupcakes',
    maxDailyStock: 3,
    temporaryEffect: null,
  },
  {
    itemId: LEMON_SPARKLE_CUPCAKE_ITEM_ID,
    price: 2,
    unique: false,
    section: 'cupcakes',
    maxDailyStock: 3,
    temporaryEffect: null,
  },
  {
    itemId: MOONFLOWER_CUPCAKE_ITEM_ID,
    price: 3,
    unique: false,
    section: 'cupcakes',
    maxDailyStock: 2,
    temporaryEffect: null,
  },
] as const satisfies readonly BakeryStockEntry[];
