import { R6_BAKERY_STOCK, type BakeryStockEntry } from '../../content/r6VillageContent';
import { itemRegistry } from '../../content/registries';
import type { ItemDefinition, ItemId } from '../../content/contentTypes';
import { gameEventBus } from '../events/GameEventBus';
import type { SaveService } from '../save/SaveService';
import { applyShimmerSpendToSave, getShimmerBalanceFromSave } from './ShimmerEconomyService';

export interface BakeryStockView {
  definition: ItemDefinition;
  price: number;
  ownedQuantity: number;
  unique: boolean;
  isOwned: boolean;
  isUnlocked: boolean;
  unlockHint: string | null;
}

export type BakeryPurchaseResult =
  | {
      type: 'purchased';
      item: ItemDefinition;
      price: number;
      balance: number;
      ownedQuantity: number;
    }
  | {
      type: 'insufficient-funds';
      item: ItemDefinition;
      price: number;
      balance: number;
      shortfall: number;
    }
  | {
      type: 'already-owned';
      item: ItemDefinition;
      balance: number;
    }
  | {
      type: 'locked';
      item: ItemDefinition;
      balance: number;
      unlockHint: string;
    };

function appendUnique(values: readonly string[], value: string): string[] {
  return values.includes(value) ? [...values] : [...values, value];
}

function requireStock(itemId: ItemId): BakeryStockEntry {
  const stock = R6_BAKERY_STOCK.find((candidate) => candidate.itemId === itemId);
  if (!stock) {
    throw new Error(`Item is not sold by Sunbeam Bakery: ${itemId}`);
  }
  if (!Number.isInteger(stock.price) || stock.price <= 0) {
    throw new Error(`Bakery price must be a positive integer: ${itemId}`);
  }
  return stock;
}

function unlockFor(save: ReturnType<SaveService['createNewGame']>, stock: BakeryStockEntry) {
  if (!stock.unlockAfterQuestId) {
    return { unlocked: true, hint: null };
  }
  const unlocked = save.quests.byQuestId[stock.unlockAfterQuestId]?.status === 'completed';
  return {
    unlocked,
    hint: unlocked
      ? null
      : (stock.unlockHint ?? 'Help around Sunbeam Village to unlock this Bakery treat.'),
  };
}

export class BakeryService {
  public constructor(private readonly saveService: SaveService) {}

  public listStock(): readonly BakeryStockView[] {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    return R6_BAKERY_STOCK.map((stock) => {
      const definition = itemRegistry.get(stock.itemId);
      const ownedQuantity = save.inventory.itemQuantities[stock.itemId] ?? 0;
      const unlock = unlockFor(save, stock);
      return {
        definition,
        price: stock.price,
        ownedQuantity,
        unique: stock.unique,
        isOwned: stock.unique && ownedQuantity > 0,
        isUnlocked: unlock.unlocked,
        unlockHint: unlock.hint,
      };
    });
  }

  public purchase(itemId: ItemId): BakeryPurchaseResult {
    const stock = requireStock(itemId);
    const item = itemRegistry.get(itemId);
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const balance = getShimmerBalanceFromSave(save);
    const ownedQuantity = save.inventory.itemQuantities[itemId] ?? 0;
    const unlock = unlockFor(save, stock);

    if (!unlock.unlocked) {
      return {
        type: 'locked',
        item,
        balance,
        unlockHint: unlock.hint ?? 'Keep helping around Sunbeam Village to unlock this.',
      };
    }
    if (stock.unique && ownedQuantity > 0) {
      return { type: 'already-owned', item, balance };
    }

    const spent = applyShimmerSpendToSave(save, stock.price);
    if (!spent) {
      return {
        type: 'insufficient-funds',
        item,
        price: stock.price,
        balance,
        shortfall: stock.price - balance,
      };
    }

    const nextQuantity = ownedQuantity + 1;
    const decoration = item.category === 'decoration';
    const saved = this.saveService.save({
      ...spent,
      inventory: {
        ...spent.inventory,
        itemQuantities: {
          ...spent.inventory.itemQuantities,
          [itemId]: nextQuantity,
        },
        ownedDecorationIds: decoration
          ? appendUnique(spent.inventory.ownedDecorationIds, itemId)
          : [...spent.inventory.ownedDecorationIds],
      },
      home: {
        ...spent.home,
        ownedFurnitureIds: decoration
          ? appendUnique(spent.home.ownedFurnitureIds, itemId)
          : [...spent.home.ownedFurnitureIds],
      },
    });
    gameEventBus.emit('ITEM_COLLECTED', { itemId, quantity: 1 });

    return {
      type: 'purchased',
      item,
      price: stock.price,
      balance: getShimmerBalanceFromSave(saved),
      ownedQuantity: nextQuantity,
    };
  }
}
