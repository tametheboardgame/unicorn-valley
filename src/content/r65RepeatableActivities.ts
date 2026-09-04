import type { DiscoveryDefinition, DiscoveryId } from './contentTypes';

export const MAPLE_BAKING_ACTIVITY_ID = 'minigame:maple-baking-table' as const;
export const CORAL_BEACHCOMBING_ACTIVITY_ID = 'minigame:coral-beachcombing' as const;

export const MAPLE_BAKING_FIRST_COMPLETION_MEMORY =
  'memory:r65-wp14-maple-baking-first-completion' as const;
export const CORAL_BEACHCOMBING_FIRST_COMPLETION_MEMORY =
  'memory:r65-wp14-coral-beachcombing-first-completion' as const;

export const SUNSHINE_SPRINKLE_CAKE_DISCOVERY_ID =
  'discovery:sunshine-sprinkle-cake' as const;
export const MOONFLOWER_BERRY_CAKE_DISCOVERY_ID =
  'discovery:moonflower-berry-cake' as const;
export const RAINBOW_CLOUD_CAKE_DISCOVERY_ID = 'discovery:rainbow-cloud-cake' as const;

export const CRAB_TRACK_NOTEBOOK_DISCOVERY_ID = 'discovery:crab-track-notebook-page' as const;
export const TIDEPOOL_STAR_NOTEBOOK_DISCOVERY_ID =
  'discovery:tidepool-star-notebook-page' as const;
export const MOON_SHELL_NOTEBOOK_DISCOVERY_ID = 'discovery:moon-shell-notebook-page' as const;

export type BakeryCakeTheme = 'sunshine' | 'moonflower' | 'rainbow';
export type BakeryTopping = 'berries' | 'clouds' | 'stars';
export type BakeryFinish = 'sprinkles' | 'swirl' | 'ribbon';
export type BeachcombingTrail = 'crab-tracks' | 'tidepool-star' | 'moon-shell';

export interface BakeryOutcomeDefinition {
  theme: BakeryCakeTheme;
  name: string;
  icon: string;
  discoveryId: DiscoveryId;
}

export interface BeachcombingOutcomeDefinition {
  trail: BeachcombingTrail;
  name: string;
  icon: string;
  discoveryId: DiscoveryId;
}

export const BAKERY_OUTCOMES: readonly BakeryOutcomeDefinition[] = [
  {
    theme: 'sunshine',
    name: 'Sunshine Sprinkle Cake',
    icon: '☀️',
    discoveryId: SUNSHINE_SPRINKLE_CAKE_DISCOVERY_ID,
  },
  {
    theme: 'moonflower',
    name: 'Moonflower Berry Cake',
    icon: '🌙',
    discoveryId: MOONFLOWER_BERRY_CAKE_DISCOVERY_ID,
  },
  {
    theme: 'rainbow',
    name: 'Rainbow Cloud Cake',
    icon: '🌈',
    discoveryId: RAINBOW_CLOUD_CAKE_DISCOVERY_ID,
  },
];

export const BEACHCOMBING_OUTCOMES: readonly BeachcombingOutcomeDefinition[] = [
  {
    trail: 'crab-tracks',
    name: 'Crab-track Notebook Page',
    icon: '🦀',
    discoveryId: CRAB_TRACK_NOTEBOOK_DISCOVERY_ID,
  },
  {
    trail: 'tidepool-star',
    name: 'Tidepool-star Notebook Page',
    icon: '⭐',
    discoveryId: TIDEPOOL_STAR_NOTEBOOK_DISCOVERY_ID,
  },
  {
    trail: 'moon-shell',
    name: 'Moon-shell Notebook Page',
    icon: '🐚',
    discoveryId: MOON_SHELL_NOTEBOOK_DISCOVERY_ID,
  },
];

export const R65_REPEATABLE_ACTIVITY_DISCOVERIES = [
  {
    id: SUNSHINE_SPRINKLE_CAKE_DISCOVERY_ID,
    name: 'Sunshine Sprinkle Cake',
    description:
      'A bright Wobbly Cake design from Maple’s baking table, finished with cheerful Sunbeam colours and an entirely sensible number of sprinkles.',
    icon: '☀️',
    undiscoveredHint: 'Maple’s repeatable baking table can make a sunny cake design.',
  },
  {
    id: MOONFLOWER_BERRY_CAKE_DISCOVERY_ID,
    name: 'Moonflower Berry Cake',
    description:
      'A soft blue-purple Wobbly Cake design with berry details that reminds Maple of Moonflower Glade after sunset.',
    icon: '🌙',
    undiscoveredHint: 'Try a Moonflower-style design at Maple’s baking table.',
  },
  {
    id: RAINBOW_CLOUD_CAKE_DISCOVERY_ID,
    name: 'Rainbow Cloud Cake',
    description:
      'A colourful Wobbly Cake design piled with cloud-soft decorations and enough colour to make the Bakery counter look like a tiny Rainbow Run.',
    icon: '🌈',
    undiscoveredHint: 'Maple still has a very colourful cake idea to try.',
  },
  {
    id: CRAB_TRACK_NOTEBOOK_DISCOVERY_ID,
    name: 'Crab-track Notebook Page',
    description:
      'A careful sketch of tiny crab tracks crossing damp sand. Coral’s rule is simple: watch, wonder, and leave the crab exactly where it lives.',
    icon: '🦀',
    undiscoveredHint: 'Coral’s beachcombing basket can lead to a trail of tiny tracks.',
  },
  {
    id: TIDEPOOL_STAR_NOTEBOOK_DISCOVERY_ID,
    name: 'Tidepool-star Notebook Page',
    description:
      'A tide-pool observation page showing a star-shaped pattern beneath clear water, recorded without disturbing the pool.',
    icon: '⭐',
    undiscoveredHint: 'A careful tide-pool look may reveal a star-shaped surprise.',
  },
  {
    id: MOON_SHELL_NOTEBOOK_DISCOVERY_ID,
    name: 'Moon-shell Notebook Page',
    description:
      'A page of pearly shell shapes reflecting Moonlit Point. Empty shells can be admired; living creatures always stay safely at home.',
    icon: '🐚',
    undiscoveredHint: 'A later beachcombing walk may notice a moonlit shell pattern.',
  },
] as const satisfies readonly DiscoveryDefinition[];
