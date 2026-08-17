import { describe, expect, it } from 'vitest';
import { WILLOW_GARDEN_PLANTED_FLAG, WILLOW_MOONFLOWERS_QUEST_ID } from '../../content/r2Quests';
import { TypedEventBus, type GameEventMap } from '../events/GameEventBus';
import { InventoryService } from '../inventory/InventoryService';
import { RelationshipService } from '../relationships/RelationshipService';
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

describe('QuestEngine', () => {
  it('progresses a data quest through events, reloads, rewards and world effects', () => {
    const repository = new MemorySaveRepository();
    const firstBus = new TypedEventBus<GameEventMap>();
    const firstSaveService = new SaveService(
      repository,
      firstBus,
      () => '2026-08-17T10:00:00.000Z',
    );
    const firstEngine = new QuestEngine(
      firstSaveService,
      firstBus,
      () => '2026-08-17T10:00:00.000Z',
    );

    expect(firstEngine.startQuest('quest:engine-demo')).toMatchObject({
      status: 'active',
      currentStepId: 'quest-step:engine-demo:0',
    });
    expect(firstEngine.getCurrentObjective('quest:engine-demo')?.label).toBe('Talk to Pip');

    firstEngine.notifyCharacterTalked('character:pip');
    expect(firstEngine.getCurrentObjective('quest:engine-demo')?.label).toBe('Find 2 Berry Buns');
    firstEngine.destroy();

    const secondBus = new TypedEventBus<GameEventMap>();
    const secondSaveService = new SaveService(
      repository,
      secondBus,
      () => '2026-08-17T10:05:00.000Z',
    );
    const reloadedEngine = new QuestEngine(
      secondSaveService,
      secondBus,
      () => '2026-08-17T10:05:00.000Z',
    );
    const inventory = new InventoryService(secondSaveService, secondBus);
    const completed: string[] = [];
    secondBus.on('QUEST_COMPLETED', ({ questId }) => completed.push(questId));

    expect(reloadedEngine.getCurrentObjective('quest:engine-demo')?.label).toBe(
      'Find 2 Berry Buns',
    );
    inventory.addItem('item:berry-bun');
    expect(reloadedEngine.getProgress('quest:engine-demo').status).toBe('active');
    inventory.addItem('item:berry-bun');

    expect(reloadedEngine.getProgress('quest:engine-demo')).toEqual({
      status: 'completed',
      currentStepId: null,
      completedAt: '2026-08-17T10:05:00.000Z',
    });
    expect(inventory.getQuantity('item:sunbeam-cushion')).toBe(1);
    expect(secondSaveService.load()?.world.flags['flag:quest-engine-demo-complete']).toBe(true);
    expect(completed).toEqual(['quest:engine-demo']);
    reloadedEngine.destroy();
  });

  it('does not restart a completed quest or duplicate rewards', () => {
    const repository = new MemorySaveRepository();
    const bus = new TypedEventBus<GameEventMap>();
    const saveService = new SaveService(repository, bus);
    const engine = new QuestEngine(saveService, bus);
    const inventory = new InventoryService(saveService, bus);

    engine.startQuest('quest:engine-demo');
    engine.notifyCharacterTalked('character:pip');
    inventory.addItem('item:berry-bun', 2);
    expect(engine.getProgress('quest:engine-demo').status).toBe('completed');
    expect(inventory.getQuantity('item:sunbeam-cushion')).toBe(1);

    engine.startQuest('quest:engine-demo');
    expect(inventory.getQuantity('item:sunbeam-cushion')).toBe(1);
    engine.destroy();
  });

  it("completes Willow's Moonflowers through data-driven consumption, reward and friendship", () => {
    const repository = new MemorySaveRepository();
    const bus = new TypedEventBus<GameEventMap>();
    const saveService = new SaveService(repository, bus, () => '2026-08-17T11:30:00.000Z');
    const engine = new QuestEngine(saveService, bus, () => '2026-08-17T11:30:00.000Z');
    const inventory = new InventoryService(saveService, bus);
    const relationships = new RelationshipService(saveService, bus);

    engine.startQuest(WILLOW_MOONFLOWERS_QUEST_ID);
    expect(engine.getCurrentObjective(WILLOW_MOONFLOWERS_QUEST_ID)?.label).toBe('Talk to Willow');

    engine.notifyCharacterTalked('character:willow');
    expect(engine.getCurrentObjective(WILLOW_MOONFLOWERS_QUEST_ID)?.label).toBe(
      'Find 3 Moonflowers',
    );

    inventory.addItem('item:willow-moonflower', 3);
    expect(inventory.getQuantity('item:willow-moonflower')).toBe(3);
    expect(engine.getCurrentObjective(WILLOW_MOONFLOWERS_QUEST_ID)?.label).toBe('Talk to Willow');

    engine.notifyCharacterTalked('character:willow');

    expect(engine.getProgress(WILLOW_MOONFLOWERS_QUEST_ID)).toEqual({
      status: 'completed',
      currentStepId: null,
      completedAt: '2026-08-17T11:30:00.000Z',
    });
    expect(inventory.getQuantity('item:willow-moonflower')).toBe(0);
    expect(inventory.getQuantity('item:moonflower-lantern')).toBe(1);
    expect(relationships.getRelationship('character:willow').friendshipPoints).toBe(5);
    expect(relationships.getTier('character:willow')).toBe('friend');
    expect(saveService.load()?.world.flags[WILLOW_GARDEN_PLANTED_FLAG]).toBe(true);

    engine.destroy();

    const reloadBus = new TypedEventBus<GameEventMap>();
    const reloadSaveService = new SaveService(repository, reloadBus);
    const reloadedEngine = new QuestEngine(reloadSaveService, reloadBus);
    const reloadedInventory = new InventoryService(reloadSaveService, reloadBus);
    const reloadedRelationships = new RelationshipService(reloadSaveService, reloadBus);

    expect(reloadedEngine.getProgress(WILLOW_MOONFLOWERS_QUEST_ID).status).toBe('completed');
    expect(reloadedInventory.getQuantity('item:moonflower-lantern')).toBe(1);
    expect(reloadedRelationships.getTier('character:willow')).toBe('friend');
    expect(reloadSaveService.load()?.world.flags[WILLOW_GARDEN_PLANTED_FLAG]).toBe(true);

    reloadedEngine.startQuest(WILLOW_MOONFLOWERS_QUEST_ID);
    expect(reloadedInventory.getQuantity('item:moonflower-lantern')).toBe(1);
    reloadedEngine.destroy();
  });
});
