import type { DiscoveryDefinition, ItemDefinition } from './contentTypes';

export const STARLIGHT_BEACH_REGION_DISCOVERY_ID = 'discovery:starlight-beach' as const;
export const SHELL_COVE_DISCOVERY_ID = 'discovery:beach-shell-cove' as const;
export const TIDE_POOLS_DISCOVERY_ID = 'discovery:beach-tide-pools' as const;
export const STAR_DUNES_DISCOVERY_ID = 'discovery:beach-star-dunes' as const;
export const MOONLIT_POINT_DISCOVERY_ID = 'discovery:beach-moonlit-point' as const;

export const SUNRISE_SPIRAL_SHELL_DISCOVERY_ID = 'discovery:beach-shell-sunrise-spiral' as const;
export const MOON_SPECKLE_SHELL_DISCOVERY_ID = 'discovery:beach-shell-moon-speckle' as const;
export const WAVE_FAN_SHELL_DISCOVERY_ID = 'discovery:beach-shell-wave-fan' as const;

export const SUNRISE_SPIRAL_SHELL_ITEM_ID = 'item:starlight-shell-sunrise-spiral' as const;
export const MOON_SPECKLE_SHELL_ITEM_ID = 'item:starlight-shell-moon-speckle' as const;
export const WAVE_FAN_SHELL_ITEM_ID = 'item:starlight-shell-wave-fan' as const;

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
] as const satisfies readonly DiscoveryDefinition[];
