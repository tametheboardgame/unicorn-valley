import { describe, expect, it } from 'vitest';
import { PIP_STRANGE_EGG_FOUND_FLAG, PIP_STRANGE_EGG_QUEST_ID } from '../../content/r4EggArc';
import { getQuestStepId } from '../quests/QuestEngine';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import {
  LUMA_COMPANION_MEMORY,
  PIP_EGG_PENDING_GROWTH_MEMORY,
  PipEggArcService,
  getActivePipEggClue,
  getPipEggDialogueId,
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

describe("Pip's Mysterious Trail and Strange Egg arc", () => {
  it('maps each trail step to one visible physical clue and then stops at return-to-Pip', () => {
    for (let index = 1; index <= 4; index += 1) {
      const clue = getActivePipEggClue({
        status: 'active',
        currentStepId: getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, index),
        completedAt: null,
      });
      expect(clue).not.toBeNull();
    }

    expect(
      getActivePipEggClue({
        status: 'active',
        currentStepId: getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, 5),
        completedAt: null,
      }),
    ).toBeNull();
  });

  it('gives Pip clue-specific guidance throughout the trail', () => {
    const expected = [
      'dialogue:pip-strange-egg-feather',
      'dialogue:pip-strange-egg-moss',
      'dialogue:pip-strange-egg-tracks',
      'dialogue:pip-strange-egg-egg',
      'dialogue:pip-strange-egg-return',
    ] as const;

    expected.forEach((dialogueId, offset) => {
      expect(
        getPipEggDialogueId(null, {
          status: 'active',
          currentStepId: getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, offset + 1),
          completedAt: null,
        }),
      ).toBe(dialogueId);
    });
  });

  it('queues one growth change after an adventure but does not consume it at a session boundary', () => {
    const saveService = new SaveService(new MemorySaveRepository());
    createEggSave(saveService);
    const arc = new PipEggArcService(saveService);

    expect(arc.getStage()).toBe('found');
    expect(arc.recordActivity('race')).toBe(true);
    expect(arc.recordActivity('quest')).toBe(false);
    expect(arc.hasPendingGrowth()).toBe(true);

    expect(arc.beginSession()).toBe('found');
    expect(arc.hasPendingGrowth()).toBe(true);
    expect(arc.inspectEgg()).toBe('warm');
    expect(arc.hasPendingGrowth()).toBe(false);
  });

  it('persists pending growth across reload and waits for deliberate egg inspection', () => {
    const repository = new MemorySaveRepository();
    const firstService = new SaveService(repository);
    createEggSave(firstService);
    const firstArc = new PipEggArcService(firstService);
    firstArc.recordActivity('discovery');

    const freshService = new SaveService(repository);
    const reloaded = freshService.load();
    expect(reloaded?.collections.memoryIds).toContain(PIP_EGG_PENDING_GROWTH_MEMORY);

    const freshArc = new PipEggArcService(freshService);
    expect(freshArc.beginSession()).toBe('found');
    expect(getPipEggStage(freshService.load())).toBe('found');
    expect(freshArc.inspectEgg()).toBe('warm');
  });

  it('advances through visible stages only after an adventure followed by cottage inspection', () => {
    const saveService = new SaveService(new MemorySaveRepository());
    createEggSave(saveService);
    const arc = new PipEggArcService(saveService);

    for (const expectedStage of ['warm', 'glowing', 'cracking', 'hatch-ready'] as const) {
      expect(arc.recordActivity('race')).toBe(true);
      expect(arc.inspectEgg()).toBe(expectedStage);
    }

    expect(arc.completeHatch()).toBe(true);
    expect(arc.getStage()).toBe('hatched');
    expect(saveService.load()?.collections.memoryIds).toContain(LUMA_COMPANION_MEMORY);
    expect(arc.completeHatch()).toBe(false);
  });

  it('does not advance when the egg is inspected before another adventure', () => {
    const saveService = new SaveService(new MemorySaveRepository());
    createEggSave(saveService);
    const arc = new PipEggArcService(saveService);

    expect(arc.inspectEgg()).toBe('found');
    expect(arc.hasPendingGrowth()).toBe(false);
  });
});
