import { R4_SHOP_STOCK, type ShopStockEntry } from '../../content/r4ShopContent';
import { R65_STARLIGHT_BEACH_SHOP_STOCK } from '../../content/r65StarlightBeach';
import { itemRegistry } from '../../content/registries';
import type { ItemDefinition, ItemId } from '../../content/contentTypes';
import type { SaveService } from '../save/SaveService';
import { applyShimmerSpendToSave, getShimmerBalanceFromSave } from './ShimmerEconomyService';
import { resolveShopUnlock } from './ShopProgression';

export interface ShopItemView {
  definition: ItemDefinition;
  price: number;
  ownedQuantity: number;
  isUniqueOwned: boolean;
  isUnlocked: boolean;
  unlockHint: string | null;
}

export type ShopPurchaseResult =
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

const SHOP_STOCK = [
  ...R4_SHOP_STOCK,
  ...R65_STARLIGHT_BEACH_SHOP_STOCK,
] as const satisfies readonly ShopStockEntry[];

function appendUnique(values: readonly string[], value: string): string[] {
  return values.includes(value) ? [...values] : [...values, value];
}

function requireStockEntry(itemId: ItemId): ShopStockEntry {
  const entry = SHOP_STOCK.find((candidate) => candidate.itemId === itemId);
  if (!entry) {
    throw new Error(`Item is not sold by Twinkle & Thread: ${itemId}`);
  }
  if (!Number.isInteger(entry.price) || entry.price <= 0) {
    throw new Error(`Shop price must be a positive integer: ${itemId}`);
  }
  return entry;
}

function requireShopItem(itemId: ItemId): ItemDefinition {
  const item = itemRegistry.get(itemId);
  if (item.category !== 'accessory' && item.category !== 'decoration') {
    throw new Error(`Shop stock must be an accessory or decoration: ${itemId}`);
  }
  return item;
}

export class ShopService {
  public constructor(private readonly saveService: SaveService) {}

  public listStock(): readonly ShopItemView[] {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    return SHOP_STOCK.map((entry) => {
      const definition = requireShopItem(entry.itemId);
      const ownedQuantity = save.inventory.itemQuantities[entry.itemId] ?? 0;
      const unlock = resolveShopUnlock(save, entry.itemId);
      return {
        definition,
        price: entry.price,
        ownedQuantity,
        isUniqueOwned: definition.category === 'accessory' && ownedQuantity > 0,
        isUnlocked: unlock.unlocked,
        unlockHint: unlock.hint,
      };
    });
  }

  public purchase(itemId: ItemId): ShopPurchaseResult {
    const stock = requireStockEntry(itemId);
    const item = requireShopItem(itemId);
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const balance = getShimmerBalanceFromSave(save);
    const ownedQuantity = save.inventory.itemQuantities[itemId] ?? 0;
    const unlock = resolveShopUnlock(save, itemId);

    if (!unlock.unlocked) {
      return {
        type: 'locked',
        item,
        balance,
        unlockHint: unlock.hint ?? 'Keep exploring the valley to unlock this.',
      };
    }

    if (item.category === 'accessory' && ownedQuantity > 0) {
      return {
        type: 'already-owned',
        item,
        balance,
      };
    }

    const spentSave = applyShimmerSpendToSave(save, stock.price);
    if (!spentSave) {
      return {
        type: 'insufficient-funds',
        item,
        price: stock.price,
        balance,
        shortfall: stock.price - balance,
      };
    }

    const nextQuantity = ownedQuantity + 1;
    const itemQuantities = {
      ...spentSave.inventory.itemQuantities,
      [itemId]: nextQuantity,
    };
    const ownedCosmeticIds =
      item.category === 'accessory'
        ? appendUnique(spentSave.inventory.ownedCosmeticIds, itemId)
        : [...spentSave.inventory.ownedCosmeticIds];
    const ownedDecorationIds =
      item.category === 'decoration'
        ? appendUnique(spentSave.inventory.ownedDecorationIds, itemId)
        : [...spentSave.inventory.ownedDecorationIds];
    const ownedFurnitureIds =
      item.category === 'decoration'
        ? appendUnique(spentSave.home.ownedFurnitureIds, itemId)
        : [...spentSave.home.ownedFurnitureIds];

    const saved = this.saveService.save({
      ...spentSave,
      inventory: {
        ...spentSave.inventory,
        itemQuantities,
        ownedCosmeticIds,
        ownedDecorationIds,
      },
      home: {
        ...spentSave.home,
        ownedFurnitureIds,
      },
    });

    return {
      type: 'purchased',
      item,
      price: stock.price,
      balance: getShimmerBalanceFromSave(saved),
      ownedQuantity: nextQuantity,
    };
  }
}
