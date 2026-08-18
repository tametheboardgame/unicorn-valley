import type { CharacterDefinition, DiscoveryDefinition, ItemDefinition } from './contentTypes';

export const R3_ITEMS = [
  {
    id: 'item:rainbow-run-sparkle',
    name: 'Rainbow Sparkle',
    description: 'A bright little race reward earned simply by reaching the Rainbow Run finish.',
    category: 'reward',
    icon: '✨',
  },
  {
    id: 'item:rainbow-run-finisher-ribbon',
    name: 'Rainbow Run Finisher Ribbon',
    description: 'A cheerful ribbon for finishing Rainbow Run. It can decorate your cottage.',
    category: 'decoration',
    icon: '🎀',
    discoveryId: 'discovery:rainbow-run-ribbons',
  },
  {
    id: 'item:rainbow-run-podium-rosette',
    name: 'Rainbow Run Podium Rosette',
    description: 'A bright rosette for reaching the podium. It can decorate your cottage too.',
    category: 'decoration',
    icon: '🏅',
    discoveryId: 'discovery:rainbow-run-ribbons',
  },
] as const satisfies readonly ItemDefinition[];

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
  {
    id: 'discovery:rainbow-run-ribbons',
    name: 'Rainbow Run Ribbons',
    description:
      'Race ribbons that remember something important: reaching the finish is worth celebrating.',
  },
] as const satisfies readonly DiscoveryDefinition[];
