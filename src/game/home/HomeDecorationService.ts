import type { ItemDefinition, ItemId } from '../../content/contentTypes';
import { itemRegistry } from '../../content/registries';
import type { SaveService } from '../save/SaveService';
import { COTTAGE_INTERIOR_MAP, type CottageDecorationSlot } from '../world/CottageInteriorMap';
import { canPlaceDecorationInCategory } from './CottageDecorationCatalogue';

export interface OwnedDecoration {
  definition: ItemDefinition;
  quantity: number;
  placedQuantity: number;
}

export type DecorationCycleResult =
  | {
      type: 'placed';
      slot: CottageDecorationSlot;
      item: ItemDefinition;
      movedFromSlot: CottageDecorationSlot | null;
    }
  | {
      type: 'removed';
      slot: CottageDecorationSlot;
      item: ItemDefinition | null;
    }
  | {
      type: 'no-options';
      slot: CottageDecorationSlot;
    };

function requireSlot(slotId: string): CottageDecorationSlot {
  const slot = COTTAGE_INTERIOR_MAP.decorationSlots.find((candidate) => candidate.id === slotId);
  if (!slot) {
    throw new Error(`Unknown cottage decoration slot: ${slotId}`);
  }

  return slot;
}

function requireDecoration(itemId: ItemId): ItemDefinition {
  const item = itemRegistry.get(itemId);
  if (item.category !== 'decoration') {
    throw new Error(`Item cannot be placed as a cottage decoration: ${itemId}`);
  }

  return item;
}

function resolveDecoration(itemId: string | undefined): ItemDefinition | null {
  if (!itemId?.startsWith('item:')) {
    return null;
  }

  const typedId = itemId as ItemId;
  if (!itemRegistry.has(typedId)) {
    return null;
  }

  const item = itemRegistry.get(typedId);
  return item.category === 'decoration' ? item : null;
}

export class HomeDecorationService {
  public constructor(private readonly saveService: SaveService) {}

  public getSlot(slotId: string): CottageDecorationSlot {
    return requireSlot(slotId);
  }

  public listOwnedDecorations(): readonly OwnedDecoration[] {
    const save = this.saveService.load() ?? this.saveService.createNewGame();

    return itemRegistry
      .values()
      .filter((item) => item.category === 'decoration')
      .flatMap((definition) => {
        const quantity = save.inventory.itemQuantities[definition.id] ?? 0;
        if (quantity <= 0) {
          return [];
        }

        const placedQuantity = COTTAGE_INTERIOR_MAP.decorationSlots.filter(
          (slot) => save.home.furnitureBySlot[slot.id] === definition.id,
        ).length;

        return [{ definition, quantity, placedQuantity }];
      })
      .sort((left, right) => left.definition.name.localeCompare(right.definition.name));
  }

  public listCompatibleDecorations(slotId: string): readonly OwnedDecoration[] {
    const slot = requireSlot(slotId);
    return this.listOwnedDecorations().filter(({ definition }) =>
      canPlaceDecorationInCategory(definition.id, slot.category),
    );
  }

  public getPlacement(slotId: string): ItemDefinition | null {
    requireSlot(slotId);
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    return resolveDecoration(save.home.furnitureBySlot[slotId]);
  }

  public placeDecoration(
    slotId: string,
    itemId: ItemId,
  ): { item: ItemDefinition; movedFromSlot: CottageDecorationSlot | null } {
    const slot = requireSlot(slotId);
    const item = requireDecoration(itemId);
    if (!canPlaceDecorationInCategory(itemId, slot.category)) {
      throw new Error(`${item.name} cannot be placed in a ${slot.category} decoration slot`);
    }

    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const ownedQuantity = save.inventory.itemQuantities[itemId] ?? 0;

    if (ownedQuantity <= 0) {
      throw new Error(`Decoration is not owned: ${itemId}`);
    }

    const furnitureBySlot = { ...save.home.furnitureBySlot };
    const alreadyHere = furnitureBySlot[slot.id] === itemId;
    const otherPlacements = COTTAGE_INTERIOR_MAP.decorationSlots.filter(
      (candidate) => candidate.id !== slot.id && furnitureBySlot[candidate.id] === itemId,
    );

    let movedFromSlot: CottageDecorationSlot | null = null;
    if (!alreadyHere && otherPlacements.length >= ownedQuantity) {
      movedFromSlot = otherPlacements[0] ?? null;
      if (movedFromSlot) {
        delete furnitureBySlot[movedFromSlot.id];
      }
    }

    furnitureBySlot[slot.id] = itemId;
    this.saveService.save({
      ...save,
      home: {
        ...save.home,
        furnitureBySlot,
      },
    });

    return { item, movedFromSlot };
  }

  public removeDecoration(slotId: string): ItemDefinition | null {
    requireSlot(slotId);
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const item = resolveDecoration(save.home.furnitureBySlot[slotId]);

    if (!(slotId in save.home.furnitureBySlot)) {
      return null;
    }

    const furnitureBySlot = { ...save.home.furnitureBySlot };
    delete furnitureBySlot[slotId];
    this.saveService.save({
      ...save,
      home: {
        ...save.home,
        furnitureBySlot,
      },
    });

    return item;
  }

  public cycleDecoration(slotId: string): DecorationCycleResult {
    const slot = requireSlot(slotId);
    const ownedDecorations = this.listCompatibleDecorations(slotId);
    const current = this.getPlacement(slotId);

    if (ownedDecorations.length === 0) {
      if (current) {
        return { type: 'removed', slot, item: this.removeDecoration(slotId) };
      }
      return { type: 'no-options', slot };
    }

    const currentIndex = current
      ? ownedDecorations.findIndex(({ definition }) => definition.id === current.id)
      : -1;
    const next =
      currentIndex + 1 < ownedDecorations.length ? ownedDecorations[currentIndex + 1] : null;

    if (!next) {
      return { type: 'removed', slot, item: this.removeDecoration(slotId) };
    }

    const placed = this.placeDecoration(slotId, next.definition.id);
    return {
      type: 'placed',
      slot,
      item: placed.item,
      movedFromSlot: placed.movedFromSlot,
    };
  }
}
