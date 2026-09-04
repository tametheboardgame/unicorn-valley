import type { DiscoveryDefinition, ItemDefinition } from './contentTypes';

export const PETAL_PARADE_RACE_ID = 'race-course:rainbow-meadow-petal-parade' as const;
export const MOONCAP_TRAIL_RACE_ID = 'race-course:whispering-woods-mooncap-trail' as const;
export const SHORELINE_SURGE_RACE_ID = 'race-course:starlight-beach-shoreline-surge' as const;

export const PETAL_PARADE_FINISHER_RIBBON_ITEM_ID = 'item:petal-parade-finisher-ribbon' as const;
export const PETAL_PARADE_PODIUM_ROSETTE_ITEM_ID = 'item:petal-parade-podium-rosette' as const;
export const MOONCAP_TRAIL_FINISHER_RIBBON_ITEM_ID = 'item:mooncap-trail-finisher-ribbon' as const;
export const MOONCAP_TRAIL_PODIUM_ROSETTE_ITEM_ID = 'item:mooncap-trail-podium-rosette' as const;
export const SHORELINE_SURGE_FINISHER_RIBBON_ITEM_ID =
  'item:shoreline-surge-finisher-ribbon' as const;
export const SHORELINE_SURGE_PODIUM_ROSETTE_ITEM_ID =
  'item:shoreline-surge-podium-rosette' as const;
export const RAINBOW_CUP_PENNANT_ITEM_ID = 'item:rainbow-cup-pennant' as const;

export const PETAL_PARADE_RIBBONS_DISCOVERY_ID = 'discovery:petal-parade-ribbons' as const;
export const MOONCAP_TRAIL_RIBBONS_DISCOVERY_ID = 'discovery:mooncap-trail-ribbons' as const;
export const SHORELINE_SURGE_RIBBONS_DISCOVERY_ID = 'discovery:shoreline-surge-ribbons' as const;
export const RAINBOW_CUP_DISCOVERY_ID = 'discovery:rainbow-cup-complete' as const;
export const RAINBOW_CUP_COMPLETE_FLAG = 'flag:rainbow-cup-complete' as const;

export const R65_RACE_EXPANSION_ITEMS = [
  {
    id: PETAL_PARADE_FINISHER_RIBBON_ITEM_ID,
    name: 'Petal Parade Finisher Ribbon',
    description: 'A flower-bright ribbon for finishing Petal Parade. It can decorate your cottage.',
    category: 'decoration',
    icon: '🌸',
    discoveryId: PETAL_PARADE_RIBBONS_DISCOVERY_ID,
  },
  {
    id: PETAL_PARADE_PODIUM_ROSETTE_ITEM_ID,
    name: 'Petal Parade Podium Rosette',
    description: 'A sunny flower rosette for reaching the Petal Parade podium.',
    category: 'decoration',
    icon: '🏵️',
    discoveryId: PETAL_PARADE_RIBBONS_DISCOVERY_ID,
  },
  {
    id: MOONCAP_TRAIL_FINISHER_RIBBON_ITEM_ID,
    name: 'Mooncap Trail Finisher Ribbon',
    description: 'A moonlit woodland ribbon for finishing Mooncap Trail.',
    category: 'decoration',
    icon: '🍄',
    discoveryId: MOONCAP_TRAIL_RIBBONS_DISCOVERY_ID,
  },
  {
    id: MOONCAP_TRAIL_PODIUM_ROSETTE_ITEM_ID,
    name: 'Mooncap Trail Podium Rosette',
    description: 'A silver-green rosette for reaching the Mooncap Trail podium.',
    category: 'decoration',
    icon: '🌿',
    discoveryId: MOONCAP_TRAIL_RIBBONS_DISCOVERY_ID,
  },
  {
    id: SHORELINE_SURGE_FINISHER_RIBBON_ITEM_ID,
    name: 'Shoreline Surge Finisher Ribbon',
    description: 'A sea-blue ribbon for finishing Skipper’s Starlight Beach course.',
    category: 'decoration',
    icon: '🐚',
    discoveryId: SHORELINE_SURGE_RIBBONS_DISCOVERY_ID,
  },
  {
    id: SHORELINE_SURGE_PODIUM_ROSETTE_ITEM_ID,
    name: 'Shoreline Surge Podium Rosette',
    description: 'A pearly rosette for reaching the Shoreline Surge podium.',
    category: 'decoration',
    icon: '🌊',
    discoveryId: SHORELINE_SURGE_RIBBONS_DISCOVERY_ID,
  },
  {
    id: RAINBOW_CUP_PENNANT_ITEM_ID,
    name: 'Rainbow Cup Pennant',
    description:
      'A five-colour pennant celebrating a finish on every regular valley course. It is about joining in, not winning every race.',
    category: 'decoration',
    icon: '🏆',
    discoveryId: RAINBOW_CUP_DISCOVERY_ID,
  },
] as const satisfies readonly ItemDefinition[];

export const R65_RACE_EXPANSION_DISCOVERIES = [
  {
    id: PETAL_PARADE_RIBBONS_DISCOVERY_ID,
    name: 'Petal Parade Ribbons',
    description: 'Flower-bright race ribbons earned on the Meadow’s playful petal course.',
    icon: '🌸',
    undiscoveredHint: 'The Rainbow Cup board has a new flower-marked course space.',
  },
  {
    id: MOONCAP_TRAIL_RIBBONS_DISCOVERY_ID,
    name: 'Mooncap Trail Ribbons',
    description:
      'Silver-green race ribbons from a winding run beneath the Whispering Woods canopy.',
    icon: '🍄',
    undiscoveredHint: 'A woodland race route appears after you have explored Whispering Woods.',
  },
  {
    id: SHORELINE_SURGE_RIBBONS_DISCOVERY_ID,
    name: 'Shoreline Surge Ribbons',
    description: 'Sea-blue race ribbons from Skipper’s dunes-to-Moonlit-Point shoreline course.',
    icon: '🐚',
    undiscoveredHint: 'Help Skipper finish the Starlight Beach route before looking for this race.',
  },
  {
    id: RAINBOW_CUP_DISCOVERY_ID,
    name: 'Rainbow Cup',
    description:
      'You finished all five regular valley race courses. Every finish counted, whatever place you came.',
    icon: '🏆',
    undiscoveredHint:
      'The Rainbow Cup celebrates completing every regular course, not winning every one.',
  },
] as const satisfies readonly DiscoveryDefinition[];
