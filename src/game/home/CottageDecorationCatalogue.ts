import type { ItemId } from '../../content/contentTypes';
import type { CottageDecorationCategory } from '../world/CottageInteriorMap';

export type CottageDecorationTheme =
  | 'moonflower'
  | 'rainbow'
  | 'starlight'
  | 'sunbeam'
  | 'adventure';

export type CottageDecorationGroup =
  | 'lighting'
  | 'flowers-plants'
  | 'rugs-cushions'
  | 'trophies-ribbons'
  | 'keepsakes'
  | 'ornaments'
  | 'hangings';

export type CottageDecorationVisualKind =
  | 'hoop'
  | 'bunting'
  | 'rug'
  | 'vase'
  | 'cushion'
  | 'lantern'
  | 'ribbon'
  | 'rosette'
  | 'pennant'
  | 'basket'
  | 'jar'
  | 'mobile'
  | 'charm'
  | 'chime'
  | 'bookend'
  | 'keepsake'
  | 'ornament';

export type CottageDecorationPlacementMode =
  | 'flat-floor'
  | 'wall-mounted'
  | 'supported'
  | 'freestanding';

export interface CottageDecorationPlacementBehaviour {
  mode: CottageDecorationPlacementMode;
  collisionWidth?: number;
  collisionHeight?: number;
  collisionOffsetY?: number;
}

export interface CottageDecorationProfile {
  categories: readonly CottageDecorationCategory[];
  theme: CottageDecorationTheme;
  previewColour: number;
  group?: CottageDecorationGroup;
  visualKind?: CottageDecorationVisualKind;
}

function profile(
  categories: readonly CottageDecorationCategory[],
  theme: CottageDecorationTheme,
  previewColour: number,
): CottageDecorationProfile {
  return { categories, theme, previewColour };
}

