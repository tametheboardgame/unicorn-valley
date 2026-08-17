import { describe, expect, it } from 'vitest';
import { DiscoveryService } from '../discovery/DiscoveryService';
import {
  DEFAULT_UNICORN_APPEARANCE,
  serialiseUnicornAppearance,
} from '../player/UnicornAppearance';
import type { SaveRepository } from './SaveRepository';
import { SaveService } from './SaveService';
import {
  MOONFLOWER_GLADE_LOCATION_ID,
  saveLocationCheckpoint,
} from './saveLocationCheckpoint';

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

describe('R1 first playable persistence chain', () => {
  it('survives creator -> Glade -> discovery -> fresh service reload', () => {
    const repository = new MemorySaveRepository();
    const service = new SaveService(repository);
    const newGame = service.createNewGame();
    const appearance = {
      ...DEFAULT_UNICORN_APPEARANCE,
      bodyColour: 'lavender' as const,
      maneStyle: 'fluffy' as const,
      accessory: 'bow' as const,
    };

    service.save({
      ...newGame,
      profile: {
        ...newGame.profile,
        name: 'Moonbeam',
        appearance: serialiseUnicornAppearance(appearance),
      },
    });
    saveLocationCheckpoint(service, MOONFLOWER_GLADE_LOCATION_ID);
    new DiscoveryService(service).unlockDiscovery(
      'discovery:moonflower-sparkle',
      'flag:first-sparkle-found',
    );

    const reloaded = new SaveService(repository).load();

    expect(reloaded?.profile.name).toBe('Moonbeam');
    expect(reloaded?.profile.appearance).toEqual(serialiseUnicornAppearance(appearance));
    expect(reloaded?.locationId).toBe(MOONFLOWER_GLADE_LOCATION_ID);
    expect(reloaded?.collections.discoveryIds).toContain('discovery:moonflower-sparkle');
    expect(reloaded?.world.flags['flag:first-sparkle-found']).toBe(true);
  });

  it('start-over can replace an existing save with a clean new game', () => {
    const repository = new MemorySaveRepository();
    const service = new SaveService(repository);
    const oldGame = service.createNewGame();

    service.save({
      ...oldGame,
      profile: { ...oldGame.profile, name: 'Old Unicorn' },
      world: { ...oldGame.world, flags: { 'flag:old-progress': true } },
    });

    service.save(service.createNewGame());
    const reloaded = new SaveService(repository).load();

    expect(reloaded?.profile.name).toBeNull();
    expect(reloaded?.world.flags).toEqual({});
    expect(reloaded?.collections.discoveryIds).toEqual([]);
  });
});
