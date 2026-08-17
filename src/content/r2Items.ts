import type { ItemDefinition } from './contentTypes';

export const R2_ITEMS = [
  {
    id: 'item:willow-moonflower',
    name: 'Moonflower',
    description: 'A soft glowing flower that Willow is trying to grow in the village.',
    category: 'quest',
    icon: '🌙',
    questCritical: true,
  },
  {
    id: 'item:berry-bun',
    name: 'Berry Bun',
    description: 'A warm berry bun from Sunbeam Bakery.',
    category: 'food',
    icon: '🥐',
  },
  {
    id: 'item:sunbeam-cushion',
    name: 'Sunbeam Cushion',
    description: 'A cheerful cushion that can brighten a cosy cottage.',
    category: 'decoration',
    icon: '☀️',
  },
  {
    id: 'item:moonflower-lantern',
    name: 'Moonflower Lantern',
    description: 'A tiny glowing lantern Willow made to thank you for helping her garden.',
    category: 'decoration',
    icon: '🏮',
  },
] as const satisfies readonly ItemDefinition[];
