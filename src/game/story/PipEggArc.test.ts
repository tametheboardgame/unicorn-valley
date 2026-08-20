import { describe, expect, it } from 'vitest';
import { PIP_STRANGE_EGG_FOUND_FLAG, PIP_STRANGE_EGG_QUEST_ID } from '../../content/r4EggArc';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { getQuestStepId } from '../quests/QuestEngine';
import {
  LUMA_COMPANION_MEMORY,
  PIP_EGG_PENDING_GROWTH_MEMORY,
  PipEggArcService,
  getActivePipEggClue,
  getPipEggStage,
} from './PipEggArc';

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

function createEggSave(service: SaveService): void {
  const save = service.createNewGame();
  service.save({
    ...save,
    world: {
      ...save.world,
      flags: {
        ...save.world.flags,
        [PIP_STRANGE_EGG_FOUND_FLAG]: true,
      },
    },
  });
}

describe("Pip's Strange Egg arc", () => {
  it('maps each quest clue step to one visible clue spot', () => {
    for (let index = 1; index <= 4; index += 1) {
      const clue = getActivePipEggClue({
        status: 'active',
        currentStepId: getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, index),
        completedAt: null,
      });
      expect(clue).not.toBeNull();
    }

    expect(
      getActivePipEggClue({ status: 'completed', currentStepId: null, completedAt: 'done' }),
    ).toBeNull();
  });

  it('queues at most one growth change per session but allows later-session activity', () => {
    const saveService = new SaveService(new MemorySaveRepository());
    createEggSave(saveService);
    const arc = new PipEggArcService(saveService);

    expect(arc.getStage()).toBe('found');
    expect(arc.recordActivity('race')).toBe(true);
    expect(arc.recordActivity('race')).toBe(false);
    expect(arc.recordActivity('quest')).toBe(false);
    expect(arc.hasPendingGrowth()).toBe(true);

    expect(arc.beginSession()).toBe('warm');
    expect(arc.hasPendingGrowth()).toBe(false);
    expect(arc.recordActivity('race')).toBe(true);
  });

  it('persists queued growth across a fresh service instance without using elapsed time', () => {
    const repository = new MemorySaveRepository();
    const firstService = new SaveService(repository);
    createEggSave(firstService);
    const firstArc = new PipEggArcService(firstService);
    firstArc.recordActivity('discovery');

    const freshService = new SaveService(repository);
    const reloaded = freshService.load();
    expect(reloaded?.collections.memoryIds).toContain(PIP_EGG_PENDING_GROWTH_MEMORY);

    const nextSessionArc = new PipEggArcService(freshService);
    expect(nextSessionArc.beginSession()).toBe('warm');
    expect(getPipEggStage(freshService.load())).toBe('warm');
  });

  it('advances through visible stages and persists the first companion after hatching', () => {
    const saveService = new SaveService(new MemorySaveRepository());
    createEggSave(saveService);
    const arc = new PipEggArcService(saveService);

    for (const expectedStage of ['warm', 'glowing', 'cracking', 'hatch-ready'] as const) {
      expect(arc.recordActivity('race')).toBe(true);
      expect(arc.beginSession()).toBe(expectedStage);
    }

    expect(arc.completeHatch()).toBe(true);
    expect(arc.getStage()).toBe('hatched');
    expect(saveService.load()?.collections.memoryIds).toContain(LUMA_COMPANION_MEMORY);
    expect(arc.completeHatch()).toBe(false);
  });
});
