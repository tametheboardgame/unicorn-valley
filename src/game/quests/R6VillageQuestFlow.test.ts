import { describe, expect, it } from 'vitest';
import {
  MAPLE_CAKE_QUEST_ID,
  MAPLE_CAKE_READY_FLAG,
  MAPLE_CHARACTER_ID,
  TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID,
  TANSY_MAP_HUNT_ACTIVE_FLAG,
  TANSY_MAP_QUEST_ID,
  TANSY_MAP_RESTORED_FLAG,
  TANSY_NOTICE_MAP_CORNER_DISCOVERY_ID,
  TANSY_SUNDIAL_MAP_CORNER_DISCOVERY_ID,
  TANSY_CHARACTER_ID,
  WOBBLY_CAKE_ITEM_ID,
} from '../../content/r6VillageContent';
import { DiscoveryService } from '../discovery/DiscoveryService';
import { type GameEventMap, TypedEventBus } from '../events/GameEventBus';
import { InventoryService } from '../inventory/InventoryService';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { createDefaultSave } from '../save/createDefaultSave';
import { getQuestStepId, QuestEngine } from './QuestEngine';

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
  saveService.save(createDefaultSave());
  const events = new TypedEventBus<GameEventMap>();
  return {
    saveService,
    events,
    quests: new QuestEngine(saveService, events, () => '2026-09-02T14:00:00.000Z'),
    discoveries: new DiscoveryService(saveService, events),
    inventory: new InventoryService(saveService, events),
  };
}

describe('R6.5 Village story flow', () => {
  it('runs Tansy’s three map clues through standard discovery events and leaves a persistent repaired state', () => {
    const harness = createHarness();
    const { quests, discoveries, saveService } = harness;

    expect(quests.startQuest(TANSY_MAP_QUEST_ID).currentStepId).toBe(
      getQuestStepId(TANSY_MAP_QUEST_ID, 0),
    );
    quests.notifyCharacterTalked(TANSY_CHARACTER_ID);
    expect(saveService.load()?.world.flags[TANSY_MAP_HUNT_ACTIVE_FLAG]).toBe(true);
    expect(quests.getProgress(TANSY_MAP_QUEST_ID).currentStepId).toBe(
      getQuestStepId(TANSY_MAP_QUEST_ID, 2),
    );

    discoveries.unlockDiscovery(TANSY_NOTICE_MAP_CORNER_DISCOVERY_ID);
    expect(quests.getProgress(TANSY_MAP_QUEST_ID).currentStepId).toBe(
      getQuestStepId(TANSY_MAP_QUEST_ID, 3),
    );
    discoveries.unlockDiscovery(TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID);
    expect(quests.getProgress(TANSY_MAP_QUEST_ID).currentStepId).toBe(
      getQuestStepId(TANSY_MAP_QUEST_ID, 4),
    );
    discoveries.unlockDiscovery(TANSY_SUNDIAL_MAP_CORNER_DISCOVERY_ID);
    expect(quests.getProgress(TANSY_MAP_QUEST_ID).currentStepId).toBe(
      getQuestStepId(TANSY_MAP_QUEST_ID, 5),
    );

    quests.notifyCharacterTalked(TANSY_CHARACTER_ID);
    expect(quests.getProgress(TANSY_MAP_QUEST_ID).status).toBe('completed');
    expect(saveService.load()?.world.flags[TANSY_MAP_HUNT_ACTIVE_FLAG]).toBe(false);
    expect(saveService.load()?.world.flags[TANSY_MAP_RESTORED_FLAG]).toBe(true);
    expect(
      saveService.load()?.relationships.byCharacterId[TANSY_CHARACTER_ID]?.friendshipPoints,
    ).toBe(12);

    quests.destroy();
  });

  it('runs Maple’s cake design through normal inventory events, consumes the quest cake and persists the social result', () => {
    const harness = createHarness();
    const { quests, inventory, saveService } = harness;

    quests.startQuest(MAPLE_CAKE_QUEST_ID);
    quests.notifyCharacterTalked(MAPLE_CHARACTER_ID);
    expect(quests.getProgress(MAPLE_CAKE_QUEST_ID).currentStepId).toBe(
      getQuestStepId(MAPLE_CAKE_QUEST_ID, 1),
    );

    inventory.addItem(WOBBLY_CAKE_ITEM_ID, 1);
    expect(inventory.getQuantity(WOBBLY_CAKE_ITEM_ID)).toBe(0);
    expect(saveService.load()?.world.flags[MAPLE_CAKE_READY_FLAG]).toBe(true);
    expect(quests.getProgress(MAPLE_CAKE_QUEST_ID).currentStepId).toBe(
      getQuestStepId(MAPLE_CAKE_QUEST_ID, 4),
    );

    quests.notifyCharacterTalked(MAPLE_CHARACTER_ID);
    expect(quests.getProgress(MAPLE_CAKE_QUEST_ID).status).toBe('completed');
    expect(
      saveService.load()?.relationships.byCharacterId[MAPLE_CHARACTER_ID]?.friendshipPoints,
    ).toBe(12);

    quests.destroy();
  });
});
