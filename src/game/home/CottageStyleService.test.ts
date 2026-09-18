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

  it('persists a complete named room style through a fresh service instance', () => {
    const repository = new MemorySaveRepository();
    const saveService = new SaveService(repository);
    const styles = new CottageStyleService(saveService);

    styles.applyStyle({
      wallColourId: 'cottage-wall:misty-lilac',
      wallpaperId: 'cottage-wallpaper:moon-sprigs',
      floorStyleId: 'cottage-floor:lavender-boards',
    });

    const reloaded = new CottageStyleService(new SaveService(repository));
    expect(reloaded.getPersistedStyle()).toEqual({
      wallColourId: 'cottage-wall:misty-lilac',
      wallpaperId: 'cottage-wallpaper:moon-sprigs',
      floorStyleId: 'cottage-floor:lavender-boards',
    });
  });

  it('rejects unknown style IDs when applying while resolving old/retired IDs safely for display', () => {
    const repository = new MemorySaveRepository();
    const saveService = new SaveService(repository);
    const styles = new CottageStyleService(saveService);

    expect(() =>
      styles.applyStyle({
        wallColourId: 'cottage-wall:not-real',
        wallpaperId: DEFAULT_COTTAGE_STYLE.wallpaperId,
        floorStyleId: DEFAULT_COTTAGE_STYLE.floorStyleId,
      }),
    ).toThrow('unknown wall, wallpaper or floor ID');

    expect(
      resolveCottageStyle({
        wallColourId: 'cottage-wall:retired',
        wallpaperId: 'cottage-wallpaper:retired',
        floorStyleId: 'cottage-floor:retired',
      }),
    ).toEqual(DEFAULT_COTTAGE_STYLE);
  });
});
