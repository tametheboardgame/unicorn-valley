import { describe, expect, it } from 'vitest';
import {
  FIREFLY_ENDLESS_GLOW_DISCOVERY_ID,
  FIREFLY_LANTERN_KEEPER_DISCOVERY_ID,
  FIREFLY_MIDNIGHT_MASTER_DISCOVERY_ID,
  FIREFLY_PRISM_KEEPER_DISCOVERY_ID,
} from '../../content/r5FireflyLantern';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import {
  FIREFLY_LANTERN_ENDLESS_ACTIVITY_ID,
  FIREFLY_LANTERN_ENDLESS_GLOW_MEMORY,
  FIREFLY_LANTERN_ENDLESS_MASTERY_MEMORY,
  FIREFLY_LANTERN_FIRST_COMPLETION_MEMORY,
  FIREFLY_LANTERN_MULTICOLOUR_COMPLETION_MEMORY,
  getFireflyLanternProgress,
  reconcileFireflyLanternProgress,
  recordFireflyLanternAttempt,
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
  const service = new SaveService(
    new MemoryRepository(),
    undefined,
    () => '2026-08-24T13:00:00.000Z',
  );
  service.save(service.createNewGame());
  return service;
}

describe('R5-WP5.9F Firefly Lantern persistence', () => {
  it('records an imperfect Normal best without unlocking replay modes', () => {
    const service = createService();
    const result = recordFireflyLanternResult(service, 6);
    const save = service.load();

    expect(result.normalBest).toBe(6);
    expect(result.firstCompletion).toBe(false);
    expect(result.modesUnlocked).toBe(false);
    expect(save?.collections.memoryIds).not.toContain(FIREFLY_LANTERN_FIRST_COMPLETION_MEMORY);
  });

  it('awards the Normal milestone once after a perfect eight-light completion', () => {
    const service = createService();
    const first = recordFireflyLanternResult(service, 8);
    const repeat = recordFireflyLanternResult(service, 8);
    const save = service.load();

    expect(first.firstCompletion).toBe(true);
    expect(first.newMilestones).toEqual(['normal-first']);
    expect(repeat.firstCompletion).toBe(false);
    expect(repeat.newMilestones).toEqual([]);
    expect(save?.collections.memoryIds).toContain(FIREFLY_LANTERN_FIRST_COMPLETION_MEMORY);
    expect(save?.collections.discoveryIds).toContain(FIREFLY_LANTERN_KEEPER_DISCOVERY_ID);
    expect(
      save?.collections.memoryIds.filter(
        (memoryId) => memoryId === FIREFLY_LANTERN_FIRST_COMPLETION_MEMORY,
      ),
    ).toHaveLength(1);
  });

  it('keeps legacy first-completion saves unlocked and backfills their Wonderbook reward', () => {
    const service = createService();
    const save = service.load();
    if (!save) {
      throw new Error('Expected seeded save.');
    }
    service.save({
      ...save,
      collections: {
        ...save.collections,
        memoryIds: [...save.collections.memoryIds, FIREFLY_LANTERN_FIRST_COMPLETION_MEMORY],
      },
    });

    const reconciled = reconcileFireflyLanternProgress(service);
    const progress = getFireflyLanternProgress(service);

    expect(progress.modesUnlocked).toBe(true);
    expect(reconciled.collections.discoveryIds).toContain(FIREFLY_LANTERN_KEEPER_DISCOVERY_ID);
  });

  it('awards Multicolour only for a completed eight-yellow run', () => {
    const service = createService();
    recordFireflyLanternResult(service, 8);

    const failed = recordFireflyLanternAttempt(service, {
      mode: 'multicolour',
      score: 5,
      completed: false,
    });
    const completed = recordFireflyLanternAttempt(service, {
      mode: 'multicolour',
      score: 8,
      completed: true,
    });
    const save = service.load();

    expect(failed.newMilestones).toEqual([]);
    expect(completed.newMilestones).toEqual(['multicolour-first']);
    expect(save?.collections.memoryIds).toContain(FIREFLY_LANTERN_MULTICOLOUR_COMPLETION_MEMORY);
    expect(save?.collections.discoveryIds).toContain(FIREFLY_PRISM_KEEPER_DISCOVERY_ID);
  });

  it('persists Endless personal best and finite threshold milestones', () => {
    const service = createService();
    const glow = recordFireflyLanternAttempt(service, {
      mode: 'endless',
      score: 12,
      completed: false,
    });
    const mastery = recordFireflyLanternAttempt(service, {
      mode: 'endless',
      score: 24,
      completed: false,
    });
    const lowerReplay = recordFireflyLanternAttempt(service, {
      mode: 'endless',
      score: 7,
      completed: false,
    });
    const save = service.load();

    expect(glow.newMilestones).toEqual(['endless-glow']);
    expect(mastery.newMilestones).toEqual(['endless-mastery']);
    expect(lowerReplay.endlessBest).toBe(24);
    expect(save?.activities.miniGameRecords[FIREFLY_LANTERN_ENDLESS_ACTIVITY_ID]).toBe(24);
    expect(save?.collections.memoryIds).toEqual(
      expect.arrayContaining([
        FIREFLY_LANTERN_ENDLESS_GLOW_MEMORY,
        FIREFLY_LANTERN_ENDLESS_MASTERY_MEMORY,
      ]),
    );
    expect(save?.collections.discoveryIds).toEqual(
      expect.arrayContaining([
        FIREFLY_ENDLESS_GLOW_DISCOVERY_ID,
        FIREFLY_MIDNIGHT_MASTER_DISCOVERY_ID,
      ]),
    );
  });
});
