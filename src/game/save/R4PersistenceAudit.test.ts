import { describe, expect, it } from 'vitest';
import type { SaveRepository } from './SaveRepository';
import { SaveService } from './SaveService';
import { createR4LongRunningSaveFixture } from './fixtures/r4LongRunningSaveFixture';
import { CURRENT_SAVE_SCHEMA_VERSION } from './saveSchema';

class MemorySaveRepository implements SaveRepository {
  public value: string | null = null;

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

describe('R4 persistence audit', () => {
  it('migrates a sparse schema-v1 save into the current complete structure', () => {
    const repository = new MemorySaveRepository();
    repository.value = JSON.stringify({
      schemaVersion: 1,
      createdAt: '2026-01-12T12:00:00.000Z',
      lastSavedAt: '2026-01-12T12:00:00.000Z',
      profile: {
        name: 'Moonbeam',
        appearance: { bodyColour: 'lavender' },
        currentLocationId: 'moonflower-cottage',
        unlockedAbilityIds: [],
      },
      inventory: {
        itemQuantities: {},
        ownedCosmeticIds: [],
      },
    });

    const migrated = new SaveService(repository).load();

    expect(migrated?.schemaVersion).toBe(CURRENT_SAVE_SCHEMA_VERSION);
    expect(migrated?.profile.name).toBe('Moonbeam');
    expect(migrated?.inventory.ownedDecorationIds).toEqual([]);
    expect(migrated?.relationships.byCharacterId).toEqual({});
    expect(migrated?.home.furnitureBySlot).toEqual({});
    expect(migrated?.collections.memoryIds).toEqual([]);
  });

  it('cleans duplicate unique state and stale quest pointers before persistence', () => {
    const repository = new MemorySaveRepository();
    const service = new SaveService(repository);
    const save = createR4LongRunningSaveFixture();

    service.save({
      ...save,
      inventory: {
        ...save.inventory,
        ownedDecorationIds: [
          ...save.inventory.ownedDecorationIds,
          'item:moonflower-lantern',
          'item:rainbow-run-finisher-ribbon',
        ],
      },
      relationships: {
        byCharacterId: {
          ...save.relationships.byCharacterId,
          'character:willow': {
            friendshipPoints: 7,
            flags: ['r4:cottage-visit:willow-seen', 'r4:cottage-visit:willow-seen'],
          },
        },
      },
      quests: {
        byQuestId: {
          ...save.quests.byQuestId,
          'quest:marigold-picnic': {
            status: 'completed',
            currentStepId: 'quest-step:stale',
            completedAt: save.createdAt,
          },
        },
      },
      world: {
        ...save.world,
        uniqueDiscoveryIds: [...save.world.uniqueDiscoveryIds, 'discovery:picnic-memory'],
      },
      activities: {
        ...save.activities,
        racesById: {
          'race:rainbow-run': {
            bestTimeMs: 48200,
            ribbonIds: ['item:rainbow-run-finisher-ribbon', 'item:rainbow-run-finisher-ribbon'],
          },
        },
      },
      collections: {
        discoveryIds: [...save.collections.discoveryIds, 'discovery:picnic-memory'],
        memoryIds: [...save.collections.memoryIds, 'memory:marigold-picnic'],
      },
    });

    const reloaded = service.load();

    expect(reloaded?.inventory.ownedDecorationIds).toEqual([
      'item:moonflower-lantern',
      'item:rainbow-run-finisher-ribbon',
    ]);
    expect(reloaded?.relationships.byCharacterId['character:willow']?.flags).toEqual([
      'r4:cottage-visit:willow-seen',
    ]);
    expect(reloaded?.quests.byQuestId['quest:marigold-picnic']?.currentStepId).toBeNull();
    expect(reloaded?.world.uniqueDiscoveryIds).toEqual([
      'discovery:first-sparkle',
      'discovery:picnic-memory',
    ]);
    expect(reloaded?.activities.racesById['race:rainbow-run']?.ribbonIds).toEqual([
      'item:rainbow-run-finisher-ribbon',
    ]);
    expect(reloaded?.collections.memoryIds).toEqual([
      'memory:willow-moonflowers',
      'memory:marigold-picnic',
    ]);
  });

  it('keeps a representative long-running R4 save stable across repeated reloads', () => {
    const repository = new MemorySaveRepository();
    const service = new SaveService(repository);
    const original = createR4LongRunningSaveFixture();

    const first = service.save(original);
    const second = service.load();
    if (!second) {
      throw new Error('Expected the fixture to reload.');
    }
    const third = service.save(second);

    expect(third.inventory.ownedDecorationIds).toEqual(first.inventory.ownedDecorationIds);
    expect(third.collections.memoryIds).toEqual(first.collections.memoryIds);
    expect(third.world.uniqueDiscoveryIds).toEqual(first.world.uniqueDiscoveryIds);
    expect(third.activities.racesById['race:rainbow-run']?.ribbonIds).toEqual(
      first.activities.racesById['race:rainbow-run']?.ribbonIds,
    );
    expect(third.quests.byQuestId['quest:marigold-picnic']?.status).toBe('completed');
  });
});
