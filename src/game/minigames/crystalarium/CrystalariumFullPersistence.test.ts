import { describe, expect, it } from 'vitest';
import { createMiniGameSession } from '../MiniGameSession';
import type { SaveRepository } from '../../save/SaveRepository';
import { SaveService } from '../../save/SaveService';
import { createDefaultSave } from '../../save/createDefaultSave';
import { createCrystalariumFullState } from './CrystalariumFullRules';
import { isCrystalariumPotionState, POTION_CAPACITY, readCrystalariumPotion } from './CrystalariumPotionRules';
import {
  CRYSTALARIUM_SANDBOX_STORAGE_KEY,
  loadCrystalariumProgress,
  saveCrystalariumProgress,
} from './CrystalariumFullPersistence';

class MemoryRepository implements SaveRepository {
  public value: string | null = null;
  public read(): string | null {
    return this.value;
  }
  public write(value: string): void {
    this.value = value;
  }
  public remove(): void {
    this.value = null;
  }
}
function harness() {
  const repo = new MemoryRepository();
  const saves = new SaveService(repo);
  saves.save(createDefaultSave('2026-10-24T10:00:00.000Z'));
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const world = createMiniGameSession({
    gameId: 'crystalarium',
    variantId: 'resonance-patterns',
    source: 'world',
    returnTarget: { sceneKey: 'CrystalBrookScene', mode: 'resume' },
    worldContext: { locationId: 'crystal-brook', interactionId: 'crystalarium-nursery' },
  });
  const sandbox = createMiniGameSession({
    gameId: 'crystalarium',
    variantId: 'resonance-patterns',
    source: 'just-games',
    returnTarget: { sceneKey: 'JustGamesScene', mode: 'resume' },
  });
  return { repo, saves, storage, values, world, sandbox };
}

