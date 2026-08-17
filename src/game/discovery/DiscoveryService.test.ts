import { describe, expect, it } from 'vitest';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { DiscoveryService } from './DiscoveryService';

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

describe('DiscoveryService', () => {
  it('persists the first discovery and its world flag across a fresh service instance', () => {
    const repository = new MemorySaveRepository();
    const saveService = new SaveService(repository);
    saveService.save(saveService.createNewGame());

    const discoveries = new DiscoveryService(saveService);
    discoveries.unlockDiscovery('discovery:moonflower-sparkle', 'flag:first-sparkle-found');

    const reloadedSave = new SaveService(repository).load();
    expect(reloadedSave?.collections.discoveryIds).toContain('discovery:moonflower-sparkle');
    expect(reloadedSave?.world.uniqueDiscoveryIds).toContain('discovery:moonflower-sparkle');
    expect(reloadedSave?.world.flags['flag:first-sparkle-found']).toBe(true);
    expect(new DiscoveryService(new SaveService(repository)).hasDiscovery('discovery:moonflower-sparkle')).toBe(
      true,
    );
  });

  it('does not duplicate a discovery when it is unlocked again', () => {
    const repository = new MemorySaveRepository();
    const saveService = new SaveService(repository);
    saveService.save(saveService.createNewGame());
    const discoveries = new DiscoveryService(saveService);

    discoveries.unlockDiscovery('discovery:moonflower-sparkle');
    discoveries.unlockDiscovery('discovery:moonflower-sparkle');

    const save = saveService.load();
    expect(save?.collections.discoveryIds).toEqual(['discovery:moonflower-sparkle']);
    expect(save?.world.uniqueDiscoveryIds).toEqual(['discovery:moonflower-sparkle']);
  });
});
