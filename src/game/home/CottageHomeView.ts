import type { ItemDefinition, ItemId } from '../../content/contentTypes';
import { itemRegistry } from '../../content/registries';
import type { SaveGame } from '../save/saveSchema';
import { COTTAGE_INTERIOR_MAP, type CottageDecorationSlot } from '../world/CottageInteriorMap';

const TREASURE_REWARD_IDS = [
  'item:moonflower-lantern',
  'item:rainbow-run-finisher-ribbon',
  'item:rainbow-run-podium-rosette',
  'item:pebble-curiosity-display',
  'item:brook-prism-mobile',
  'item:crystal-cascade-finisher-ribbon',
  'item:crystal-cascade-podium-rosette',
  'item:hollow-tree-star-jar',
  'item:butterfly-window-charm',
  'item:windmill-sky-pennant',
  'item:echo-crystal-chime',
] as const satisfies readonly ItemId[];

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
  remainingByItemId: Map<ItemId, number>,
): CottageDecorationView | null {
  const item = resolveDecoration(save.home.furnitureBySlot[slot.id]);
  if (!item) {
    return null;
  }

  const remaining =
    remainingByItemId.get(item.id) ?? Math.max(0, save.inventory.itemQuantities[item.id] ?? 0);
  if (remaining <= 0) {
    return null;
  }
  remainingByItemId.set(item.id, remaining - 1);

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
  const remainingByItemId = new Map<ItemId, number>();
  const placements = COTTAGE_INTERIOR_MAP.decorationSlots
    .map((slot) => placementForSlot(save, slot, remainingByItemId))
    .filter((placement): placement is CottageDecorationView => placement !== null);
  const placedQuantityByItemId = new Map<ItemId, number>();
  for (const placement of placements) {
    placedQuantityByItemId.set(
      placement.itemId,
      (placedQuantityByItemId.get(placement.itemId) ?? 0) + 1,
    );
  }

  const treasureRewards = TREASURE_REWARD_IDS.flatMap((itemId) => {
    const ownedQuantity = save.inventory.itemQuantities[itemId] ?? 0;
    const placedQuantity = placedQuantityByItemId.get(itemId) ?? 0;
    if (ownedQuantity <= placedQuantity) {
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
