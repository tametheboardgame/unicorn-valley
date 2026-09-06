import type { ItemCategory, ItemDefinition } from '../../content/contentTypes';
import type { OwnedInventoryItem } from './InventoryService';

export type BagPocketId = 'food' | 'quest' | 'decor' | 'keepsakes';

export interface BagPocketDefinition {
  id: BagPocketId;
  label: string;
  icon: string;
}

export const BAG_POCKETS = [
  { id: 'food', label: 'Food', icon: '🥐' },
  { id: 'quest', label: 'Quest', icon: '📜' },
  { id: 'decor', label: 'Decor', icon: '🏡' },
  { id: 'keepsakes', label: 'Keepsakes', icon: '✨' },
] as const satisfies readonly BagPocketDefinition[];

const CATEGORY_TO_POCKET: Readonly<Record<ItemCategory, BagPocketId>> = {
  food: 'food',
  quest: 'quest',
  decoration: 'decor',
  accessory: 'keepsakes',
  collectable: 'keepsakes',
  reward: 'keepsakes',
};

export function getBagPocketForItem(item: ItemDefinition): BagPocketId {
  return CATEGORY_TO_POCKET[item.category ?? 'collectable'];
}

export function groupBagItems(
  items: readonly OwnedInventoryItem[],
): Readonly<Record<BagPocketId, readonly OwnedInventoryItem[]>> {
  const grouped: Record<BagPocketId, OwnedInventoryItem[]> = {
    food: [],
    quest: [],
    decor: [],
    keepsakes: [],
  };

  for (const item of items) {
    grouped[getBagPocketForItem(item.definition)].push(item);
  }

  return grouped;
}

export function getFirstPopulatedBagPocket(
  grouped: Readonly<Record<BagPocketId, readonly OwnedInventoryItem[]>>,
): BagPocketId {
  return BAG_POCKETS.find((pocket) => grouped[pocket.id].length > 0)?.id ?? 'food';
}

export function isUsableFood(item: ItemDefinition): boolean {
  return item.category === 'food' && item.questCritical !== true;
}
