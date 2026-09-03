import { describe, expect, it } from 'vitest';
import { NOVA_FIRST_RACE_QUEST_ID } from '../../content/r3Quests';
import { WILLOW_MOONFLOWERS_QUEST_ID } from '../../content/r2Quests';
import {
  FRIENDSHIP_ROUTE_PENNANT_ITEM_ID,
  JUNIPER_BUTTERFLY_COUNT_COMPLETE_FLAG,
  JUNIPER_BUTTERFLY_COUNT_DISCOVERY_ID,
  JUNIPER_BUTTERFLY_COUNT_QUEST_ID,
  MAPLE_PICNIC_SPOT_COMPLETE_FLAG,
  MAPLE_PICNIC_SPOT_DISCOVERY_ID,
  MAPLE_PICNIC_SPOT_QUEST_ID,
  MOONFLOWER_NIGHT_MEMORY_ITEM_ID,
  NOVA_NO_FINISH_LINE_COMPLETE_FLAG,
  NOVA_NO_FINISH_LINE_QUEST_ID,
  ODD_STONE_BOOKEND_ITEM_ID,
  PEBBLE_ODD_STONE_COMPLETE_FLAG,
  PEBBLE_ODD_STONE_QUEST_ID,
  WILLOW_AFTER_DARK_COMPLETE_FLAG,
  WILLOW_AFTER_DARK_QUEST_ID,
} from '../../content/r6ExistingValleyQuestPack';
import { MAPLE_CAKE_QUEST_ID } from '../../content/r6VillageContent';
import { type GameEventMap, TypedEventBus } from '../events/GameEventBus';
import { QuestEngine, getQuestStepId } from '../quests/QuestEngine';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { createDefaultSave } from '../save/createDefaultSave';
import { ExistingValleyQuestPackService } from './ExistingValleyQuestPackService';

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
  saveService.save(createDefaultSave('2026-09-03T12:00:00.000Z'));
  const events = new TypedEventBus<GameEventMap>();
  const quests = new QuestEngine(saveService, events, () => '2026-09-03T12:00:00.000Z');
  const story = new ExistingValleyQuestPackService(saveService, quests, events);
  return { saveService, quests, story };
}

function completePrerequisite(saveService: SaveService, questId: `quest:${string}`): void {
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
          completedAt: '2026-09-03T11:59:00.000Z',
        },
      },
    },
  });
}

describe('R6.5-WP11 existing valley quest pack', () => {
  it('discovers Willow’s night follow-up through exploration and completes after talking to Willow', () => {
    const { saveService, quests, story } = createHarness();

    expect(story.inspectMoonflowersAfterDark().changed).toBe(false);
    completePrerequisite(saveService, WILLOW_MOONFLOWERS_QUEST_ID);

    expect(story.inspectMoonflowersAfterDark().changed).toBe(true);
    expect(quests.getProgress(WILLOW_AFTER_DARK_QUEST_ID).currentStepId).toBe(
      getQuestStepId(WILLOW_AFTER_DARK_QUEST_ID, 1),
    );

    quests.notifyCharacterTalked('character:willow');
    expect(quests.getProgress(WILLOW_AFTER_DARK_QUEST_ID).status).toBe('completed');
    expect(saveService.load()?.world.flags[WILLOW_AFTER_DARK_COMPLETE_FLAG]).toBe(true);
    expect(saveService.load()?.inventory.itemQuantities[MOONFLOWER_NIGHT_MEMORY_ITEM_ID]).toBe(1);

    quests.destroy();
  });

  it('runs Nova and Clover’s untimed route in landmark order without using RaceScene', () => {
    const { saveService, quests, story } = createHarness();
    completePrerequisite(saveService, NOVA_FIRST_RACE_QUEST_ID);

    expect(story.inspectCloverRouteCard().changed).toBe(true);
    expect(quests.getProgress(NOVA_NO_FINISH_LINE_QUEST_ID).currentStepId).toBe(
      getQuestStepId(NOVA_NO_FINISH_LINE_QUEST_ID, 0),
    );

    quests.notifyCharacterTalked('character:nova');
    expect(story.visitNoFinishLandmark('windmill').changed).toBe(false);
    expect(story.visitNoFinishLandmark('pond').changed).toBe(true);
    expect(story.visitNoFinishLandmark('picnic').changed).toBe(true);
    expect(story.visitNoFinishLandmark('windmill').changed).toBe(true);
    expect(quests.getProgress(NOVA_NO_FINISH_LINE_QUEST_ID).currentStepId).toBe(
      getQuestStepId(NOVA_NO_FINISH_LINE_QUEST_ID, 4),
    );

    quests.notifyCharacterTalked('character:nova');
    expect(quests.getProgress(NOVA_NO_FINISH_LINE_QUEST_ID).status).toBe('completed');
    expect(saveService.load()?.world.flags[NOVA_NO_FINISH_LINE_COMPLETE_FLAG]).toBe(true);
    expect(saveService.load()?.inventory.itemQuantities[FRIENDSHIP_ROUTE_PENNANT_ITEM_ID]).toBe(1);

    quests.destroy();
  });

  it('links Pebble’s odd stone from Crystal Brook to the Story House and back', () => {
    const { saveService, quests, story } = createHarness();

    expect(story.inspectOddStone().changed).toBe(true);
    expect(quests.getProgress(PEBBLE_ODD_STONE_QUEST_ID).currentStepId).toBe(
      getQuestStepId(PEBBLE_ODD_STONE_QUEST_ID, 1),
    );

    expect(story.studyOddStoneAtStoryHouse().changed).toBe(false);
    quests.notifyCharacterTalked('character:pebble');
    expect(story.studyOddStoneAtStoryHouse().changed).toBe(true);
    expect(story.matchOddStoneReflection().changed).toBe(true);
    quests.notifyCharacterTalked('character:pebble');

    expect(quests.getProgress(PEBBLE_ODD_STONE_QUEST_ID).status).toBe('completed');
    expect(saveService.load()?.world.flags[PEBBLE_ODD_STONE_COMPLETE_FLAG]).toBe(true);
    expect(saveService.load()?.inventory.itemQuantities[ODD_STONE_BOOKEND_ITEM_ID]).toBe(1);

    quests.destroy();
  });

  it('keeps Juniper and Maple microstories lightweight and non-sequential', () => {
    const { saveService, quests, story } = createHarness();
    completePrerequisite(saveService, MAPLE_CAKE_QUEST_ID);

    expect(story.playJuniperButterflyCount().changed).toBe(true);
    expect(story.tryMaplePicnicSpot().changed).toBe(true);

    expect(quests.getProgress(JUNIPER_BUTTERFLY_COUNT_QUEST_ID).status).toBe('completed');
    expect(quests.getProgress(MAPLE_PICNIC_SPOT_QUEST_ID).status).toBe('completed');
    expect(saveService.load()?.world.flags[JUNIPER_BUTTERFLY_COUNT_COMPLETE_FLAG]).toBe(true);
    expect(saveService.load()?.world.flags[MAPLE_PICNIC_SPOT_COMPLETE_FLAG]).toBe(true);
    expect(saveService.load()?.collections.discoveryIds).toContain(
      JUNIPER_BUTTERFLY_COUNT_DISCOVERY_ID,
    );
    expect(saveService.load()?.collections.discoveryIds).toContain(MAPLE_PICNIC_SPOT_DISCOVERY_ID);

    quests.destroy();
  });
});
