import { describe, expect, it } from 'vitest';
import {
  FERN_FIREFLY_LANTERN_ITEM_ID,
  FERN_FIREFLY_WAY_QUEST_ID,
  FIREFLY_GROVE_LIT_FLAG,
  HIDDEN_LEAF_PATH_DISCOVERY_ID,
  MUSHROOM_RING_DISCOVERY_ID,
  TINY_TRACKS_QUEST_ID,
  WOODS_LIGHT_TRAIL_FLAG,
} from '../../content/r6WhisperingWoodsDepthContent';
import { type GameEventMap, TypedEventBus } from '../events/GameEventBus';
import { QuestEngine, getQuestStepId } from '../quests/QuestEngine';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { createDefaultSave } from '../save/createDefaultSave';
import { WoodsDepthStoryService } from './WoodsDepthStoryService';

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
  saveService.save(createDefaultSave('2026-09-02T17:00:00.000Z'));
  const events = new TypedEventBus<GameEventMap>();
  const quests = new QuestEngine(saveService, events, () => '2026-09-02T17:00:00.000Z');
  const story = new WoodsDepthStoryService(saveService, quests, events);
  return { saveService, quests, story };
}

describe('Woods depth story service', () => {
  it('keeps Fern’s exploration clues ordered and leaves a permanent lit route', () => {
    const { saveService, quests, story } = createHarness();

    expect(story.talkToFern().state).toBe('started');
    expect(quests.getProgress(FERN_FIREFLY_WAY_QUEST_ID).currentStepId).toBe(
      getQuestStepId(FERN_FIREFLY_WAY_QUEST_ID, 3),
    );
    expect(story.greetAncientTree()).toBe(false);
    expect(story.followFernLightTrail()).toBe(true);
    expect(story.greetAncientTree()).toBe(true);
    expect(story.discoverGroveHeart()).toBe(true);

    expect(quests.getProgress(FERN_FIREFLY_WAY_QUEST_ID).status).toBe('completed');
    expect(saveService.load()?.world.flags[FIREFLY_GROVE_LIT_FLAG]).toBe(true);
    expect(saveService.load()?.world.flags[WOODS_LIGHT_TRAIL_FLAG]).toBe(true);
    expect(saveService.load()?.inventory.itemQuantities[FERN_FIREFLY_LANTERN_ITEM_ID]).toBe(1);
    expect(story.talkToFern().state).toBe('complete');

    quests.destroy();
  });

  it('runs Tiny Tracks as a separate short ordered story', () => {
    const { quests, story } = createHarness();

    expect(story.inspectHollowLog()).toBe(false);
    expect(story.beginTinyTracks()).toBe(true);
    expect(quests.getProgress(TINY_TRACKS_QUEST_ID).currentStepId).toBe(
      getQuestStepId(TINY_TRACKS_QUEST_ID, 2),
    );
    expect(story.spotLittleMossTail()).toBe(false);
    expect(story.inspectHollowLog()).toBe(true);
    expect(story.spotLittleMossTail()).toBe(true);
    expect(quests.getProgress(TINY_TRACKS_QUEST_ID).status).toBe('completed');
    expect(story.isTinyTracksComplete()).toBe(true);

    quests.destroy();
  });

  it('only awards optional Woods discoveries once', () => {
    const { saveService, quests, story } = createHarness();

    expect(story.discoverMushroomRing()).toBe(true);
    expect(story.discoverMushroomRing()).toBe(false);
    expect(story.discoverHiddenLeafPath()).toBe(true);
    expect(story.discoverHiddenLeafPath()).toBe(false);

    const save = saveService.load();
    expect(save?.collections.discoveryIds).toContain(MUSHROOM_RING_DISCOVERY_ID);
    expect(save?.collections.discoveryIds).toContain(HIDDEN_LEAF_PATH_DISCOVERY_ID);

    quests.destroy();
  });
});
