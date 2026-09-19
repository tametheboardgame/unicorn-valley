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

function profile(
  categories: readonly CottageDecorationCategory[],
  theme: CottageDecorationTheme,
  previewColour: number,
): CottageDecorationProfile {
  return { categories, theme, previewColour };
}

const COTTAGE_DECORATION_PROFILES: Partial<Record<ItemId, CottageDecorationProfile>> = {
  ...(Object.fromEntries(
    [
      ['item:starter-moonflower-hoop', ['wall', 'display'], 'moonflower', 0xd9a8d8],
      ['item:starter-star-bunting', ['wall', 'display'], 'starlight', 0xf2cf6b],
      ['item:starter-meadow-rug', ['floor'], 'sunbeam', 0x9fcf91],
      ['item:starter-daisy-vase', ['table', 'shelf', 'display'], 'sunbeam', 0x8fc9df],
    ].map(([id, categories, theme, previewColour]) => [id, { categories, theme, previewColour }]),
  ) as Partial<Record<ItemId, CottageDecorationProfile>>),
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
