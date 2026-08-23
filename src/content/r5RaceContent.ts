import type { DiscoveryDefinition, ItemDefinition } from './contentTypes';

export const CRYSTAL_CASCADE_FINISHER_RIBBON_ITEM_ID =
  'item:crystal-cascade-finisher-ribbon' as const;
export const CRYSTAL_CASCADE_PODIUM_ROSETTE_ITEM_ID =
  'item:crystal-cascade-podium-rosette' as const;
export const CRYSTAL_CASCADE_RIBBONS_DISCOVERY_ID = 'discovery:crystal-cascade-ribbons' as const;

export const R5_RACE_ITEMS = [
  {
    id: CRYSTAL_CASCADE_FINISHER_RIBBON_ITEM_ID,
    name: 'Crystal Cascade Finisher Ribbon',
    description:
      'A watery-blue ribbon for finishing Crystal Cascade. It can decorate your cottage.',
    category: 'decoration',
    icon: '🎀',
    discoveryId: CRYSTAL_CASCADE_RIBBONS_DISCOVERY_ID,
  },
  {
    id: CRYSTAL_CASCADE_PODIUM_ROSETTE_ITEM_ID,
    name: 'Crystal Cascade Podium Rosette',
    description: 'A crystal-bright rosette for reaching the Crystal Cascade podium.',
    category: 'decoration',
    icon: '💠',
    discoveryId: CRYSTAL_CASCADE_RIBBONS_DISCOVERY_ID,
  },
] as const satisfies readonly ItemDefinition[];

export const R5_RACE_DISCOVERIES = [
  {
    id: CRYSTAL_CASCADE_RIBBONS_DISCOVERY_ID,
    name: 'Crystal Cascade Ribbons',
    description:
      'Cool blue race ribbons from Crystal Brook, sparkling like water when they catch the light.',
    kind: 'secret',
    icon: '🎀',
    undiscoveredHint: 'A second race course has its own set of ribbons to earn.',
  },
] as const satisfies readonly DiscoveryDefinition[];
