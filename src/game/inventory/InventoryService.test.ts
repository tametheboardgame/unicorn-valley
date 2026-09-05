import { describe, expect, it } from 'vitest';
import type { ItemId } from '../../content/contentTypes';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { InventoryService, getItemPresentation } from './InventoryService';

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

describe('InventoryService', () => {
  it('adds quantities cumulatively and persists them across service reloads', () => {
    const repository = new MemorySaveRepository();
    const saveService = new SaveService(repository);
    const inventory = new InventoryService(saveService);

    expect(inventory.addItem('item:berry-bun', 2)).toBe(2);
    expect(inventory.addItem('item:berry-bun')).toBe(3);

    const reloaded = new InventoryService(new SaveService(repository));
    expect(reloaded.getQuantity('item:berry-bun')).toBe(3);
    expect(reloaded.hasItem('item:berry-bun', 3)).toBe(true);
  });

  it('removes quantities and deletes empty stacks', () => {
    const repository = new MemorySaveRepository();
    const inventory = new InventoryService(new SaveService(repository));
    inventory.addItem('item:berry-bun', 3);

    expect(inventory.removeItem('item:berry-bun', 2)).toBe(true);
    expect(inventory.getQuantity('item:berry-bun')).toBe(1);
    expect(inventory.removeItem('item:berry-bun')).toBe(true);
    expect(inventory.getQuantity('item:berry-bun')).toBe(0);
  });

  it('fails safely when a stack is too small', () => {
    const inventory = new InventoryService(new SaveService(new MemorySaveRepository()));
    inventory.addItem('item:berry-bun');

    expect(inventory.removeItem('item:berry-bun', 2)).toBe(false);
    expect(inventory.getQuantity('item:berry-bun')).toBe(1);
  });

  it('protects quest-critical items unless an explicit quest path overrides it', () => {
    const inventory = new InventoryService(new SaveService(new MemorySaveRepository()));
    inventory.addItem('item:willow-moonflower');

    expect(() => inventory.removeItem('item:willow-moonflower')).toThrow(
      'Quest-critical item cannot be removed directly',
    );
    expect(inventory.removeItem('item:willow-moonflower', 1, { allowQuestCritical: true })).toBe(
      true,
    );
  });

  it('rejects invalid item IDs and invalid quantities', () => {
    const inventory = new InventoryService(new SaveService(new MemorySaveRepository()));

    expect(() => inventory.addItem('item:not-real' as ItemId)).toThrow('Unknown item ID');
    expect(() => inventory.addItem('item:berry-bun', 0)).toThrow('positive integer');
    expect(() => inventory.hasItem('item:berry-bun', 1.5)).toThrow('positive integer');
  });

  it('lists owned items with stable presentation fallbacks for legacy definitions', () => {
    const inventory = new InventoryService(new SaveService(new MemorySaveRepository()));
    inventory.addItem('item:sparkle-berry', 2);
    inventory.addItem('item:berry-bun');

    expect(
      inventory.listOwnedItems().map(({ definition, quantity }) => [definition.id, quantity]),
    ).toEqual([
      ['item:berry-bun', 1],
      ['item:sparkle-berry', 2],
    ]);
    expect(
      getItemPresentation({
        id: 'item:legacy-test',
        name: 'Legacy Test',
      }),
    ).toEqual({
      icon: '✨',
      category: 'collectable',
      description: 'A little treasure from Unicorn Valley.',
    });
  });

  it('ignores retired item IDs when a long-running save is opened in the Bag', () => {
    const repository = new MemorySaveRepository();
    const saveService = new SaveService(repository);
    const save = saveService.createNewGame();
    saveService.save({
      ...save,
      inventory: {
        ...save.inventory,
        itemQuantities: {
          ...save.inventory.itemQuantities,
          'item:retired-from-old-build': 1,
          'item:berry-bun': 2,
        },
      },
    });

    const inventory = new InventoryService(saveService);
    expect(
      inventory.listOwnedItems().map(({ definition, quantity }) => [definition.id, quantity]),
    ).toEqual([['item:berry-bun', 2]]);
  });
});
