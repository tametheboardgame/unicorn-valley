import { R6_BAKERY_STOCK, type BakeryStockEntry } from '../../content/r6VillageContent';
import { itemRegistry } from '../../content/registries';
import type { ItemDefinition, ItemId } from '../../content/contentTypes';
import { type GameEventMap, type TypedEventBus, gameEventBus } from '../events/GameEventBus';
import type { SaveService } from '../save/SaveService';
import { applyShimmerSpendToSave, getShimmerBalanceFromSave } from './ShimmerEconomyService';

const BAKERY_SHOP_ID = 'shop:sunbeam-bakery';

export interface BakeryStockView {
  definition: ItemDefinition;
  price: number;
  section: BakeryStockEntry['section'];
  maxDailyStock: number;
  remainingStock: number;
  isSoldOut: boolean;
  temporaryEffect: BakeryStockEntry['temporaryEffect'];
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
    }
  | {
      type: 'sold-out';
      item: ItemDefinition;
      balance: number;
    }
  | {
      type: 'persistence-failed';
      item: ItemDefinition;
      balance: number;
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

function withVisibleRepeatOwnership(
  definition: ItemDefinition,
  unique: boolean,
  ownedQuantity: number,
): ItemDefinition {
  if (unique || ownedQuantity <= 0) {
    return definition;
  }
  return {
    ...definition,
    name: `${definition.name} ×${ownedQuantity}`,
  };
}

function fullDailyStock(): Record<string, number> {
  return Object.fromEntries(R6_BAKERY_STOCK.map((stock) => [stock.itemId, stock.maxDailyStock]));
}

export class BakeryService {
  public constructor(
    private readonly saveService: SaveService,
    private readonly events: TypedEventBus<GameEventMap> = gameEventBus,
  ) {}

  public listStock(): readonly BakeryStockView[] {
    const save = this.ensureDailyStock(this.saveService.load() ?? this.saveService.createNewGame());
    const shop = save.shops.byShopId[BAKERY_SHOP_ID];
    return R6_BAKERY_STOCK.map((stock) => {
      const ownedQuantity = save.inventory.itemQuantities[stock.itemId] ?? 0;
      const definition = withVisibleRepeatOwnership(
        itemRegistry.get(stock.itemId),
        stock.unique,
        ownedQuantity,
      );
      const unlock = unlockFor(save, stock);
      const remainingStock = Math.max(
        0,
        shop?.remainingByItemId[stock.itemId] ?? stock.maxDailyStock,
      );
      return {
        definition,
        price: stock.price,
        section: stock.section,
        maxDailyStock: stock.maxDailyStock,
        remainingStock,
        isSoldOut: remainingStock <= 0,
        temporaryEffect: stock.temporaryEffect,
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
    const save = this.ensureDailyStock(this.saveService.load() ?? this.saveService.createNewGame());
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

    const shop = save.shops.byShopId[BAKERY_SHOP_ID];
    const remainingStock = Math.max(0, shop?.remainingByItemId[itemId] ?? stock.maxDailyStock);
    if (remainingStock <= 0) {
      return { type: 'sold-out', item, balance };
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
    const result = this.saveService.saveWithResult({
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
      shops: {
        ...spent.shops,
        byShopId: {
          ...spent.shops.byShopId,
          [BAKERY_SHOP_ID]: {
            restockSerial: spent.shops.morningSerial,
            remainingByItemId: {
              ...fullDailyStock(),
              ...(shop?.remainingByItemId ?? {}),
              [itemId]: remainingStock - 1,
            },
          },
        },
      },
    });
    if (result.status !== 'saved') {
      return { type: 'persistence-failed', item, balance };
    }
    const saved = result.save;
    this.events.emit('ITEM_COLLECTED', { itemId, quantity: 1 });

    return {
      type: 'purchased',
      item,
      price: stock.price,
      balance: getShimmerBalanceFromSave(saved),
      ownedQuantity: nextQuantity,
    };
  }

  private ensureDailyStock(
    save: ReturnType<SaveService['createNewGame']>,
  ): ReturnType<SaveService['createNewGame']> {
    const current = save.shops.byShopId[BAKERY_SHOP_ID];
    if (current?.restockSerial === save.shops.morningSerial) {
      return save;
    }

    const next = {
      ...save,
      shops: {
        ...save.shops,
        byShopId: {
          ...save.shops.byShopId,
          [BAKERY_SHOP_ID]: {
            restockSerial: save.shops.morningSerial,
            remainingByItemId: fullDailyStock(),
          },
        },
      },
    };
    const result = this.saveService.saveWithResult(next);
    return result.status === 'saved' ? result.save : next;
  }
}
