import { describe, expect, it } from 'vitest';
import { itemRegistry } from '../../content/registries';
import {
  getCottageDecorationProfile,
  getCottageDecorationThemeLabel,
} from './CottageDecorationCatalogue';

describe('CottageDecorationCatalogue', () => {
  it('classifies every registered cottage decoration', () => {
    const decorations = itemRegistry.values().filter((item) => item.category === 'decoration');

    expect(decorations.length).toBeGreaterThan(0);
    for (const decoration of decorations) {
      expect(getCottageDecorationProfile(decoration.id), decoration.id).not.toBeNull();
    }
  });

  it('supports every R4 cottage placement category', () => {
    const categories = new Set(
      itemRegistry
        .values()
        .filter((item) => item.category === 'decoration')
        .flatMap((item) => getCottageDecorationProfile(item.id)?.categories ?? []),
    );

    expect(categories).toEqual(new Set(['wall', 'floor', 'table', 'shelf', 'display']));
  });

  it('provides several visibly distinct decoration themes', () => {
    const themes = new Set(
      itemRegistry
        .values()
        .filter((item) => item.category === 'decoration')
        .flatMap((item) => {
          const profile = getCottageDecorationProfile(item.id);
          return profile ? [getCottageDecorationThemeLabel(profile.theme)] : [];
        }),
    );

    expect(themes).toEqual(new Set(['Moonflower', 'Rainbow', 'Starlight', 'Sunbeam', 'Adventure']));
  });
});
