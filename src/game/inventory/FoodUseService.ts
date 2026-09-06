import { itemRegistry } from '../../content/registries';
import type { ItemId } from '../../content/contentTypes';
import {
  activateExplorationSnackBoost,
  getExplorationSnackBoostRemainingSeconds,
  isExplorationSnackBoostActive,
} from '../input/ExplorationGallop';
import { isUsableFood } from './BagInventoryModel';
import type { InventoryService } from './InventoryService';

export type FoodUseStatus = 'used' | 'not-owned' | 'not-food' | 'boost-active';

export interface FoodUseResult {
  status: FoodUseStatus;
  itemId: ItemId;
  itemName: string;
  remainingQuantity: number;
  boostSecondsRemaining: number;
}

export class FoodUseService {
  public constructor(private readonly inventory: InventoryService) {}

  public use(itemId: ItemId, now = Date.now()): FoodUseResult {
    const definition = itemRegistry.get(itemId);
    const currentQuantity = this.inventory.getQuantity(itemId);

    if (!isUsableFood(definition)) {
      return {
        status: 'not-food',
        itemId,
        itemName: definition.name,
        remainingQuantity: currentQuantity,
        boostSecondsRemaining: getExplorationSnackBoostRemainingSeconds(now),
      };
    }

    if (currentQuantity < 1) {
      return {
        status: 'not-owned',
        itemId,
        itemName: definition.name,
        remainingQuantity: 0,
        boostSecondsRemaining: getExplorationSnackBoostRemainingSeconds(now),
      };
    }

    if (isExplorationSnackBoostActive(now)) {
      return {
        status: 'boost-active',
        itemId,
        itemName: definition.name,
        remainingQuantity: currentQuantity,
        boostSecondsRemaining: getExplorationSnackBoostRemainingSeconds(now),
      };
    }

    const removed = this.inventory.removeItem(itemId);
    if (!removed) {
      return {
        status: 'not-owned',
        itemId,
        itemName: definition.name,
        remainingQuantity: 0,
        boostSecondsRemaining: 0,
      };
    }

    activateExplorationSnackBoost(now);
    return {
      status: 'used',
      itemId,
      itemName: definition.name,
      remainingQuantity: currentQuantity - 1,
      boostSecondsRemaining: getExplorationSnackBoostRemainingSeconds(now),
    };
  }
}
