import type { ItemDefinition, ItemId } from '../../content/contentTypes';
import { itemRegistry } from '../../content/registries';
import { type GameEventMap, type TypedEventBus, gameEventBus } from '../events/GameEventBus';
import type { SaveService } from '../save/SaveService';
import type { SaveGame } from '../save/saveSchema';
import {
  COTTAGE_INTERIOR_MAP,
  isCottagePointInsideDecorationProtectedZone,
  type CottageDecorationSlot,
} from '../world/CottageInteriorMap';
import { canPlaceDecorationInCategory } from './CottageDecorationCatalogue';

export interface OwnedDecoration {
  definition: ItemDefinition;
  quantity: number;
  placedQuantity: number;
}

export type DecorationPlacementAction = 'unchanged' | 'placed' | 'replaced' | 'moved';

export interface DecorationPlacementResult {
  action: DecorationPlacementAction;
  item: ItemDefinition;
  replacedItem: ItemDefinition | null;
  movedFromSlot: CottageDecorationSlot | null;
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

const COTTAGE_DECORATION_SLOTS: readonly CottageDecorationSlot[] = [
  ...COTTAGE_INTERIOR_MAP.decorationSlots,
  ...COTTAGE_INTERIOR_MAP.deferredDecorationSlots,
];

function requireSlot(slotId: string): CottageDecorationSlot {
  const slot = COTTAGE_DECORATION_SLOTS.find((candidate) => candidate.id === slotId);
  if (!slot) {
    throw new Error(`Unknown cottage decoration slot: ${slotId}`);
  }

  const protectedZone = isCottagePointInsideDecorationProtectedZone(slot.position, 46);
  if (protectedZone) {
    throw new Error(
      `Cottage decoration slot overlaps protected story capacity: ${slot.id} / ${protectedZone.anchorId}`,
    );
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

function normaliseDecorationPlacements(save: SaveGame): SaveGame {
  const furnitureBySlot = { ...save.home.furnitureBySlot };
  const placementsByItem = new Map<ItemId, string[]>();
  let changed = false;

  for (const slot of COTTAGE_DECORATION_SLOTS) {
    const item = resolveDecoration(furnitureBySlot[slot.id]);
    if (!item) {
      continue;
    }
    const placements = placementsByItem.get(item.id) ?? [];
    placements.push(slot.id);
    placementsByItem.set(item.id, placements);
  }

  for (const [itemId, slotIds] of placementsByItem) {
    const ownedQuantity = Math.max(0, save.inventory.itemQuantities[itemId] ?? 0);
    for (const slotId of slotIds.slice(ownedQuantity)) {
      delete furnitureBySlot[slotId];
      changed = true;
    }
  }

  if (!changed) {
    return save;
  }

  return {
    ...save,
    home: {
      ...save.home,
      furnitureBySlot,
    },
  };
}

export class HomeDecorationService {
  public constructor(
    private readonly saveService: SaveService,
    private readonly events: TypedEventBus<GameEventMap> = gameEventBus,
  ) {}

  public getSlot(slotId: string): CottageDecorationSlot {
    return requireSlot(slotId);
  }

  public listOwnedDecorations(): readonly OwnedDecoration[] {
    const save = this.loadNormalisedSave();

    return itemRegistry
      .values()
      .filter((item) => item.category === 'decoration')
      .flatMap((definition) => {
        const quantity = save.inventory.itemQuantities[definition.id] ?? 0;
        if (quantity <= 0) {
          return [];
        }

        const placedQuantity = COTTAGE_DECORATION_SLOTS.filter(
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
    const save = this.loadNormalisedSave();
    return resolveDecoration(save.home.furnitureBySlot[slotId]);
  }

  public placeDecoration(slotId: string, itemId: ItemId): DecorationPlacementResult {
    const slot = requireSlot(slotId);
    const item = requireDecoration(itemId);
    if (!canPlaceDecorationInCategory(itemId, slot.category)) {
      throw new Error(`${item.name} cannot be placed in a ${slot.category} decoration slot`);
    }

    const save = this.loadNormalisedSave();
    const ownedQuantity = save.inventory.itemQuantities[itemId] ?? 0;

    if (ownedQuantity <= 0) {
      throw new Error(`Decoration is not owned: ${itemId}`);
    }

    const furnitureBySlot = { ...save.home.furnitureBySlot };
    const alreadyHere = furnitureBySlot[slot.id] === itemId;
    const replacedItem = alreadyHere ? null : resolveDecoration(furnitureBySlot[slot.id]);
    const otherPlacements = COTTAGE_DECORATION_SLOTS.filter(
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
    this.events.emit('HOME_DECORATION_CHANGED', {
      slotId: slot.id,
      itemId: item.id,
      change: 'placed',
    });

    return {
      action: alreadyHere
        ? 'unchanged'
        : movedFromSlot
          ? 'moved'
          : replacedItem
            ? 'replaced'
            : 'placed',
      item,
      replacedItem,
      movedFromSlot,
    };
  }

  public removeDecoration(slotId: string): ItemDefinition | null {
    requireSlot(slotId);
    const save = this.loadNormalisedSave();
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
    this.events.emit('HOME_DECORATION_CHANGED', {
      slotId,
      itemId: item?.id ?? null,
      change: 'removed',
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

  private loadNormalisedSave(): SaveGame {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const normalised = normaliseDecorationPlacements(save);
    return normalised === save ? save : this.saveService.save(normalised);
  }
}
