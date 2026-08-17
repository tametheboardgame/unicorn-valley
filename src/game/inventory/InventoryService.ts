import { itemRegistry } from '../../content/registries';
import type { ItemCategory, ItemDefinition, ItemId } from '../../content/contentTypes';
import { type GameEventMap, type TypedEventBus, gameEventBus } from '../events/GameEventBus';
import type { SaveService } from '../save/SaveService';

export interface OwnedInventoryItem {
  definition: ItemDefinition;
  quantity: number;
}

export interface InventoryItemPresentation {
  icon: string;
  category: ItemCategory;
  description: string;
}

export interface RemoveItemOptions {
  allowQuestCritical?: boolean;
}

function assertQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error(`Inventory quantity must be a positive integer. Received: ${quantity}`);
  }
}

export function getItemPresentation(item: ItemDefinition): InventoryItemPresentation {
  return {
    icon: item.icon ?? '✨',
    category: item.category ?? 'collectable',
    description: item.description ?? 'A little treasure from Unicorn Valley.',
  };
}

export class InventoryService {
  public constructor(
    private readonly saveService: SaveService,
    private readonly events: TypedEventBus<GameEventMap> = gameEventBus,
  ) {}

  public getQuantity(itemId: ItemId): number {
    itemRegistry.get(itemId);
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    return save.inventory.itemQuantities[itemId] ?? 0;
  }

  public hasItem(itemId: ItemId, quantity = 1): boolean {
    assertQuantity(quantity);
    return this.getQuantity(itemId) >= quantity;
  }

  public addItem(itemId: ItemId, quantity = 1): number {
    itemRegistry.get(itemId);
    assertQuantity(quantity);

    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const nextQuantity = (save.inventory.itemQuantities[itemId] ?? 0) + quantity;
    this.saveService.save({
      ...save,
      inventory: {
        ...save.inventory,
        itemQuantities: {
          ...save.inventory.itemQuantities,
          [itemId]: nextQuantity,
        },
      },
    });
    this.events.emit('ITEM_COLLECTED', { itemId, quantity });

    return nextQuantity;
  }

  public removeItem(itemId: ItemId, quantity = 1, options: RemoveItemOptions = {}): boolean {
    const definition = itemRegistry.get(itemId);
    assertQuantity(quantity);

    if (definition.questCritical && !options.allowQuestCritical) {
      throw new Error(`Quest-critical item cannot be removed directly: ${itemId}`);
    }

    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const currentQuantity = save.inventory.itemQuantities[itemId] ?? 0;
    if (currentQuantity < quantity) {
      return false;
    }

    const itemQuantities = { ...save.inventory.itemQuantities };
    const nextQuantity = currentQuantity - quantity;
    if (nextQuantity === 0) {
      delete itemQuantities[itemId];
    } else {
      itemQuantities[itemId] = nextQuantity;
    }

    this.saveService.save({
      ...save,
      inventory: {
        ...save.inventory,
        itemQuantities,
      },
    });

    return true;
  }

  public listOwnedItems(): readonly OwnedInventoryItem[] {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    return Object.entries(save.inventory.itemQuantities)
      .filter(([, quantity]) => Number.isInteger(quantity) && quantity > 0)
      .map(([itemId, quantity]) => ({
        definition: itemRegistry.get(itemId as ItemId),
        quantity,
      }))
      .sort((left, right) => left.definition.name.localeCompare(right.definition.name));
  }
}
