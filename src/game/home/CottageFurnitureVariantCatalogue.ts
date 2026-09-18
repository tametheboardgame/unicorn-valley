import type { CottageFurnitureStyleKey } from '../save/saveSchema';

export type CottageFurniturePalette = readonly [
  dark: number,
  base: number,
  light: number,
  secondary: number,
  secondaryDark: number,
  accent: number,
  highlight: number,
];

const PATH: Readonly<Record<CottageFurnitureStyleKey, string>> = {
  bed: 'bed',
  sofa: 'sofa',
  teaSet: 'tea-set',
  fireplace: 'fireplace',
};

const TOKENS: Readonly<Record<CottageFurnitureStyleKey, readonly string[]>> = {
  bed: ['moonflower', 'rose-dream', 'sea-glass'],
  sofa: ['sage', 'berry', 'starlight'],
  teaSet: ['honey-oak', 'rosewood', 'whitewashed'],
  fireplace: ['warm-stone', 'moonstone', 'rose-stone'],
};

export const DEFAULT_COTTAGE_FURNITURE_VARIANTS: Readonly<
  Record<CottageFurnitureStyleKey, string>
> = {
  bed: 'cottage-furniture:bed:moonflower',
  sofa: 'cottage-furniture:sofa:sage',
  teaSet: 'cottage-furniture:tea-set:honey-oak',
  fireplace: 'cottage-furniture:fireplace:warm-stone',
};

const PALETTES: Readonly<Record<string, CottageFurniturePalette>> = {
  moonflower: [0x6e4f45, 0x916751, 0xfff4e5, 0xe9bfd4, 0x9e78b0, 0xc8a4d9, 0xffe7a3],
  'rose-dream': [0x77505c, 0xa56f7e, 0xfff0ee, 0xf2bfd0, 0xb77493, 0xe8a6bf, 0xffdf9a],
  'sea-glass': [0x536f69, 0x769b91, 0xf1fbf7, 0xc5e5dc, 0x699f98, 0x9fcfc2, 0xffe5a4],
  sage: [0x638878, 0x91b9a8, 0xa8cbbb, 0xffe7a3, 0xc8a4d9, 0xfff4e5, 0xf0cc78],
  berry: [0x85546d, 0xb97c97, 0xd9a6ba, 0xf5cf9e, 0xc99acb, 0xfff0e9, 0xe9bfd4],
  starlight: [0x6f6295, 0x9b8bc1, 0xc2b6de, 0xffdfa0, 0x91c2c8, 0xf7f1ff, 0xd8b8e8],
  'honey-oak': [0x6e4f45, 0x916751, 0xc4936f, 0xc8a4d9, 0xb9819f, 0xfff4e5, 0xffe7a3],
  rosewood: [0x633e43, 0x8d5960, 0xb77b7c, 0xe5b1c1, 0xa66d87, 0xfff0ea, 0xf2cc83],
  whitewashed: [0x85766e, 0xb7aaa0, 0xe4ddd4, 0xa7ccd0, 0x788f9f, 0xfffbf3, 0xe6c98b],
  'warm-stone': [0xb78b78, 0xd5aa91, 0x4d3940, 0x6e4f45, 0x916751, 0xffe7a3, 0xf0cc78],
  moonstone: [0x8d8ca8, 0xb9b8d0, 0x444253, 0x655c78, 0x8679a0, 0xe8ddff, 0xd0b5ee],
  'rose-stone': [0xb18189, 0xd2a6aa, 0x4d3940, 0x76515b, 0x9d707a, 0xffdfb0, 0xe5af87],
};

function tokenFromId(variantId: string): string {
  return variantId.slice(variantId.lastIndexOf(':') + 1);
}

export function getCottageFurnitureVariantIds(
  furnitureKey: CottageFurnitureStyleKey,
): readonly string[] {
  const prefix = `cottage-furniture:${PATH[furnitureKey]}:`;
  return TOKENS[furnitureKey].map((token) => `${prefix}${token}`);
}

export function isKnownCottageFurnitureVariant(
  furnitureKey: CottageFurnitureStyleKey,
  variantId: string,
): boolean {
  const prefix = `cottage-furniture:${PATH[furnitureKey]}:`;
  return variantId.startsWith(prefix) && TOKENS[furnitureKey].includes(tokenFromId(variantId));
}

export function resolveCottageFurnitureVariant(
  furnitureKey: CottageFurnitureStyleKey,
  variantId: string,
): string {
  return isKnownCottageFurnitureVariant(furnitureKey, variantId)
    ? variantId
    : DEFAULT_COTTAGE_FURNITURE_VARIANTS[furnitureKey];
}

export function getCottageFurniturePalette(
  furnitureKey: CottageFurnitureStyleKey,
  variantId: string,
): CottageFurniturePalette {
  const resolved = resolveCottageFurnitureVariant(furnitureKey, variantId);
  return PALETTES[tokenFromId(resolved)]!;
}
