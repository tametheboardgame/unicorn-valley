import type {
  CharacterDefinition,
  DiscoveryDefinition,
  ItemDefinition,
  ItemId,
  QuestDefinition,
} from './contentTypes';

export const STARLIGHT_BEACH_REGION_DISCOVERY_ID = 'discovery:starlight-beach' as const;
export const SHELL_COVE_DISCOVERY_ID = 'discovery:beach-shell-cove' as const;
export const TIDE_POOLS_DISCOVERY_ID = 'discovery:beach-tide-pools' as const;
export const STAR_DUNES_DISCOVERY_ID = 'discovery:beach-star-dunes' as const;
export const MOONLIT_POINT_DISCOVERY_ID = 'discovery:beach-moonlit-point' as const;

export const SUNRISE_SPIRAL_SHELL_DISCOVERY_ID = 'discovery:beach-shell-sunrise-spiral' as const;
export const MOON_SPECKLE_SHELL_DISCOVERY_ID = 'discovery:beach-shell-moon-speckle' as const;
export const WAVE_FAN_SHELL_DISCOVERY_ID = 'discovery:beach-shell-wave-fan' as const;

export const SHELL_STORY_CIRCLE_DISCOVERY_ID = 'discovery:beach-shell-story-circle' as const;
export const DUNE_WIND_MARKER_DISCOVERY_ID = 'discovery:beach-dune-wind-marker' as const;
export const MOONLIT_BREEZE_DISCOVERY_ID = 'discovery:beach-moonlit-breeze' as const;
export const BEACHCOMBING_BASICS_DISCOVERY_ID = 'discovery:beachcombing-basics' as const;

export const SUNRISE_SPIRAL_SHELL_ITEM_ID = 'item:starlight-shell-sunrise-spiral' as const;
export const MOON_SPECKLE_SHELL_ITEM_ID = 'item:starlight-shell-moon-speckle' as const;
export const WAVE_FAN_SHELL_ITEM_ID = 'item:starlight-shell-wave-fan' as const;
export const SHELL_STORY_CARD_ITEM_ID = 'item:starlight-shell-story-card' as const;
export const STAR_KITE_ROUTE_CARD_ITEM_ID = 'item:star-kite-route-card' as const;
export const STARLIGHT_SHELL_RIBBON_ITEM_ID = 'item:starlight-shell-ribbon' as const;

export const CORAL_CHARACTER_ID = 'character:coral' as const;
export const SKIPPER_CHARACTER_ID = 'character:skipper' as const;

export const CORAL_SHELL_STORIES_QUEST_ID = 'quest:coral-shells-with-stories' as const;
export const SKIPPER_FOLLOW_THE_WIND_QUEST_ID = 'quest:skipper-follow-the-wind' as const;

export const CORAL_SHELL_STORIES_ACTIVE_FLAG = 'flag:coral-shell-stories-active' as const;
export const CORAL_SHELL_STORIES_COMPLETE_FLAG = 'flag:coral-shell-stories-complete' as const;
export const BEACHCOMBING_READY_FLAG = 'flag:beachcombing-ready' as const;
export const SKIPPER_WIND_STORY_ACTIVE_FLAG = 'flag:skipper-wind-story-active' as const;
export const BEACH_RACE_ROUTE_READY_FLAG = 'flag:beach-race-route-ready' as const;

export const R65_STARLIGHT_BEACH_CHARACTERS = [
  {
    id: CORAL_CHARACTER_ID,
    name: 'Coral',
    role: 'Starlight Beach shell collector and beachcombing guide',
  },
  {
    id: SKIPPER_CHARACTER_ID,
    name: 'Skipper',
    role: 'Starlight Beach kite flyer and shoreline-course tinkerer',
  },
] as const satisfies readonly CharacterDefinition[];

