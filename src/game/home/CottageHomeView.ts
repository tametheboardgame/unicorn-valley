import type { ItemDefinition, ItemId } from '../../content/contentTypes';
import { itemRegistry } from '../../content/registries';
import type { SaveGame } from '../save/saveSchema';
import { COTTAGE_INTERIOR_MAP, type CottageDecorationSlot } from '../world/CottageInteriorMap';

const TREASURE_REWARD_IDS = ['item:moonflower-lantern'] as const satisfies readonly ItemId[];

export interface CottageDecorationView {
  slotId: string;
  slotLabel: string;
  position: { x: number; y: number };
  itemId: ItemId;
  name: string;
  icon: string;
}

export interface CottageTreasureView {
  itemId: ItemId;
  name: string;
  icon: string;
}

export interface CottageHomeView {
  placements: CottageDecorationView[];
  treasureRewards: CottageTreasureView[];
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

function placementForSlot(
  save: SaveGame,
  slot: CottageDecorationSlot,
): CottageDecorationView | null {
  const item = resolveDecoration(save.home.furnitureBySlot[slot.id]);
  if (!item) {
    return null;
  }

  return {
    slotId: slot.id,
    slotLabel: slot.label,
    position: slot.position,
    itemId: item.id,
    name: item.name,
    icon: item.icon ?? '✦',
  };
}

export function buildCottageHomeView(save: SaveGame): CottageHomeView {
  const placements = COTTAGE_INTERIOR_MAP.decorationSlots
    .map((slot) => placementForSlot(save, slot))
    .filter((placement): placement is CottageDecorationView => placement !== null);
  const placedItemIds = new Set(placements.map((placement) => placement.itemId));

  const treasureRewards = TREASURE_REWARD_IDS.flatMap((itemId) => {
    if ((save.inventory.itemQuantities[itemId] ?? 0) <= 0 || placedItemIds.has(itemId)) {
      return [];
    }

    const item = itemRegistry.get(itemId);
    return [
      {
        itemId,
        name: item.name,
        icon: item.icon ?? '✦',
      },
    ];
  });

  return { placements, treasureRewards };
}
