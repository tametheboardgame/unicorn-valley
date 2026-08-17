import type { CharacterDefinition, DiscoveryDefinition } from './contentTypes';

export const R3_CHARACTERS = [
  {
    id: 'character:nova',
    name: 'Nova',
    role: 'Rainbow Run racer and meadow friend',
  },
] as const satisfies readonly CharacterDefinition[];

export const R3_DISCOVERIES = [
  {
    id: 'discovery:rainbow-meadow',
    name: 'Rainbow Meadow',
    description: 'A bright meadow where ribbons flutter beside the Rainbow Run race hub.',
  },
  {
    id: 'discovery:prism-bloom',
    name: 'Prism Bloom',
    description: 'A tiny meadow flower whose petals seem to hold several colours at once.',
  },
  {
    id: 'discovery:sunshower-feather',
    name: 'Sunshower Feather',
    description: 'A soft golden feather found where sunshine and meadow mist meet.',
  },
] as const satisfies readonly DiscoveryDefinition[];
