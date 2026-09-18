import { describe, expect, it } from 'vitest';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { DEFAULT_COTTAGE_STYLE, resolveCottageStyle } from './CottageStyleCatalogue';
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
    });
  });

  it('rejects unknown IDs and resolves retired IDs safely per wall', () => {
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
      }),
    ).toThrow('unknown wall, wallpaper or floor ID');

    expect(
      resolveCottageStyle({
        walls: {
          back: {
            wallColourId: 'cottage-wall:retired',
            wallpaperId: 'cottage-wallpaper:retired',
          },
          left: { ...DEFAULT_COTTAGE_STYLE.walls.left },
          right: { ...DEFAULT_COTTAGE_STYLE.walls.right },
          front: { ...DEFAULT_COTTAGE_STYLE.walls.front },
        },
        floorStyleId: 'cottage-floor:retired',
      }),
    ).toEqual(DEFAULT_COTTAGE_STYLE);
  });
});
