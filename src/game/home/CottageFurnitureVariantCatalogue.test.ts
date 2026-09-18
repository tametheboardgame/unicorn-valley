import { describe, expect, it } from 'vitest';
import {
  COTTAGE_FURNITURE_VARIANT_IDS,
  DEFAULT_COTTAGE_FURNITURE_VARIANTS,
  getCottageFurniturePalette,
  isKnownCottageFurnitureVariant,
  resolveCottageFurnitureVariant,
} from './CottageFurnitureVariantCatalogue';

describe('CottageFurnitureVariantCatalogue', () => {
  it('provides curated variants for every supported permanent furniture group', () => {
    for (const furnitureKey of ['bed', 'sofa', 'teaSet', 'fireplace'] as const) {
      expect(COTTAGE_FURNITURE_VARIANT_IDS[furnitureKey].length).toBeGreaterThanOrEqual(3);
      expect(
        isKnownCottageFurnitureVariant(
          furnitureKey,
          DEFAULT_COTTAGE_FURNITURE_VARIANTS[furnitureKey],
        ),
      ).toBe(true);
    }
  });

  it('resolves retired IDs to appearance-preserving defaults', () => {
    for (const furnitureKey of ['bed', 'sofa', 'teaSet', 'fireplace'] as const) {
      expect(resolveCottageFurnitureVariant(furnitureKey, 'retired:variant')).toBe(
        DEFAULT_COTTAGE_FURNITURE_VARIANTS[furnitureKey],
      );
      expect(getCottageFurniturePalette(furnitureKey, 'retired:variant')).toEqual(
        getCottageFurniturePalette(
          furnitureKey,
          DEFAULT_COTTAGE_FURNITURE_VARIANTS[furnitureKey],
        ),
      );
    }
  });
});
