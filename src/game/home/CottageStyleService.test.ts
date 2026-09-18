import { describe, expect, it } from 'vitest';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { createDefaultSave } from '../save/createDefaultSave';
import { resolveCottageStyle } from './CottageStyleCatalogue';

const DEFAULT_COTTAGE_STYLE = createDefaultSave('2026-01-01T00:00:00.000Z').home.style;
import { CottageStyleService } from './CottageStyleService';

class MemorySaveRepository implements SaveRepository {
  private value: string | null = null;

  public read(): string | null {
    return this.value;
  }

  public write(serialisedSave: string): void {
    this.value = serialisedSave;
  }

  public remove(): void {
    this.value = null;
  }
}

describe('CottageStyleService', () => {
  it('starts with the canonical appearance-preserving defaults', () => {
    const service = new CottageStyleService(new SaveService(new MemorySaveRepository()));
    expect(service.getResolvedStyle()).toEqual(DEFAULT_COTTAGE_STYLE);
  });

  it('persists four independent walls and the floor through a fresh service instance', () => {
    const repository = new MemorySaveRepository();
    const styles = new CottageStyleService(new SaveService(repository));

    styles.applyStyle({
      walls: {
        back: {
          wallColourId: 'cottage-wall:misty-lilac',
          wallpaperId: 'cottage-wallpaper:moon-sprigs',
        },
        left: {
          wallColourId: 'cottage-wall:sea-glass',
          wallpaperId: 'cottage-wallpaper:meadow-vines',
        },
        right: {
          wallColourId: 'cottage-wall:buttercup',
          wallpaperId: 'cottage-wallpaper:star-scatter',
        },
        front: {
          wallColourId: 'cottage-wall:blush-dawn',
          wallpaperId: 'cottage-wallpaper:plain',
        },
      },
      floorStyleId: 'cottage-floor:lavender-boards',
      furnitureVariants: {
        bed: 'cottage-furniture:bed:rose-dream',
        sofa: 'cottage-furniture:sofa:starlight',
        teaSet: 'cottage-furniture:tea-set:rosewood',
        fireplace: 'cottage-furniture:fireplace:moonstone',
      },
    });

    const reloaded = new CottageStyleService(new SaveService(repository));
    expect(reloaded.getPersistedStyle()).toEqual({
      walls: {
        back: {
          wallColourId: 'cottage-wall:misty-lilac',
          wallpaperId: 'cottage-wallpaper:moon-sprigs',
        },
        left: {
          wallColourId: 'cottage-wall:sea-glass',
          wallpaperId: 'cottage-wallpaper:meadow-vines',
        },
        right: {
          wallColourId: 'cottage-wall:buttercup',
          wallpaperId: 'cottage-wallpaper:star-scatter',
        },
        front: {
          wallColourId: 'cottage-wall:blush-dawn',
          wallpaperId: 'cottage-wallpaper:plain',
        },
      },
      floorStyleId: 'cottage-floor:lavender-boards',
      furnitureVariants: {
        bed: 'cottage-furniture:bed:rose-dream',
        sofa: 'cottage-furniture:sofa:starlight',
        teaSet: 'cottage-furniture:tea-set:rosewood',
        fireplace: 'cottage-furniture:fireplace:moonstone',
      },
    });
  });

  it('rejects unknown surfaces while preserving retired furniture IDs for visual fallback', () => {
    const repository = new MemorySaveRepository();
    const styles = new CottageStyleService(new SaveService(repository));

    expect(() =>
      styles.applyStyle({
        walls: {
          ...DEFAULT_COTTAGE_STYLE.walls,
          left: {
            wallColourId: 'cottage-wall:not-real',
            wallpaperId: DEFAULT_COTTAGE_STYLE.walls.left.wallpaperId,
          },
        },
        floorStyleId: DEFAULT_COTTAGE_STYLE.floorStyleId,
        furnitureVariants: { ...DEFAULT_COTTAGE_STYLE.furnitureVariants },
      }),
    ).toThrow('unknown wall, wallpaper or floor ID');

    const retiredFurniture = {
      ...DEFAULT_COTTAGE_STYLE,
      furnitureVariants: {
        ...DEFAULT_COTTAGE_STYLE.furnitureVariants,
        sofa: 'cottage-furniture:sofa:retired',
      },
    };
    expect(resolveCottageStyle(retiredFurniture).furnitureVariants.sofa).toBe(
      'cottage-furniture:sofa:retired',
    );
  });
});
