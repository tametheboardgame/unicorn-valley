import { describe, expect, it } from 'vitest';
import {
  CRYSTAL_GROTTO_GLOWING_FLAG,
  CRYSTAL_GROTTO_OPEN_FLAG,
  ECHO_CRYSTAL_CHIME_ITEM_ID,
  ECHO_CRYSTAL_SONG_COMPLETE_FLAG,
  ECHO_CRYSTAL_SONG_QUEST_ID,
} from '../../content/r6CrystalBrookDepthContent';
import { type GameEventMap, TypedEventBus } from '../events/GameEventBus';
import { getQuestStepId, QuestEngine } from '../quests/QuestEngine';
import { createMiniGameSession } from '../minigames/MiniGameSession';
import { completeCrystalariumOpening } from '../minigames/crystalarium/CrystalariumWorldOutcome';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { createDefaultSave } from '../save/createDefaultSave';
import { CrystalGrottoStoryService } from './CrystalGrottoStoryService';

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
  saveService.save(createDefaultSave('2026-09-02T17:00:00.000Z'));
  const events = new TypedEventBus<GameEventMap>();
  const quests = new QuestEngine(saveService, events, () => '2026-09-02T17:00:00.000Z');
  const story = new CrystalGrottoStoryService(saveService, quests, events);
  const completeOpening = () =>
    completeCrystalariumOpening(
      createMiniGameSession({
        gameId: 'crystalarium',
        source: 'world',
        variantId: 'opening-melody',
        returnTarget: { sceneKey: 'CrystalBrookScene', mode: 'resume' },
        worldContext: {
          locationId: 'crystal-brook',
          interactionId: 'crystal-grotto',
          questContext: ECHO_CRYSTAL_SONG_QUEST_ID,
        },
      }),
      saveService,
      quests,
      events,
    );
  return { repository, saveService, quests, story, completeOpening };
}