export const R65_STARLIGHT_BEACH_ITEMS = [
  {
    id: SUNRISE_SPIRAL_SHELL_ITEM_ID,
    name: 'Sunrise Spiral Shell',
    description: 'A peach-and-gold Starlight Shell curled like a tiny sunrise.',
    category: 'collectable',
    icon: '🐚',
    discoveryId: SUNRISE_SPIRAL_SHELL_DISCOVERY_ID,
  },
  {
    id: MOON_SPECKLE_SHELL_ITEM_ID,
    name: 'Moon-speckle Shell',
    description: 'A pale shell dotted with silvery specks like a little night sky.',
    category: 'collectable',
    icon: '🌙',
    discoveryId: MOON_SPECKLE_SHELL_DISCOVERY_ID,
  },
  {
    id: WAVE_FAN_SHELL_ITEM_ID,
    name: 'Wave-fan Shell',
    description: 'A blue-green fan shell with ridges that look like tiny rolling waves.',
    category: 'collectable',
    icon: '🌊',
    discoveryId: WAVE_FAN_SHELL_DISCOVERY_ID,
  },
  {
    id: SHELL_STORY_CARD_ITEM_ID,
    name: 'Shell Story Card',
    description:
      'Coral drew the three Starlight Shells together so their tiny stories are easy to remember.',
    category: 'reward',
    icon: '💌',
  },
  {
    id: STAR_KITE_ROUTE_CARD_ITEM_ID,
    name: 'Star Kite Route Card',
    description:
      'Skipper marked the wind clues that trace a playful route from the dunes to Moonlit Point.',
    category: 'reward',
    icon: '🪁',
  },
  {
    id: STARLIGHT_SHELL_RIBBON_ITEM_ID,
    name: 'Starlight Shell Ribbon',
    description:
      'A sea-blue ribbon with a tiny pearly shell, inspired by Coral’s favourite beach treasures.',
    category: 'accessory',
    icon: '🎀',
  },
] as const satisfies readonly ItemDefinition[];

export const R65_STARLIGHT_BEACH_DISCOVERIES = [
  {
    id: STARLIGHT_BEACH_REGION_DISCOVERY_ID,
    name: 'Starlight Beach',
    description:
      'A wide sandy shore of shell coves, bright tide pools, warm dunes and a quiet moonlit point.',
    icon: '🏖️',
  },
  {
    id: SHELL_COVE_DISCOVERY_ID,
    name: 'Shell Cove',
    description: 'A calm curve of sand where little shells gather between smooth pink rocks.',
    icon: '🐚',
  },
  {
    id: TIDE_POOLS_DISCOVERY_ID,
    name: 'Starlight Tide Pools',
    description: 'Clear shallow pools where tiny sparkles and curious sea-creatures hide.',
    icon: '🫧',
  },
  {
    id: STAR_DUNES_DISCOVERY_ID,
    name: 'Star Dunes',
    description: 'Warm rolling dunes marked by Skipper’s bright flags and dancing beach grass.',
    icon: '⛱️',
  },
  {
    id: MOONLIT_POINT_DISCOVERY_ID,
    name: 'Moonlit Point',
    description: 'A sheltered viewpoint where the sea catches the sky and turns it into sparkles.',
    icon: '🌙',
  },
  {
    id: SUNRISE_SPIRAL_SHELL_DISCOVERY_ID,
    name: 'Sunrise Spiral Shell',
    description: 'The first of the finite Starlight Shell collection, glowing peach and gold.',
    icon: '🐚',
    undiscoveredHint: 'Coral says one unusual shell likes the quietest curve of Shell Cove.',
  },
  {
    id: MOON_SPECKLE_SHELL_DISCOVERY_ID,
    name: 'Moon-speckle Shell',
    description: 'A silvery Starlight Shell found where the tide leaves tiny mirror-pools.',
    icon: '🌙',
    undiscoveredHint: 'Look carefully beside a tide pool where the water reflects the sky.',
  },
  {
    id: WAVE_FAN_SHELL_DISCOVERY_ID,
    name: 'Wave-fan Shell',
    description: 'A blue-green Starlight Shell tucked near the rocks below Moonlit Point.',
    icon: '🌊',
    undiscoveredHint: 'A sheltered rocky pocket may hide a shell shaped like a tiny fan.',
  },
  {
    id: SHELL_STORY_CIRCLE_DISCOVERY_ID,
    name: 'Shell Story Circle',
    description:
      'Coral showed how three very different shells can make one tiny story when arranged together.',
    icon: '✨',
    undiscoveredHint: 'Coral has an idea for the three unusual Starlight Shells.',
  },
  {
    id: DUNE_WIND_MARKER_DISCOVERY_ID,
    name: 'Whistling Dune Marker',
    description:
      'One of Skipper’s dune markers whistles softly when the sea breeze points towards the shore.',
    kind: 'secret',
    icon: '🪁',
    undiscoveredHint:
      'Skipper says one striped marker in Star Dunes behaves differently from the others.',
  },
  {
    id: MOONLIT_BREEZE_DISCOVERY_ID,
    name: 'Moonlit Cross-breeze',
    description:
      'Two breezes meet at Moonlit Point, making the grass and shell chimes flutter in opposite directions.',
    kind: 'secret',
    icon: '🌬️',
    undiscoveredHint: 'Follow the wind from Star Dunes towards the quietest end of the beach.',
  },
  {
    id: BEACHCOMBING_BASICS_DISCOVERY_ID,
    name: 'Beachcombing Basics',
    description:
      'Coral’s rule is simple: look slowly, leave living things alone and notice what the tide has changed.',
    icon: '🔎',
    undiscoveredHint: 'Coral keeps a little beachcombing basket near Shell Cove.',
  },
] as const satisfies readonly DiscoveryDefinition[];

