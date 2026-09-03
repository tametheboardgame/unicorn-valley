import { describe, expect, it } from 'vitest';
import {
  BREEZE_WINDMILL_COMPLETE_FLAG,
  BREEZE_WINDMILL_QUEST_ID,
  WINDMILL_LOOKOUT_OPEN_FLAG,
  WINDMILL_SKY_PENNANT_ITEM_ID,
} from '../../content/r6MeadowRunContent';
import { type GameEventMap, TypedEventBus } from '../events/GameEventBus';
import { QuestEngine, getQuestStepId } from '../quests/QuestEngine';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { createDefaultSave } from '../save/createDefaultSave';
import { MeadowWindmillStoryService } from './MeadowWindmillStoryService';

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

function createHarness() {
  const saveService = new SaveService(new MemorySaveRepository());
  saveService.save(createDefaultSave('2026-09-02T16:00:00.000Z'));
  const events = new TypedEventBus<GameEventMap>();
  const quests = new QuestEngine(saveService, events, () => '2026-09-02T16:00:00.000Z');
  const story = new MeadowWindmillStoryService(saveService, quests, events);
  return { saveService, events, quests, story };
}

describe('Meadow windmill story service', () => {
  it('opens Windmill Lookout through exploration and leaves a permanent home reward', () => {
    const { saveService, quests, story } = createHarness();

    expect(story.talkToBreeze().state).toBe('started');
    expect(quests.getProgress(BREEZE_WINDMILL_QUEST_ID).currentStepId).toBe(
      getQuestStepId(BREEZE_WINDMILL_QUEST_ID, 2),
    );

    expect(story.ringWindmillBell()).toBe(true);
    expect(saveService.load()?.world.flags[WINDMILL_LOOKOUT_OPEN_FLAG]).toBe(true);
    expect(quests.getProgress(BREEZE_WINDMILL_QUEST_ID).currentStepId).toBe(
      getQuestStepId(BREEZE_WINDMILL_QUEST_ID, 4),
    );

    expect(story.discoverSkyGlint()).toBe(true);
    expect(quests.getProgress(BREEZE_WINDMILL_QUEST_ID).status).toBe('completed');
    expect(saveService.load()?.world.flags[BREEZE_WINDMILL_COMPLETE_FLAG]).toBe(true);
    expect(saveService.load()?.inventory.itemQuantities[WINDMILL_SKY_PENNANT_ITEM_ID]).toBe(1);
    expect(story.talkToBreeze().state).toBe('complete');

    quests.destroy();
  });

  it('does not skip the bell or lookout exploration beats', () => {
    const { quests, story } = createHarness();
    expect(story.ringWindmillBell()).toBe(false);
    expect(story.discoverSkyGlint()).toBe(false);
    quests.destroy();
  });
});