describe('Crystal Grotto story service', () => {
  it('keeps the entrance sealed until the opening melody succeeds, then completes the Crystal Song', () => {
    const { saveService, quests, story, completeOpening } = createHarness();

    expect(story.talkToEcho().state).toBe('started');
    expect(story.isGrottoOpen()).toBe(false);
    expect(story.isOpeningMelodyReady()).toBe(true);
    expect(saveService.load()?.world.flags[CRYSTAL_GROTTO_OPEN_FLAG]).not.toBe(true);
    expect(quests.getProgress(ECHO_CRYSTAL_SONG_QUEST_ID).currentStepId).toBe(
      getQuestStepId(ECHO_CRYSTAL_SONG_QUEST_ID, 1),
    );
    expect(completeOpening()).toBe(true);
    expect(story.isGrottoOpen()).toBe(true);
    expect(story.isOpeningMelodyReady()).toBe(false);
    expect(quests.getProgress(ECHO_CRYSTAL_SONG_QUEST_ID).currentStepId).toBe(
      getQuestStepId(ECHO_CRYSTAL_SONG_QUEST_ID, 3),
    );

    expect(story.playCrystalNote('low')).toBe(true);
    expect(quests.getProgress(ECHO_CRYSTAL_SONG_QUEST_ID).currentStepId).toBe(
      getQuestStepId(ECHO_CRYSTAL_SONG_QUEST_ID, 4),
    );
    expect(story.playCrystalNote('bright')).toBe(true);
    expect(quests.getProgress(ECHO_CRYSTAL_SONG_QUEST_ID).currentStepId).toBe(
      getQuestStepId(ECHO_CRYSTAL_SONG_QUEST_ID, 5),
    );
    expect(story.playCrystalNote('bell')).toBe(true);

    expect(quests.getProgress(ECHO_CRYSTAL_SONG_QUEST_ID).status).toBe('completed');
    expect(saveService.load()?.world.flags[ECHO_CRYSTAL_SONG_COMPLETE_FLAG]).toBe(true);
    expect(saveService.load()?.world.flags[CRYSTAL_GROTTO_GLOWING_FLAG]).toBe(true);
    expect(saveService.load()?.inventory.itemQuantities[ECHO_CRYSTAL_CHIME_ITEM_ID]).toBe(1);
    expect(story.talkToEcho().state).toBe('complete');

    quests.destroy();
  });

  it('retains the first opening, quest step and access after a persisted save reload', () => {
    const { repository, saveService, quests, story, completeOpening } = createHarness();
    expect(story.talkToEcho().state).toBe('started');
    expect(completeOpening()).toBe(true);

    const reloadedSave = new SaveService(repository);
    const reloadedEvents = new TypedEventBus<GameEventMap>();
    const reloadedQuests = new QuestEngine(
      reloadedSave,
      reloadedEvents,
      () => '2026-09-02T17:00:00.000Z',
    );
    const reloadedStory = new CrystalGrottoStoryService(
      reloadedSave,
      reloadedQuests,
      reloadedEvents,
    );

    expect(reloadedStory.isGrottoOpen()).toBe(true);
    expect(reloadedStory.isOpeningMelodyReady()).toBe(false);
    expect(reloadedQuests.getProgress(ECHO_CRYSTAL_SONG_QUEST_ID).currentStepId).toBe(
      getQuestStepId(ECHO_CRYSTAL_SONG_QUEST_ID, 3),
    );
    expect(reloadedSave.load()?.world.flags[CRYSTAL_GROTTO_OPEN_FLAG]).toBe(true);

    const before = JSON.stringify(reloadedSave.load());
    expect(completeOpening()).toBe(false);
    expect(JSON.stringify(reloadedSave.load())).toBe(before);

    reloadedQuests.destroy();
    quests.destroy();
  });

  it('preserves a legacy mid-song save across reload without reopening the tutorial', () => {
    const { repository, saveService, quests } = createHarness();
    const current = saveService.load();
    if (!current) throw new Error('Expected saved profile');

    saveService.save({
      ...current,
      quests: {
        ...current.quests,
        byQuestId: {
          ...current.quests.byQuestId,
          [ECHO_CRYSTAL_SONG_QUEST_ID]: {
            status: 'active',
            currentStepId: getQuestStepId(ECHO_CRYSTAL_SONG_QUEST_ID, 4),
            completedAt: null,
          },
        },
      },
    });

    const reloadedSave = new SaveService(repository);
    const reloadedEvents = new TypedEventBus<GameEventMap>();
    const reloadedQuests = new QuestEngine(
      reloadedSave,
      reloadedEvents,
      () => '2026-09-02T17:00:00.000Z',
    );
    const reloadedStory = new CrystalGrottoStoryService(
      reloadedSave,
      reloadedQuests,
      reloadedEvents,
    );

    expect(reloadedStory.isGrottoOpen()).toBe(true);
    expect(reloadedStory.isOpeningMelodyReady()).toBe(false);
    expect(reloadedQuests.getProgress(ECHO_CRYSTAL_SONG_QUEST_ID).currentStepId).toBe(
      getQuestStepId(ECHO_CRYSTAL_SONG_QUEST_ID, 4),
    );
    expect(reloadedSave.load()?.world.flags[CRYSTAL_GROTTO_OPEN_FLAG]).not.toBe(true);

    reloadedQuests.destroy();
    quests.destroy();
  });

  it('does not allow the crystal melody to be played out of order', () => {
    const { quests, story } = createHarness();
    story.talkToEcho();

    expect(story.playCrystalNote('bright')).toBe(false);
    expect(story.playCrystalNote('bell')).toBe(false);
    expect(story.playCrystalNote('low')).toBe(false);
    expect(story.playCrystalNote('bell')).toBe(false);

    quests.destroy();
  });

  it('only awards optional Brook discoveries once', () => {
    const { quests, story } = createHarness();

    expect(story.discoverWaterfallRainbow()).toBe(true);
    expect(story.discoverWaterfallRainbow()).toBe(false);
    expect(story.discoverReflectionPool()).toBe(true);
    expect(story.discoverReflectionPool()).toBe(false);
    expect(story.discoverSteppingChime()).toBe(true);
    expect(story.discoverSteppingChime()).toBe(false);

    quests.destroy();
  });
});
