import { describe, expect, it } from 'vitest';
import type { ItemDefinition } from '../../content/contentTypes';
import type { OwnedInventoryItem } from './InventoryService';
import {
  BAG_POCKETS,
  getBagPocketForItem,
  getFirstPopulatedBagPocket,
  groupBagItems,
  isUsableFood,
} from './BagInventoryModel';

function owned(definition: ItemDefinition, quantity = 1): OwnedInventoryItem {
  return { definition, quantity };
}

describe('BagInventoryModel', () => {
  it('uses the approved four child-readable pockets', () => {
    expect(BAG_POCKETS.map((pocket) => pocket.id)).toEqual([
      'food',
      'quest',
      'decor',
      'keepsakes',
    ]);
  });

  it('normalises all existing item categories into those pockets', () => {
    expect(getBagPocketForItem({ id: 'item:food', name: 'Food', category: 'food' })).toBe('food');
    expect(getBagPocketForItem({ id: 'item:quest', name: 'Quest', category: 'quest' })).toBe(
      'quest',
    );
    expect(
      getBagPocketForItem({ id: 'item:decor', name: 'Decor', category: 'decoration' }),
    ).toBe('decor');
    expect(
      getBagPocketForItem({ id: 'item:accessory', name: 'Accessory', category: 'accessory' }),
    ).toBe('keepsakes');
    expect(
      getBagPocketForItem({ id: 'item:reward', name: 'Reward', category: 'reward' }),
    ).toBe('keepsakes');
    expect(getBagPocketForItem({ id: 'item:legacy', name: 'Legacy' })).toBe('keepsakes');
  });

  it('groups inventories substantially larger than six without dropping entries', () => {
    const items = Array.from({ length: 18 }, (_, index) =>
      owned({
        id: `item:test-${index}`,
        name: `Test ${index}`,
        category: index % 3 === 0 ? 'food' : index % 3 === 1 ? 'decoration' : 'collectable',
      }),
    );

    const grouped = groupBagItems(items);
    expect(Object.values(grouped).flat()).toHaveLength(18);
    expect(grouped.food).toHaveLength(6);
    expect(grouped.decor).toHaveLength(6);
    expect(grouped.keepsakes).toHaveLength(6);
  });

  it('chooses the first populated pocket and protects quest-critical items from food use', () => {
    const grouped = groupBagItems([
      owned({ id: 'item:decor', name: 'Decor', category: 'decoration' }),
    ]);
    expect(getFirstPopulatedBagPocket(grouped)).toBe('decor');
    expect(isUsableFood({ id: 'item:bun', name: 'Bun', category: 'food' })).toBe(true);
    expect(
      isUsableFood({ id: 'item:quest-food', name: 'Quest Food', category: 'food', questCritical: true }),
    ).toBe(false);
    expect(isUsableFood({ id: 'item:quest', name: 'Quest', category: 'quest' })).toBe(false);
  });
});
