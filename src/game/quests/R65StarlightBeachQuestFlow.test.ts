import { describe, expect, it } from 'vitest';
import {
  BEACH_RACE_ROUTE_READY_FLAG,
  BEACHCOMBING_READY_FLAG,
  CORAL_CHARACTER_ID,
  CORAL_SHELL_STORIES_ACTIVE_FLAG,
  CORAL_SHELL_STORIES_COMPLETE_FLAG,
  CORAL_SHELL_STORIES_QUEST_ID,
  DUNE_WIND_MARKER_DISCOVERY_ID,
  MOONLIT_BREEZE_DISCOVERY_ID,
  MOON_SPECKLE_SHELL_ITEM_ID,
  SHELL_STORY_CARD_ITEM_ID,
  SHELL_STORY_CIRCLE_DISCOVERY_ID,
  SKIPPER_CHARACTER_ID,
  SKIPPER_FOLLOW_THE_WIND_QUEST_ID,
  SKIPPER_WIND_STORY_ACTIVE_FLAG,
  STAR_KITE_ROUTE_CARD_ITEM_ID,
  SUNRISE_SPIRAL_SHELL_ITEM_ID,
  WAVE_FAN_SHELL_ITEM_ID,
} from '../../content/r65StarlightBeach';
import { DiscoveryService } from '../discovery/DiscoveryService';
import { type GameEventMap, TypedEventBus } from '../events/GameEventBus';
import { InventoryService } from '../inventory/InventoryService';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { createDefaultSave } from '../save/createDefaultSave';
import { QuestEngine, getQuestStepId } from './QuestEngine';

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
    quests: new QuestEngine(saveService, events, () => '2026-09-03T12:00:00.000Z'),
    discoveries: new DiscoveryService(saveService, events),
    inventory: new InventoryService(saveService, events),
  };
}

describe('R6.5 Starlight Beach story flow', () => {
  it('completes Coral’s shell story without consuming the finite Starlight Shell collection', () => {
    const harness = createHarness();
    const { quests, discoveries, inventory, saveService } = harness;

    quests.startQuest(CORAL_SHELL_STORIES_QUEST_ID);
    quests.notifyCharacterTalked(CORAL_CHARACTER_ID);
    expect(saveService.load()?.world.flags[CORAL_SHELL_STORIES_ACTIVE_FLAG]).toBe(true);
    expect(quests.getProgress(CORAL_SHELL_STORIES_QUEST_ID).currentStepId).toBe(
      getQuestStepId(CORAL_SHELL_STORIES_QUEST_ID, 2),
    );

    inventory.addItem(SUNRISE_SPIRAL_SHELL_ITEM_ID);
    inventory.addItem(MOON_SPECKLE_SHELL_ITEM_ID);
    inventory.addItem(WAVE_FAN_SHELL_ITEM_ID);
    discoveries.unlockDiscovery(SHELL_STORY_CIRCLE_DISCOVERY_ID);
    expect(quests.getProgress(CORAL_SHELL_STORIES_QUEST_ID).currentStepId).toBe(
      getQuestStepId(CORAL_SHELL_STORIES_QUEST_ID, 3),
    );

    quests.notifyCharacterTalked(CORAL_CHARACTER_ID);
    expect(quests.getProgress(CORAL_SHELL_STORIES_QUEST_ID).status).toBe('completed');
    expect(saveService.load()?.world.flags[CORAL_SHELL_STORIES_ACTIVE_FLAG]).toBe(false);
    expect(saveService.load()?.world.flags[CORAL_SHELL_STORIES_COMPLETE_FLAG]).toBe(true);
    expect(saveService.load()?.world.flags[BEACHCOMBING_READY_FLAG]).toBe(true);
    expect(inventory.getQuantity(SUNRISE_SPIRAL_SHELL_ITEM_ID)).toBe(1);
    expect(inventory.getQuantity(MOON_SPECKLE_SHELL_ITEM_ID)).toBe(1);
    expect(inventory.getQuantity(WAVE_FAN_SHELL_ITEM_ID)).toBe(1);
    expect(inventory.getQuantity(SHELL_STORY_CARD_ITEM_ID)).toBe(1);
    expect(
      saveService.load()?.relationships.byCharacterId[CORAL_CHARACTER_ID]?.friendshipPoints,
    ).toBe(12);

    quests.destroy();
  });

  it('completes Skipper’s ordered wind clues and leaves the later race hook ready', () => {
    const harness = createHarness();
    const { quests, discoveries, inventory, saveService } = harness;

    quests.startQuest(SKIPPER_FOLLOW_THE_WIND_QUEST_ID);
    quests.notifyCharacterTalked(SKIPPER_CHARACTER_ID);
    expect(saveService.load()?.world.flags[SKIPPER_WIND_STORY_ACTIVE_FLAG]).toBe(true);
    expect(quests.getProgress(SKIPPER_FOLLOW_THE_WIND_QUEST_ID).currentStepId).toBe(
      getQuestStepId(SKIPPER_FOLLOW_THE_WIND_QUEST_ID, 2),
    );

    discoveries.unlockDiscovery(DUNE_WIND_MARKER_DISCOVERY_ID);
    expect(quests.getProgress(SKIPPER_FOLLOW_THE_WIND_QUEST_ID).currentStepId).toBe(
      getQuestStepId(SKIPPER_FOLLOW_THE_WIND_QUEST_ID, 3),
    );
    discoveries.unlockDiscovery(MOONLIT_BREEZE_DISCOVERY_ID);
    expect(quests.getProgress(SKIPPER_FOLLOW_THE_WIND_QUEST_ID).currentStepId).toBe(
      getQuestStepId(SKIPPER_FOLLOW_THE_WIND_QUEST_ID, 4),
    );

    quests.notifyCharacterTalked(SKIPPER_CHARACTER_ID);
    expect(quests.getProgress(SKIPPER_FOLLOW_THE_WIND_QUEST_ID).status).toBe('completed');
    expect(saveService.load()?.world.flags[SKIPPER_WIND_STORY_ACTIVE_FLAG]).toBe(false);
    expect(saveService.load()?.world.flags[BEACH_RACE_ROUTE_READY_FLAG]).toBe(true);
    expect(inventory.getQuantity(STAR_KITE_ROUTE_CARD_ITEM_ID)).toBe(1);
    expect(
      saveService.load()?.relationships.byCharacterId[SKIPPER_CHARACTER_ID]?.friendshipPoints,
    ).toBe(12);

    quests.destroy();
  });
});
