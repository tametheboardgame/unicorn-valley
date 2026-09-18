import type { CottageFurnitureStyleKey } from '../save/saveSchema';

export type CottageFurniturePalette = readonly [primary: number, secondary: number];

const PALETTES: Readonly<
  Record<CottageFurnitureStyleKey, Readonly<Record<string, CottageFurniturePalette>>>
> = {
  bed: {
    moonflower: [0x6e4f45, 0xc8a4d9],
    'rose-dream': [0x77505c, 0xe8a6bf],
    'sea-glass': [0x536f69, 0x9fcfc2],
  },
  sofa: {
    sage: [0x638878, 0x91b9a8],
    berry: [0x85546d, 0xb97c97],
    starlight: [0x6f6295, 0x9b8bc1],
  },
  teaSet: {
    'honey-oak': [0x6e4f45, 0xc4936f],
    rosewood: [0x633e43, 0xb77b7c],
    whitewashed: [0x85766e, 0xe4ddd4],
  },
  fireplace: {
    'warm-stone': [0xb78b78, 0xd5aa91],
    moonstone: [0x8d8ca8, 0xb9b8d0],
    'rose-stone': [0xb18189, 0xd2a6aa],
  },
};

const FALLBACK: Readonly<Record<CottageFurnitureStyleKey, string>> = {
  bed: 'moonflower',
  sofa: 'sage',
  teaSet: 'honey-oak',
  fireplace: 'warm-stone',
};

export function getCottageFurniturePalette(
  furnitureKey: CottageFurnitureStyleKey,
  variantId: string,
): CottageFurniturePalette {
  const variants = PALETTES[furnitureKey];
  const token = variantId.slice(variantId.lastIndexOf(':') + 1);
  return variants[token] ?? variants[FALLBACK[furnitureKey]]!;
}
