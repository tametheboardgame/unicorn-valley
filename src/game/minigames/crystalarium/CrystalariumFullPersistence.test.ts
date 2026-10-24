import { describe, expect, it } from 'vitest';
import { createMiniGameSession } from '../MiniGameSession';
import type { SaveRepository } from '../../save/SaveRepository';
import { SaveService } from '../../save/SaveService';
import { createDefaultSave } from '../../save/createDefaultSave';
import { createCrystalariumFullState, isCrystalariumFullState } from './CrystalariumFullRules';
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
    expect(loadCrystalariumProgress(sandbox, saves, storage).completed).toBe(12);
    expect(JSON.parse(values.get(CRYSTALARIUM_SANDBOX_STORAGE_KEY) ?? '{}').completed).toBe(12);
    expect(saves.load()?.activities.crystalarium?.completed).toBe(3);
    expect(JSON.stringify(saves.load()?.quests)).toBe(beforeQuest);
    expect(JSON.stringify(saves.load()?.world)).toBe(beforeWorld);
    expect(JSON.stringify(saves.load()?.inventory)).toBe(beforeInventory);
    expect(new SaveService(repo).load()?.activities.crystalarium?.completed).toBe(3);
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
    expect(isCrystalariumFullState(loadCrystalariumProgress(sandbox, saves, storage))).toBe(true);
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
