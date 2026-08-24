import type { DiscoveryDefinition } from './contentTypes';

export const FIREFLY_LANTERN_KEEPER_DISCOVERY_ID = 'discovery:firefly-lantern-keeper' as const;
export const FIREFLY_PRISM_KEEPER_DISCOVERY_ID = 'discovery:firefly-prism-keeper' as const;
export const FIREFLY_ENDLESS_GLOW_DISCOVERY_ID = 'discovery:firefly-endless-glow' as const;
export const FIREFLY_MIDNIGHT_MASTER_DISCOVERY_ID = 'discovery:firefly-midnight-master' as const;

export const R5_FIREFLY_LANTERN_DISCOVERIES = [
  {
    id: FIREFLY_LANTERN_KEEPER_DISCOVERY_ID,
    name: 'Lantern Keeper',
    description: 'Every golden firefly reached the lantern. The Woods remember that perfect glow.',
    kind: 'secret',
    icon: '🏮',
    undiscoveredHint: 'Guide every golden light home during a Normal lantern game.',
  },
  {
    id: FIREFLY_PRISM_KEEPER_DISCOVERY_ID,
    name: 'Prism Keeper',
    description: 'You found all the yellow lights among a fluttering rainbow of decoys.',
    kind: 'secret',
    icon: '🌈',
    undiscoveredHint: 'Complete Multicolour after the lantern reveals its extra games.',
  },
  {
    id: FIREFLY_ENDLESS_GLOW_DISCOVERY_ID,
    name: 'Endless Glow',
    description: 'A long chain of fireflies shone without a single light being missed.',
    kind: 'secret',
    icon: '✨',
    undiscoveredHint: 'Build a strong Endless streak at the Firefly Lantern.',
  },
  {
    id: FIREFLY_MIDNIGHT_MASTER_DISCOVERY_ID,
    name: 'Midnight Lantern Master',
    description: 'Even when the fireflies became tiny and quick, your lantern kept glowing.',
    kind: 'secret',
    icon: '🌙',
    undiscoveredHint: 'Push an Endless lantern streak much further than before.',
  },
] as const satisfies readonly DiscoveryDefinition[];