describe('H6.9C source-isolated Crystalarium persistence', () => {
  it('separates adventure and Just Games board/chapter progress completely', () => {
    const { repo, saves, storage, values, world, sandbox } = harness();
    const first = { ...createCrystalariumFullState(), completed: 3 };
    const second = { ...createCrystalariumFullState(), completed: 12 };
    const beforeQuest = JSON.stringify(saves.load()?.quests);
    const beforeWorld = JSON.stringify(saves.load()?.world);
    const beforeInventory = JSON.stringify(saves.load()?.inventory);
    expect(saveCrystalariumProgress(world, first, saves, storage)).toBe(true);
    expect(saveCrystalariumProgress(sandbox, second, saves, storage)).toBe(true);
    expect(loadCrystalariumProgress(world, saves, storage).completed).toBe(3);
    expect(loadCrystalariumProgress(world, saves, storage).version).toBe(4);
    expect(loadCrystalariumProgress(sandbox, saves, storage).completed).toBe(12);
    expect(loadCrystalariumProgress(sandbox, saves, storage).version).toBe(4);
    expect(JSON.parse(values.get(CRYSTALARIUM_SANDBOX_STORAGE_KEY) ?? '{}').completed).toBe(12);
    expect(saves.load()?.activities.crystalarium?.completed).toBe(3);
    expect(JSON.stringify(saves.load()?.quests)).toBe(beforeQuest);
    expect(JSON.stringify(saves.load()?.world)).toBe(beforeWorld);
    expect(JSON.stringify(saves.load()?.inventory)).toBe(beforeInventory);
    expect(new SaveService(repo).load()?.activities.crystalarium?.completed).toBe(3);
  });
  it('shares adventure progress from the Grotto altar, but rejects forged return routes', () => {
    const { saves, storage, world, sandbox } = harness();
    const altar = createMiniGameSession({
      gameId: 'crystalarium',
      variantId: 'resonance-patterns',
      source: 'world',
      returnTarget: { sceneKey: 'CrystalGrottoScene', mode: 'resume' },
      worldContext: { locationId: 'crystal-grotto', interactionId: 'crystalarium-altar' },
    });
    const progress = { ...createCrystalariumFullState(), completed: 6 };
    expect(saveCrystalariumProgress(altar, progress, saves, storage)).toBe(true);
    expect(loadCrystalariumProgress(world, saves, storage).completed).toBe(6);
    expect(loadCrystalariumProgress(altar, saves, storage).completed).toBe(6);
    expect(loadCrystalariumProgress(sandbox, saves, storage).completed).toBe(0);
    for (const forged of [
      {
        ...altar,
        returnTarget: { sceneKey: 'CrystalBrookScene' as const, mode: 'resume' as const },
      },
      { ...altar, worldContext: { locationId: 'crystal-grotto', interactionId: 'crystal-grotto' } },
      { ...altar, sideEffectPolicy: 'sandbox' as const },
    ]) {
      expect(saveCrystalariumProgress(forged, progress, saves, storage)).toBe(false);
    }
  });

  it('refuses forged or wrong-variant persistence sessions', () => {
    const { saves, storage, sandbox } = harness();
    const progress = createCrystalariumFullState();
    const original = JSON.stringify(saves.load());
    expect(saveCrystalariumProgress(null, progress, saves, storage)).toBe(false);
    expect(
      saveCrystalariumProgress(
        {
          ...sandbox,
          sideEffectPolicy: 'world',
        },
        progress,
        saves,
        storage,
      ),
    ).toBe(false);
    expect(
      saveCrystalariumProgress(
        {
          ...sandbox,
          variantId: 'opening-melody',
        },
        progress,
        saves,
        storage,
      ),
    ).toBe(false);
    expect(JSON.stringify(saves.load())).toBe(original);
  });
  it('treats corrupt sandbox records as fresh without deleting adventure progress', () => {
    const { saves, storage, values, sandbox } = harness();
    values.set(CRYSTALARIUM_SANDBOX_STORAGE_KEY, '{"version":999}');
    expect(loadCrystalariumProgress(sandbox, saves, storage).completed).toBe(0);
    values.set(CRYSTALARIUM_SANDBOX_STORAGE_KEY, '{broken');
    expect(isCrystalariumPotionState(loadCrystalariumProgress(sandbox, saves, storage))).toBe(
      true,
    );
  });
  it('blocks overwriting future or corrupted sandbox records after returning a fresh in-memory view', () => {
    const { saves, sandbox, storage, values } = harness();
    for (const raw of ['{"version":99}', '{invalid']) {
      values.set(CRYSTALARIUM_SANDBOX_STORAGE_KEY, raw);
      const recovered = loadCrystalariumProgress(sandbox, saves, storage);
      expect(recovered.completed).toBe(0);
      expect(saveCrystalariumProgress(sandbox, recovered, saves, storage)).toBe(false);
      expect(values.get(CRYSTALARIUM_SANDBOX_STORAGE_KEY)).toBe(raw);
    }
  });

  it('loads an existing adventure v1 board as a v3 chamber without writing until a valid action saves', () => {
    const { saves, storage, world, sandbox } = harness();
    const old = createCrystalariumFullState();
    const cells = [...old.cells];
    cells[9] = { family: 'bell' as const, tier: 3 as const };
    const shelf = [...old.shelf];
    shelf[3] = { family: 'bright' as const, tier: 2 as const };
    const legacy = { ...old, cells, shelf, completed: 1, harmonies: 2 };
    const save = saves.load();
    if (!save) throw new Error('No adventure fixture');
    saves.save({ ...save, activities: { ...save.activities, crystalarium: legacy } });
    const baseline = JSON.stringify(saves.load());
    const migrated = loadCrystalariumProgress(world, saves, storage);
    expect(migrated.version).toBe(4);
    expect(migrated.completedPatternIds).toEqual(['crystalarium:1-1']);
    expect(migrated.revealedCount).toBe(3);
    expect(migrated.cells).toEqual(cells);
    expect(migrated.shelf.slice(0, 4)).toEqual(shelf);
    expect(migrated.shelf).toHaveLength(12);
    expect(migrated.shelf.slice(4).every((piece) => piece === null)).toBe(true);
    expect(migrated.harmonies).toBe(2);
    expect(migrated.potion).toBe(POTION_CAPACITY);
    expect(JSON.stringify(saves.load())).toBe(baseline);
    expect(saveCrystalariumProgress(world, migrated, saves, storage)).toBe(true);
    expect(saves.load()?.activities.crystalarium?.version).toBe(4);
    expect(loadCrystalariumProgress(world, saves, storage)).toEqual(migrated);
    expect(loadCrystalariumProgress(sandbox, saves, storage).completed).toBe(0);
  });

  it('atomically saves the 100-drop v4 potion alongside board and shelf in independent stores', () => {
    const { saves, storage, values, sandbox, world } = harness();
    const initial = readCrystalariumPotion(createCrystalariumFullState());
    if (!initial) throw new Error('C20 migration fixture invalid');
    const worldState = {
      ...initial,
      potion: 37,
      cells: [...initial.cells.slice(0, 4), { family: 'bright' as const, tier: 2 as const }, ...initial.cells.slice(5)],
    };
    const sandboxState = { ...initial, potion: 0 };
    expect(saveCrystalariumProgress(world, worldState, saves, storage)).toBe(true);
    expect(saveCrystalariumProgress(sandbox, sandboxState, saves, storage)).toBe(true);
    expect(saves.load()?.schemaVersion).toBe(13);
    expect(loadCrystalariumProgress(world, saves, storage)).toEqual(worldState);
    expect(loadCrystalariumProgress(sandbox, saves, storage)).toEqual(sandboxState);
    expect(JSON.parse(values.get(CRYSTALARIUM_SANDBOX_STORAGE_KEY) ?? '{}').potion).toBe(0);
    expect(saves.load()?.activities.crystalarium?.cells[4]).toEqual({
      family: 'bright',
      tier: 2,
    });
  });

  it('refuses future potion or corrupt v4 sandbox updates without replacing the record', () => {
    const { saves, sandbox, storage, values } = harness();
    const initial = readCrystalariumPotion(createCrystalariumFullState());
    if (!initial) throw new Error('C20 migration fixture invalid');
    for (const raw of [
      JSON.stringify({ ...initial, version: 5 }),
      JSON.stringify({ ...initial, potion: -1 }),
      JSON.stringify({ ...initial, potion: 101 }),
      JSON.stringify({ ...initial, shelf: [] }),
    ]) {
      values.set(CRYSTALARIUM_SANDBOX_STORAGE_KEY, raw);
      const recovered = loadCrystalariumProgress(sandbox, saves, storage);
      expect(recovered.potion).toBe(POTION_CAPACITY);
      expect(saveCrystalariumProgress(sandbox, initial, saves, storage)).toBe(false);
      expect(values.get(CRYSTALARIUM_SANDBOX_STORAGE_KEY)).toBe(raw);
    }
  });

  it('does not write a partial potion decrease when sandbox storage fails', () => {
    const { saves, sandbox } = harness();
    const initial = readCrystalariumPotion(createCrystalariumFullState());
    if (!initial) throw new Error('C20 migration fixture invalid');
    let recorded: string | null = null;
    const broken = {
      getItem: () => null,
      setItem: (_key: string, value: string): void => {
        recorded = value;
        throw new Error('quota exceeded');
      },
    };
    const candidate = { ...initial, potion: 99 };
    expect(saveCrystalariumProgress(sandbox, candidate, saves, broken)).toBe(false);
    expect(recorded).not.toBeNull();
    expect(initial.potion).toBe(100);
    expect(saves.load()?.activities.crystalarium).toBeNull();
  });

  it('does not acknowledge failed sandbox writes', () => {
    const { saves, sandbox } = harness();
    const brokenStorage = {
      getItem: (_key: string) => null,
      setItem: (_key: string, _value: string): void => {
        throw new Error('quota');
      },
    };
    expect(
      saveCrystalariumProgress(sandbox, createCrystalariumFullState(), saves, brokenStorage),
    ).toBe(false);
    expect(saves.load()?.activities.crystalarium).toBeNull();
  });
});
