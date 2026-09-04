import { describe, expect, it } from 'vitest';
import {
  LUMI_CHARACTER_ID,
  LUMI_INTRO_RELATIONSHIP_FLAG,
  STARWELL_REVEALED_FLAG,
} from '../../content/r5LumiWoodsStory';
import {
  LIGHT_FOUND_SEA_COMPLETE_FLAG,
  LIGHT_FOUND_SEA_QUEST_ID,
  SHORE_AND_STARWELL_LANTERN_ITEM_ID,
} from '../../content/r65CrossRegionFollowUp';
import { CORAL_SHELL_STORIES_QUEST_ID } from '../../content/r65StarlightBeach';
import { type GameEventMap, TypedEventBus } from '../events/GameEventBus';
import { QuestEngine, getQuestStepId } from '../quests/QuestEngine';
import { RelationshipService } from '../relationships/RelationshipService';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { createDefaultSave } from '../save/createDefaultSave';
import { CrossRegionFollowUpStoryService } from './CrossRegionFollowUpStoryService';

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
  saveService.save(createDefaultSave('2026-09-04T14:00:00.000Z'));
  const events = new TypedEventBus<GameEventMap>();
  const quests = new QuestEngine(saveService, events, () => '2026-09-04T14:00:00.000Z');
  const story = new CrossRegionFollowUpStoryService(saveService, quests, events);
  const relationships = new RelationshipService(saveService, events);
  return { saveService, quests, story, relationships };
}

function completeQuest(saveService: SaveService, questId: `quest:${string}`): void {
  const save = saveService.load() ?? saveService.createNewGame();
  saveService.save({
    ...save,
    quests: {
      ...save.quests,
      byQuestId: {
        ...save.quests.byQuestId,
        [questId]: {
          status: 'completed',
          currentStepId: null,
          completedAt: '2026-09-04T13:59:00.000Z',
        },
      },
    },
  });
}

function unlockPrerequisites(
  saveService: SaveService,
  relationships: RelationshipService,
): void {
  completeQuest(saveService, CORAL_SHELL_STORIES_QUEST_ID);
  relationships.markMet(LUMI_CHARACTER_ID);
  relationships.addFlag(LUMI_CHARACTER_ID, LUMI_INTRO_RELATIONSHIP_FLAG);
  const save = saveService.load() ?? saveService.createNewGame();
  saveService.save({
    ...save,
    world: {
      ...save.world,
      flags: {
        ...save.world.flags,
        [STARWELL_REVEALED_FLAG]: true,
      },
    },
  });
}

describe('R6.5-WP13 cross-region follow-up story', () => {
  it('stays hidden until Coral and Lumi friendship prerequisites are complete', () => {
    const { quests, story } = createHarness();

    expect(story.canStart()).toBe(false);
    expect(story.inspectMoonlitGlimmer().changed).toBe(false);
    expect(quests.getProgress(LIGHT_FOUND_SEA_QUEST_ID).status).toBe('not-started');

    quests.destroy();
  });

  it('travels Beach to Woods and back before leaving a persistent reward', () => {
    const { saveService, quests, story, relationships } = createHarness();
    unlockPrerequisites(saveService, relationships);

    expect(story.canStart()).toBe(true);
    expect(story.inspectMoonlitGlimmer().changed).toBe(true);
    expect(quests.getProgress(LIGHT_FOUND_SEA_QUEST_ID).currentStepId).toBe(
      getQuestStepId(LIGHT_FOUND_SEA_QUEST_ID, 1),
    );

    expect(story.askCoralAboutGlimmer().changed).toBe(true);
    expect(quests.getProgress(LIGHT_FOUND_SEA_QUEST_ID).currentStepId).toBe(
      getQuestStepId(LIGHT_FOUND_SEA_QUEST_ID, 2),
    );

    expect(story.askLumiAboutGlimmer().changed).toBe(true);
    expect(story.inspectStarwellReflection().changed).toBe(true);
    expect(story.returnToCoral().changed).toBe(true);

    expect(quests.getProgress(LIGHT_FOUND_SEA_QUEST_ID).status).toBe('completed');
    expect(saveService.load()?.world.flags[LIGHT_FOUND_SEA_COMPLETE_FLAG]).toBe(true);
    expect(
      saveService.load()?.inventory.itemQuantities[SHORE_AND_STARWELL_LANTERN_ITEM_ID],
    ).toBe(1);
    expect(relationships.getRelationship(LUMI_CHARACTER_ID).friendshipPoints).toBe(8);
    expect(relationships.getRelationship('character:coral').friendshipPoints).toBe(8);

    quests.destroy();
  });
});
