export const COTTAGE_STARTER_HOME_STYLE_IDS = [
  'cottage-wall:moon-cream',
  'cottage-wall:blush-dawn',
  'cottage-wall:misty-lilac',
  'cottage-wallpaper:plain',
  'cottage-wallpaper:moon-sprigs',
  'cottage-floor:honey-oak',
  'cottage-floor:rosewood',
  'cottage-furniture:bed:moonflower',
  'cottage-furniture:bed:rose-dream',
  'cottage-furniture:sofa:sage',
  'cottage-furniture:sofa:berry',
  'cottage-furniture:tea-set:honey-oak',
  'cottage-furniture:tea-set:rosewood',
  'cottage-furniture:fireplace:warm-stone',
  'cottage-furniture:fireplace:moonstone',
] as const;

export const COTTAGE_UNLOCKABLE_HOME_STYLE_IDS = [
  'cottage-wall:sea-glass',
  'cottage-wall:buttercup',
  'cottage-wallpaper:star-scatter',
  'cottage-wallpaper:meadow-vines',
  'cottage-floor:whitewashed-oak',
  'cottage-floor:lavender-boards',
  'cottage-furniture:bed:sea-glass',
  'cottage-furniture:sofa:starlight',
  'cottage-furniture:tea-set:whitewashed',
  'cottage-furniture:fireplace:rose-stone',
] as const;

export const COTTAGE_ALL_HOME_STYLE_IDS = [
  ...COTTAGE_STARTER_HOME_STYLE_IDS,
  ...COTTAGE_UNLOCKABLE_HOME_STYLE_IDS,
] as const;

export type CottageHomeStyleEntitlementId = (typeof COTTAGE_ALL_HOME_STYLE_IDS)[number];

const COTTAGE_HOME_STYLE_ID_SET = new Set<string>(COTTAGE_ALL_HOME_STYLE_IDS);

export function isCottageHomeStyleEntitlementId(
  value: string,
): value is CottageHomeStyleEntitlementId {
  return COTTAGE_HOME_STYLE_ID_SET.has(value);
}
