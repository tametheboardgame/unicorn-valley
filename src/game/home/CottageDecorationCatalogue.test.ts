import { describe, expect, it } from 'vitest';
import { itemRegistry } from '../../content/registries';
import {
  getCottageDecorationGroup,
  getCottageDecorationProfile,
  getCottageDecorationThemeLabel,
  resolveCottageDecorationPlacementBehaviour,
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

  it('classifies the starter collection into player-facing browsing groups', () => {
    expect(getCottageDecorationGroup('item:starter-daisy-vase')).toBe('flowers-plants');
    expect(getCottageDecorationGroup('item:starter-meadow-rug')).toBe('rugs-cushions');
    expect(getCottageDecorationGroup('item:starter-moonflower-hoop')).toBe('hangings');
    expect(getCottageDecorationGroup('item:rainbow-run-podium-rosette')).toBe('trophies-ribbons');
  });

  it('distinguishes flat rugs, wall/support items and solid floor decorations', () => {
    expect(resolveCottageDecorationPlacementBehaviour('item:starter-meadow-rug', 'floor')).toEqual({
      mode: 'flat-floor',
    });
    expect(
      resolveCottageDecorationPlacementBehaviour('item:starter-moonflower-hoop', 'wall'),
    ).toEqual({ mode: 'wall-mounted' });
    expect(resolveCottageDecorationPlacementBehaviour('item:starter-daisy-vase', 'table')).toEqual({
      mode: 'supported',
    });
    expect(
      resolveCottageDecorationPlacementBehaviour('item:sunbeam-cushion', 'floor'),
    ).toMatchObject({ mode: 'freestanding', collisionWidth: 54, collisionHeight: 30 });
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
