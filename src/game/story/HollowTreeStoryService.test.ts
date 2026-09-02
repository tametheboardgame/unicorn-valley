import { describe, expect, it } from 'vitest';
import {
  HOLLOW_TREE_NOOK_OPEN_FLAG,
  HOLLOW_TREE_STAR_JAR_ITEM_ID,
  PIP_HOLLOW_TREE_QUEST_ID,
} from '../../content/r6GladeHomeContent';
import { type GameEventMap, TypedEventBus } from '../events/GameEventBus';
import { QuestEngine, getQuestStepId } from '../quests/QuestEngine';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { createDefaultSave } from '../save/createDefaultSave';
import { HollowTreeStoryService } from './HollowTreeStoryService';

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
  const repository = new MemorySaveRepository();
  const saveService = new SaveService(repository);
  saveService.save(createDefaultSave());
  const events = new TypedEventBus<GameEventMap>();
  const quests = new QuestEngine(saveService, events, () => '2026-09-02T15:00:00.000Z');
  return {
    repository,
    saveService,
    quests,
    story: new HollowTreeStoryService(saveService, quests, events),
  };
}

describe('Hollow Tree story service', () => {
  it('opens a real nook through exploration beats, then leaves permanent home evidence', () => {
    const { repository, saveService, quests, story } = createHarness();

    expect(story.inspectTree().state).toBe('started');
    expect(quests.getProgress(PIP_HOLLOW_TREE_QUEST_ID).currentStepId).toBe(
      getQuestStepId(PIP_HOLLOW_TREE_QUEST_ID, 2),
    );

    expect(story.listenAtBridge()).toBe(true);
    expect(quests.getProgress(PIP_HOLLOW_TREE_QUEST_ID).currentStepId).toBe(
      getQuestStepId(PIP_HOLLOW_TREE_QUEST_ID, 3),
    );

    expect(story.inspectTree().state).toBe('enter-nook');
    expect(saveService.load()?.world.flags[HOLLOW_TREE_NOOK_OPEN_FLAG]).toBe(true);
    expect(quests.getProgress(PIP_HOLLOW_TREE_QUEST_ID).currentStepId).toBe(
      getQuestStepId(PIP_HOLLOW_TREE_QUEST_ID, 5),
    );

    expect(story.discoverHeartLight()).toBe(true);
    expect(quests.getProgress(PIP_HOLLOW_TREE_QUEST_ID).status).toBe('completed');
    expect(saveService.load()?.inventory.itemQuantities[HOLLOW_TREE_STAR_JAR_ITEM_ID]).toBe(1);
    expect(saveService.load()?.relationships.byCharacterId['character:pip']?.friendshipPoints).toBe(
      14,
    );

    const reloaded = new SaveService(repository);
    const reloadedEvents = new TypedEventBus<GameEventMap>();
    const reloadedQuestEngine = new QuestEngine(reloaded, reloadedEvents);
    const reloadedStory = new HollowTreeStoryService(reloaded, reloadedQuestEngine, reloadedEvents);
    expect(reloadedStory.isNookOpen()).toBe(true);
    expect(reloadedStory.inspectTree().state).toBe('complete');

    reloadedQuestEngine.destroy();
    quests.destroy();
  });

  it('does not unlock later clues before their quest step', () => {
    const { quests, story } = createHarness();
    expect(story.listenAtBridge()).toBe(false);
    expect(story.discoverHeartLight()).toBe(false);
    quests.destroy();
  });
});
