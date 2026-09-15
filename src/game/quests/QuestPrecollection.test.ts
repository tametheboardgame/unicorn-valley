import { describe, expect, it } from 'vitest';
import { WILLOW_MOONFLOWERS_QUEST_ID } from '../../content/r2Quests';
import { TypedEventBus, type GameEventMap } from '../events/GameEventBus';
import { InventoryService } from '../inventory/InventoryService';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { QuestEngine } from './QuestEngine';

class MemorySaveRepository implements SaveRepository {
  private value: string | null = null;

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

describe('QuestEngine pre-collected items', () => {
  it('recognises Willow Moonflowers collected before the quest begins', () => {
    const bus = new TypedEventBus<GameEventMap>();
    const save = new SaveService(new MemorySaveRepository(), bus);
    const inventory = new InventoryService(save, bus);
    const quests = new QuestEngine(save, bus);

    inventory.addItem('item:willow-moonflower', 3);
    expect(quests.startQuest(WILLOW_MOONFLOWERS_QUEST_ID)).toMatchObject({
      status: 'active',
      currentStepId: 'quest-step:willows-moonflowers:0',
    });

    quests.notifyCharacterTalked('character:willow');

    expect(quests.getCurrentObjective(WILLOW_MOONFLOWERS_QUEST_ID)?.label).toBe('Talk to Willow');
    expect(inventory.getQuantity('item:willow-moonflower')).toBe(3);

    quests.notifyCharacterTalked('character:willow');

    expect(quests.getProgress(WILLOW_MOONFLOWERS_QUEST_ID).status).toBe('completed');
    expect(inventory.getQuantity('item:willow-moonflower')).toBe(0);
    expect(inventory.getQuantity('item:moonflower-lantern')).toBe(1);
    quests.destroy();
  });

  it('keeps partial pre-collected quantities and waits for the remainder', () => {
    const bus = new TypedEventBus<GameEventMap>();
    const save = new SaveService(new MemorySaveRepository(), bus);
    const inventory = new InventoryService(save, bus);
    const quests = new QuestEngine(save, bus);

    inventory.addItem('item:willow-moonflower', 2);
    quests.startQuest(WILLOW_MOONFLOWERS_QUEST_ID);
    quests.notifyCharacterTalked('character:willow');

    expect(quests.getCurrentObjective(WILLOW_MOONFLOWERS_QUEST_ID)?.label).toBe(
      'Find 3 Moonflowers',
    );

    inventory.addItem('item:willow-moonflower');
    expect(quests.getCurrentObjective(WILLOW_MOONFLOWERS_QUEST_ID)?.label).toBe('Talk to Willow');
    quests.destroy();
  });
});
