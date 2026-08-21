import { describe, expect, it } from 'vitest';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import {
  FIREFLY_LANTERN_ACTIVITY_ID,
  FIREFLY_LANTERN_FIRST_COMPLETION_MEMORY,
  getFireflyLanternBestScore,
  recordFireflyLanternResult,
} from './FireflyLanternActivity';

class MemoryRepository implements SaveRepository {
  private value: string | null = null;

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

function createService(): SaveService {
  const service = new SaveService(new MemoryRepository(), undefined, () => '2026-08-21T10:00:00.000Z');
  service.save(service.createNewGame());
  return service;
}

describe('Firefly Lantern activity persistence', () => {
  it('records the first completion, best score and memory', () => {
    const service = createService();
    const result = recordFireflyLanternResult(service, 6);
    const save = service.load();

    expect(result).toEqual({ bestScore: 6, firstCompletion: true });
    expect(save?.activities.miniGameRecords[FIREFLY_LANTERN_ACTIVITY_ID]).toBe(6);
    expect(save?.collections.memoryIds).toContain(FIREFLY_LANTERN_FIRST_COMPLETION_MEMORY);
  });

  it('keeps the higher best score and never duplicates the completion memory', () => {
    const service = createService();
    recordFireflyLanternResult(service, 7);
    const second = recordFireflyLanternResult(service, 3);
    const save = service.load();

    expect(second).toEqual({ bestScore: 7, firstCompletion: false });
    expect(getFireflyLanternBestScore(service)).toBe(7);
    expect(
      save?.collections.memoryIds.filter(
        (memoryId) => memoryId === FIREFLY_LANTERN_FIRST_COMPLETION_MEMORY,
      ),
    ).toHaveLength(1);
  });
});
