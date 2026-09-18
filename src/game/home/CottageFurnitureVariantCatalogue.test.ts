import { describe, expect, it } from 'vitest';
import { getCottageFurniturePalette } from './CottageFurnitureVariantCatalogue';

describe('CottageFurnitureVariantCatalogue', () => {
  it('provides distinct curated furniture finishes', () => {
    expect(getCottageFurniturePalette('bed', 'cottage-furniture:bed:rose-dream')).not.toEqual(
      getCottageFurniturePalette('bed', 'cottage-furniture:bed:moonflower'),
    );
    expect(getCottageFurniturePalette('sofa', 'cottage-furniture:sofa:starlight')).not.toEqual(
      getCottageFurniturePalette('sofa', 'cottage-furniture:sofa:sage'),
    );
  });

  it('renders retired IDs with the appearance-preserving default finish', () => {
    expect(getCottageFurniturePalette('bed', 'retired:variant')).toEqual(
      getCottageFurniturePalette('bed', 'cottage-furniture:bed:moonflower'),
    );
    expect(getCottageFurniturePalette('fireplace', 'retired:variant')).toEqual(
      getCottageFurniturePalette('fireplace', 'cottage-furniture:fireplace:warm-stone'),
    );
  });
});