export const R65_STARLIGHT_BEACH_QUESTS = [
  {
    id: CORAL_SHELL_STORIES_QUEST_ID,
    name: 'Coral and the Shells With Stories',
    steps: [
      { type: 'talk-to-character', characterId: CORAL_CHARACTER_ID },
      { type: 'set-world-flag', flagId: CORAL_SHELL_STORIES_ACTIVE_FLAG, value: true },
      { type: 'unlock-discovery', discoveryId: SHELL_STORY_CIRCLE_DISCOVERY_ID },
      { type: 'talk-to-character', characterId: CORAL_CHARACTER_ID },
      { type: 'set-world-flag', flagId: CORAL_SHELL_STORIES_ACTIVE_FLAG, value: false },
      { type: 'set-world-flag', flagId: CORAL_SHELL_STORIES_COMPLETE_FLAG, value: true },
      { type: 'set-world-flag', flagId: BEACHCOMBING_READY_FLAG, value: true },
      { type: 'award-item', itemId: SHELL_STORY_CARD_ITEM_ID, quantity: 1 },
      { type: 'award-friendship', characterId: CORAL_CHARACTER_ID, amount: 12 },
    ],
  },
  {
    id: SKIPPER_FOLLOW_THE_WIND_QUEST_ID,
    name: 'Skipper and Follow the Wind',
    steps: [
      { type: 'talk-to-character', characterId: SKIPPER_CHARACTER_ID },
      { type: 'set-world-flag', flagId: SKIPPER_WIND_STORY_ACTIVE_FLAG, value: true },
      { type: 'unlock-discovery', discoveryId: DUNE_WIND_MARKER_DISCOVERY_ID },
      { type: 'unlock-discovery', discoveryId: MOONLIT_BREEZE_DISCOVERY_ID },
      { type: 'talk-to-character', characterId: SKIPPER_CHARACTER_ID },
      { type: 'set-world-flag', flagId: SKIPPER_WIND_STORY_ACTIVE_FLAG, value: false },
      { type: 'set-world-flag', flagId: BEACH_RACE_ROUTE_READY_FLAG, value: true },
      { type: 'award-item', itemId: STAR_KITE_ROUTE_CARD_ITEM_ID, quantity: 1 },
      { type: 'award-friendship', characterId: SKIPPER_CHARACTER_ID, amount: 12 },
    ],
  },
] as const satisfies readonly QuestDefinition[];

export interface StarlightBeachShopStockEntry {
  itemId: ItemId;
  price: number;
}

export const R65_STARLIGHT_BEACH_SHOP_STOCK = [
  { itemId: STARLIGHT_SHELL_RIBBON_ITEM_ID, price: 4 },
] as const satisfies readonly StarlightBeachShopStockEntry[];