const COTTAGE_DECORATION_PROFILES: Partial<Record<ItemId, CottageDecorationProfile>> = {
  'item:starter-moonflower-hoop': {
    categories: ['wall', 'display'],
    theme: 'moonflower',
    previewColour: 0xd9a8d8,
    group: 'hangings',
    visualKind: 'hoop',
  },
  'item:starter-star-bunting': {
    categories: ['wall', 'display'],
    theme: 'starlight',
    previewColour: 0xf2cf6b,
    group: 'hangings',
    visualKind: 'bunting',
  },
  'item:starter-meadow-rug': {
    categories: ['floor'],
    theme: 'sunbeam',
    previewColour: 0x9fcf91,
    group: 'rugs-cushions',
    visualKind: 'rug',
  },
  'item:starter-daisy-vase': {
    categories: ['table', 'shelf', 'display'],
    theme: 'sunbeam',
    previewColour: 0x8fc9df,
    group: 'flowers-plants',
    visualKind: 'vase',
  },
  'item:sunbeam-cushion': profile(['floor'], 'sunbeam', 0xffd982),
  'item:moonflower-lantern': profile(['wall', 'table', 'shelf', 'display'], 'moonflower', 0xc8a6dc),
  'item:rainbow-run-finisher-ribbon': profile(['wall', 'shelf', 'display'], 'rainbow', 0xf6a9cf),
  'item:rainbow-run-podium-rosette': profile(['wall', 'shelf', 'display'], 'rainbow', 0xffd479),
  'item:crystal-cascade-finisher-ribbon': profile(
    ['wall', 'shelf', 'display'],
    'adventure',
    0x78d4dc,
  ),
  'item:crystal-cascade-podium-rosette': profile(
    ['wall', 'shelf', 'display'],
    'adventure',
    0xb5ecf2,
  ),
  'item:petal-parade-finisher-ribbon': profile(['wall', 'shelf', 'display'], 'rainbow', 0xf4a7cf),
  'item:petal-parade-podium-rosette': profile(['wall', 'shelf', 'display'], 'rainbow', 0xffd66f),
  'item:mooncap-trail-finisher-ribbon': profile(
    ['wall', 'shelf', 'display'],
    'adventure',
    0x9fd488,
  ),
  'item:mooncap-trail-podium-rosette': profile(['wall', 'shelf', 'display'], 'adventure', 0xc9e6a0),
  'item:shoreline-surge-finisher-ribbon': profile(
    ['wall', 'shelf', 'display'],
    'starlight',
    0x80d7e5,
  ),
  'item:shoreline-surge-podium-rosette': profile(
    ['wall', 'shelf', 'display'],
    'starlight',
    0xd5edf0,
  ),
  'item:rainbow-cup-pennant': profile(['wall', 'display'], 'rainbow', 0xf0c75d),
  'item:cloud-cushion': profile(['floor'], 'starlight', 0xc8dff2),
  'item:starlight-lamp': profile(['wall', 'table', 'shelf'], 'starlight', 0xb8a7df),
  'item:rainbow-rug': profile(['floor'], 'rainbow', 0xf4a7c7),
  'item:pebble-curiosity-display': profile(['table', 'shelf', 'display'], 'adventure', 0xd6b98b),
  'item:brook-prism-mobile': profile(['wall', 'shelf', 'display'], 'adventure', 0x7fd5dc),
  'item:sunbeam-picnic-basket': profile(['floor', 'table', 'display'], 'sunbeam', 0xe8b56d),
  'item:hollow-tree-star-jar': profile(['table', 'shelf', 'display'], 'moonflower', 0xffdfa0),
  'item:butterfly-window-charm': profile(['wall', 'shelf', 'display'], 'moonflower', 0xd9b7eb),
  'item:windmill-sky-pennant': profile(['wall', 'shelf', 'display'], 'rainbow', 0x9edcf2),
  'item:echo-crystal-chime': profile(['wall', 'shelf', 'display'], 'adventure', 0x91e3e5),
  'item:fern-firefly-lantern': profile(
    ['wall', 'table', 'shelf', 'display'],
    'adventure',
    0xe4dc86,
  ),
  'item:moonflower-night-memory': profile(
    ['wall', 'table', 'shelf', 'display'],
    'moonflower',
    0xd9c1f0,
  ),
  'item:friendship-route-pennant': profile(['wall', 'shelf', 'display'], 'rainbow', 0xf1c968),
  'item:odd-stone-bookend': profile(['table', 'shelf', 'display'], 'adventure', 0x9bb6b5),
  'item:shore-and-starwell-lantern': profile(
    ['wall', 'table', 'shelf', 'display'],
    'starlight',
    0xcde79d,
  ),
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

function inferDecorationGroup(itemId: ItemId): CottageDecorationGroup {
  const id = itemId.toLowerCase();
  if (id.includes('lantern') || id.includes('lamp') || id.includes('star-jar')) return 'lighting';
  if (id.includes('rug') || id.includes('cushion')) return 'rugs-cushions';
  if (id.includes('ribbon') || id.includes('rosette') || id.includes('cup'))
    return 'trophies-ribbons';
  if (
    id.includes('pennant') ||
    id.includes('bunting') ||
    id.includes('mobile') ||
    id.includes('charm') ||
    id.includes('chime') ||
    id.includes('hoop')
  ) {
    return 'hangings';
  }
  if (id.includes('basket') || id.includes('bookend') || id.includes('display')) return 'ornaments';
  return 'keepsakes';
}

function inferVisualKind(itemId: ItemId): CottageDecorationVisualKind {
  const id = itemId.toLowerCase();
  if (id.includes('hoop')) return 'hoop';
  if (id.includes('bunting')) return 'bunting';
  if (id.includes('rug')) return 'rug';
  if (id.includes('vase')) return 'vase';
  if (id.includes('cushion')) return 'cushion';
  if (id.includes('lantern') || id.includes('lamp')) return 'lantern';
  if (id.includes('ribbon')) return 'ribbon';
  if (id.includes('rosette')) return 'rosette';
  if (id.includes('pennant')) return 'pennant';
  if (id.includes('basket')) return 'basket';
  if (id.includes('jar')) return 'jar';
  if (id.includes('mobile')) return 'mobile';
  if (id.includes('charm')) return 'charm';
  if (id.includes('chime')) return 'chime';
  if (id.includes('bookend')) return 'bookend';
  if (id.includes('display')) return 'ornament';
  return 'keepsake';
}

export function getCottageDecorationGroup(itemId: ItemId): CottageDecorationGroup {
  return getCottageDecorationProfile(itemId)?.group ?? inferDecorationGroup(itemId);
}

export function getCottageDecorationVisualKind(itemId: ItemId): CottageDecorationVisualKind {
  return getCottageDecorationProfile(itemId)?.visualKind ?? inferVisualKind(itemId);
}

export function getCottageDecorationGroupLabel(group: CottageDecorationGroup): string {
  switch (group) {
    case 'lighting':
      return 'Lighting';
    case 'flowers-plants':
      return 'Flowers & Plants';
    case 'rugs-cushions':
      return 'Rugs & Cushions';
    case 'trophies-ribbons':
      return 'Trophies & Ribbons';
    case 'keepsakes':
      return 'Keepsakes';
    case 'ornaments':
      return 'Ornaments';
    case 'hangings':
      return 'Hangings';
  }
}

export function resolveCottageDecorationPlacementBehaviour(
  itemId: ItemId,
  category: CottageDecorationCategory,
): CottageDecorationPlacementBehaviour {
  if (category === 'wall') {
    return { mode: 'wall-mounted' };
  }
  if (category === 'table' || category === 'shelf' || category === 'display') {
    return { mode: 'supported' };
  }

  const kind = getCottageDecorationVisualKind(itemId);
  if (kind === 'rug') {
    return { mode: 'flat-floor' };
  }

  if (kind === 'cushion') {
    return { mode: 'freestanding', collisionWidth: 54, collisionHeight: 30, collisionOffsetY: 8 };
  }

  return { mode: 'freestanding', collisionWidth: 68, collisionHeight: 42, collisionOffsetY: 12 };
}
