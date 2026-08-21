import type { DiscoveryDefinition, ItemDefinition } from './contentTypes';

export const CRYSTAL_BROOK_REGION_DISCOVERY_ID = 'discovery:crystal-brook';
export const BROOK_CRYSTAL_DISCOVERY_ID = 'discovery:brook-river-crystal';
export const SINGING_SHELL_DISCOVERY_ID = 'discovery:brook-singing-shell';
export const PRISM_GROTTO_DISCOVERY_ID = 'discovery:prism-grotto';

export const BROOK_CRYSTAL_ITEM_ID = 'item:brook-river-crystal';
export const SINGING_SHELL_ITEM_ID = 'item:brook-singing-shell';

export const R5_CRYSTAL_BROOK_ITEMS = [
  {
    id: BROOK_CRYSTAL_ITEM_ID,
    name: 'River Crystal',
    description: 'A smooth crystal polished bright by Crystal Brook.',
    category: 'collectable',
    icon: '💎',
  },
  {
    id: SINGING_SHELL_ITEM_ID,
    name: 'Singing Shell',
    description: 'A tiny shell that hums when the brook runs past it.',
    category: 'collectable',
    icon: '🐚',
  },
] as const satisfies readonly ItemDefinition[];

export const R5_CRYSTAL_BROOK_DISCOVERIES = [
  {
    id: CRYSTAL_BROOK_REGION_DISCOVERY_ID,
    name: 'Crystal Brook',
    description:
      'A bright stream valley filled with stepping stones, reeds and glittering river treasures.',
    icon: '💧',
  },
  {
    id: BROOK_CRYSTAL_DISCOVERY_ID,
    name: 'River Crystal',
    description: 'The brook rounds these crystals until every edge catches the light.',
    icon: '💎',
  },
  {
    id: SINGING_SHELL_DISCOVERY_ID,
    name: 'Singing Shell',
    description: 'Hold one near the water and it answers with a tiny musical hum.',
    icon: '🐚',
  },
  {
    id: PRISM_GROTTO_DISCOVERY_ID,
    name: 'Prism Grotto',
    description: 'A tucked-away bend where reflected light paints rainbows across the stones.',
    kind: 'secret',
    icon: '🌈',
    undiscoveredHint: 'A side trail near the lower brook seems to sparkle when nobody is looking.',
  },
] as const satisfies readonly DiscoveryDefinition[];
