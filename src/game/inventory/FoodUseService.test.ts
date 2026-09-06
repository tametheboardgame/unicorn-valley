import { beforeEach, describe, expect, it } from 'vitest';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { clearExplorationSnackBoost } from '../input/ExplorationGallop';
import { FoodUseService } from './FoodUseService';
import { InventoryService } from './InventoryService';

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

describe('FoodUseService', () => {
  beforeEach(() => {
    clearExplorationSnackBoost();
  });

  it('consumes one owned food item and persists the reduced quantity', () => {
    const repository = new MemorySaveRepository();
    const inventory = new InventoryService(new SaveService(repository));
    inventory.addItem('item:berry-bun', 2);
    const service = new FoodUseService(inventory);

    const result = service.use('item:berry-bun', 10_000);

    expect(result).toEqual({
      status: 'used',
      itemId: 'item:berry-bun',
      itemName: 'Berry Bun',
      remainingQuantity: 1,
      boostSecondsRemaining: 45,
    });
    expect(new InventoryService(new SaveService(repository)).getQuantity('item:berry-bun')).toBe(1);
  });

  it('does not consume another item while the bounded boost is already active', () => {
    const inventory = new InventoryService(new SaveService(new MemorySaveRepository()));
    inventory.addItem('item:berry-bun', 2);
    const service = new FoodUseService(inventory);

    expect(service.use('item:berry-bun', 20_000).status).toBe('used');
    const second = service.use('item:berry-bun', 30_000);

    expect(second.status).toBe('boost-active');
    expect(second.remainingQuantity).toBe(1);
    expect(second.boostSecondsRemaining).toBe(35);
    expect(inventory.getQuantity('item:berry-bun')).toBe(1);
  });

  it('cannot consume quest or non-food items through the food action', () => {
    const inventory = new InventoryService(new SaveService(new MemorySaveRepository()));
    inventory.addItem('item:willow-moonflower');
    inventory.addItem('item:sunbeam-cushion');
    const service = new FoodUseService(inventory);

    expect(service.use('item:willow-moonflower', 1_000).status).toBe('not-food');
    expect(service.use('item:sunbeam-cushion', 1_000).status).toBe('not-food');
    expect(inventory.getQuantity('item:willow-moonflower')).toBe(1);
    expect(inventory.getQuantity('item:sunbeam-cushion')).toBe(1);
  });

  it('does not invent ownership when a food stack is empty', () => {
    const inventory = new InventoryService(new SaveService(new MemorySaveRepository()));
    const service = new FoodUseService(inventory);

    expect(service.use('item:berry-bun', 1_000)).toMatchObject({
      status: 'not-owned',
      remainingQuantity: 0,
    });
  });
});
