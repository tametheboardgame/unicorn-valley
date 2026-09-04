import type { ItemId } from '../../content/contentTypes';
import type { CottageDecorationCategory } from '../world/CottageInteriorMap';

export type CottageDecorationTheme =
  | 'moonflower'
  | 'rainbow'
  | 'starlight'
  | 'sunbeam'
  | 'adventure';

export interface CottageDecorationProfile {
  categories: readonly CottageDecorationCategory[];
  theme: CottageDecorationTheme;
  previewColour: number;
}

const COTTAGE_DECORATION_PROFILES: Partial<Record<ItemId, CottageDecorationProfile>> = {
  'item:sunbeam-cushion': { categories: ['floor'], theme: 'sunbeam', previewColour: 0xffd982 },
  'item:moonflower-lantern': {
    categories: ['wall', 'table', 'shelf', 'display'],
    theme: 'moonflower',
    previewColour: 0xc8a6dc,
  },
  'item:rainbow-run-finisher-ribbon': {
    categories: ['wall', 'shelf', 'display'],
    theme: 'rainbow',
    previewColour: 0xf6a9cf,
  },
  'item:rainbow-run-podium-rosette': {
    categories: ['wall', 'shelf', 'display'],
    theme: 'rainbow',
    previewColour: 0xffd479,
  },
  'item:crystal-cascade-finisher-ribbon': {
    categories: ['wall', 'shelf', 'display'],
    theme: 'adventure',
    previewColour: 0x78d4dc,
  },
  'item:crystal-cascade-podium-rosette': {
    categories: ['wall', 'shelf', 'display'],
    theme: 'adventure',
    previewColour: 0xb5ecf2,
  },
  'item:petal-parade-finisher-ribbon': {
    categories: ['wall', 'shelf', 'display'],
    theme: 'rainbow',
    previewColour: 0xf4a7cf,
  },
  'item:petal-parade-podium-rosette': {
    categories: ['wall', 'shelf', 'display'],
    theme: 'rainbow',
    previewColour: 0xffd66f,
  },
  'item:mooncap-trail-finisher-ribbon': {
    categories: ['wall', 'shelf', 'display'],
    theme: 'adventure',
    previewColour: 0x9fd488,
  },
  'item:mooncap-trail-podium-rosette': {
    categories: ['wall', 'shelf', 'display'],
    theme: 'adventure',
    previewColour: 0xc9e6a0,
  },
  'item:shoreline-surge-finisher-ribbon': {
    categories: ['wall', 'shelf', 'display'],
    theme: 'starlight',
    previewColour: 0x80d7e5,
  },
  'item:shoreline-surge-podium-rosette': {
    categories: ['wall', 'shelf', 'display'],
    theme: 'starlight',
    previewColour: 0xd5edf0,
  },
  'item:rainbow-cup-pennant': {
    categories: ['wall', 'display'],
    theme: 'rainbow',
    previewColour: 0xf0c75d,
  },
  'item:cloud-cushion': { categories: ['floor'], theme: 'starlight', previewColour: 0xc8dff2 },
  'item:starlight-lamp': {
    categories: ['wall', 'table', 'shelf'],
    theme: 'starlight',
    previewColour: 0xb8a7df,
  },
  'item:rainbow-rug': { categories: ['floor'], theme: 'rainbow', previewColour: 0xf4a7c7 },
  'item:pebble-curiosity-display': {
    categories: ['table', 'shelf', 'display'],
    theme: 'adventure',
    previewColour: 0xd6b98b,
  },
  'item:brook-prism-mobile': {
    categories: ['wall', 'shelf', 'display'],
    theme: 'adventure',
    previewColour: 0x7fd5dc,
  },
  'item:sunbeam-picnic-basket': {
    categories: ['floor', 'table', 'display'],
    theme: 'sunbeam',
    previewColour: 0xe8b56d,
  },
  'item:hollow-tree-star-jar': {
    categories: ['table', 'shelf', 'display'],
    theme: 'moonflower',
    previewColour: 0xffdfa0,
  },
  'item:butterfly-window-charm': {
    categories: ['wall', 'shelf', 'display'],
    theme: 'moonflower',
    previewColour: 0xd9b7eb,
  },
  'item:windmill-sky-pennant': {
    categories: ['wall', 'shelf', 'display'],
    theme: 'rainbow',
    previewColour: 0x9edcf2,
  },
  'item:echo-crystal-chime': {
    categories: ['wall', 'shelf', 'display'],
    theme: 'adventure',
    previewColour: 0x91e3e5,
  },
  'item:fern-firefly-lantern': {
    categories: ['wall', 'table', 'shelf', 'display'],
    theme: 'adventure',
    previewColour: 0xe4dc86,
  },
  'item:moonflower-night-memory': {
    categories: ['wall', 'table', 'shelf', 'display'],
    theme: 'moonflower',
    previewColour: 0xd9c1f0,
  },
  'item:friendship-route-pennant': {
    categories: ['wall', 'shelf', 'display'],
    theme: 'rainbow',
    previewColour: 0xf1c968,
  },
  'item:odd-stone-bookend': {
    categories: ['table', 'shelf', 'display'],
    theme: 'adventure',
    previewColour: 0x9bb6b5,
  },
  'item:shore-and-starwell-lantern': {
    categories: ['wall', 'table', 'shelf', 'display'],
    theme: 'starlight',
    previewColour: 0xcde79d,
  },
};

export function getCottageDecorationProfile(itemId: ItemId): CottageDecorationProfile | null {
  return COTTAGE_DECORATION_PROFILES[itemId] ?? null;
}

export function canPlaceDecorationInCategory(
  itemId: ItemId,
  category: CottageDecorationCategory,
): boolean {
  return getCottageDecorationProfile(itemId)?.categories.includes(category) ?? false;
}

export function getCottageDecorationThemeLabel(theme: CottageDecorationTheme): string {
  switch (theme) {
    case 'moonflower':
      return 'Moonflower';
    case 'rainbow':
      return 'Rainbow';
    case 'starlight':
      return 'Starlight';
    case 'sunbeam':
      return 'Sunbeam';
    case 'adventure':
      return 'Adventure';
  }
}
