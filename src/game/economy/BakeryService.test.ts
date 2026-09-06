import { describe, expect, it } from 'vitest';
import { MAPLE_CAKE_QUEST_ID, SUNBEAM_PICNIC_BASKET_ITEM_ID } from '../../content/r6VillageContent';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { createDefaultSave } from '../save/createDefaultSave';
import { BakeryService } from './BakeryService';
import { ShimmerEconomyService } from './ShimmerEconomyService';

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

function completedQuest() {
  return {
    status: 'completed' as const,
    currentStepId: null,
    completedAt: '2026-09-02T14:00:00.000Z',
  };
}

describe('Sunbeam Bakery service', () => {
  it('keeps a cheap repeatable bun available while progression-locking the picnic basket', () => {
    const saveService = new SaveService(new MemorySaveRepository());
    saveService.save(createDefaultSave());
    const stock = new Map(
      new BakeryService(saveService).listStock().map((entry) => [entry.definition.id, entry]),
    );

    expect(stock.get('item:berry-bun')?.price).toBe(1);
    expect(stock.get('item:berry-bun')?.isUnlocked).toBe(true);
    expect(stock.get(SUNBEAM_PICNIC_BASKET_ITEM_ID)?.isUnlocked).toBe(false);
  });

  it('supports repeat bun purchases with persistent visible ownership and clear Shimmer spend', () => {
    const saveService = new SaveService(new MemorySaveRepository());
    saveService.save(createDefaultSave());
    const economy = new ShimmerEconomyService(saveService);
    economy.earn(3);
    const bakery = new BakeryService(saveService);

    const first = bakery.purchase('item:berry-bun');
    expect(first).toMatchObject({ type: 'purchased', price: 1, balance: 2, ownedQuantity: 1 });
    expect(
      bakery.listStock().find(({ definition }) => definition.id === 'item:berry-bun'),
    ).toMatchObject({ ownedQuantity: 1, definition: { name: 'Berry Bun ×1' } });

    const second = bakery.purchase('item:berry-bun');
    expect(second).toMatchObject({ type: 'purchased', price: 1, balance: 1, ownedQuantity: 2 });
    expect(
      bakery.listStock().find(({ definition }) => definition.id === 'item:berry-bun'),
    ).toMatchObject({ ownedQuantity: 2, definition: { name: 'Berry Bun ×2' } });
    expect(saveService.load()?.inventory.itemQuantities['item:berry-bun']).toBe(2);
    expect(economy.getBalance()).toBe(1);
  });

  it('unlocks a unique picnic-basket decoration after Maple and adds it to home ownership', () => {
    const saveService = new SaveService(new MemorySaveRepository());
    const save = createDefaultSave();
    save.quests.byQuestId[MAPLE_CAKE_QUEST_ID] = completedQuest();
    saveService.save(save);
    const economy = new ShimmerEconomyService(saveService);
    economy.earn(5);
    const bakery = new BakeryService(saveService);

    const first = bakery.purchase(SUNBEAM_PICNIC_BASKET_ITEM_ID);
    expect(first.type).toBe('purchased');
    expect(saveService.load()?.home.ownedFurnitureIds).toContain(SUNBEAM_PICNIC_BASKET_ITEM_ID);
    expect(bakery.purchase(SUNBEAM_PICNIC_BASKET_ITEM_ID).type).toBe('already-owned');
    expect(economy.getBalance()).toBe(1);
  });

  it('never charges when the player cannot afford an item', () => {
    const saveService = new SaveService(new MemorySaveRepository());
    saveService.save(createDefaultSave());
    const result = new BakeryService(saveService).purchase('item:berry-bun');

    expect(result.type).toBe('insufficient-funds');
    expect(saveService.load()?.inventory.itemQuantities['item:berry-bun'] ?? 0).toBe(0);
  });
});
