import type { ItemId } from '../../content/contentTypes';
import { itemRegistry } from '../../content/registries';
import type { AccessoryId } from '../player/UnicornAppearance';
import type { SaveService } from '../save/SaveService';

export const TWINKLE_EQUIPPED_ITEM_APPEARANCE_KEY = 'shopAccessoryItemId';

interface TwinkleWearableDefinition {
  itemId: ItemId;
  accessoryId: AccessoryId;
}

export interface TwinkleWardrobeOption {
  itemId: ItemId;
  name: string;
  description: string;
  icon: string;
  accessoryId: AccessoryId;
  isEquipped: boolean;
}

export type TwinkleWardrobeEquipResult =
  | { status: 'equipped'; option: TwinkleWardrobeOption }
  | { status: 'removed' }
  | { status: 'not-owned'; itemId: ItemId }
  | { status: 'not-wearable'; itemId: ItemId }
  | { status: 'persistence-failed' };

const TWINKLE_WEARABLES = [
  { itemId: 'item:starlight-bow', accessoryId: 'bow' },
  { itemId: 'item:moonflower-hair-clip', accessoryId: 'flower' },
  { itemId: 'item:rainbow-neck-ribbon', accessoryId: 'ribbon' },
  { itemId: 'item:starlight-shell-ribbon', accessoryId: 'ribbon' },
] as const satisfies readonly TwinkleWearableDefinition[];

function getWearable(itemId: ItemId): TwinkleWearableDefinition | null {
  return TWINKLE_WEARABLES.find((candidate) => candidate.itemId === itemId) ?? null;
}

export class TwinkleWardrobeService {
  public constructor(private readonly saveService: SaveService) {}

  public listOwnedWearables(): readonly TwinkleWardrobeOption[] {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const equippedItemId = save.profile.appearance[TWINKLE_EQUIPPED_ITEM_APPEARANCE_KEY];

    return TWINKLE_WEARABLES.filter(({ itemId }) =>
      save.inventory.ownedCosmeticIds.includes(itemId),
    ).map(({ itemId, accessoryId }) => {
      const definition = itemRegistry.get(itemId);
      return {
        itemId,
        name: definition.name,
        description: definition.description ?? 'A Twinkle & Thread wearable.',
        icon: definition.icon ?? '✨',
        accessoryId,
        isEquipped: equippedItemId === itemId,
      };
    });
  }

  public equip(itemId: ItemId): TwinkleWardrobeEquipResult {
    const wearable = getWearable(itemId);
    if (!wearable) {
      return { status: 'not-wearable', itemId };
    }

    const save = this.saveService.load() ?? this.saveService.createNewGame();
    if (!save.inventory.ownedCosmeticIds.includes(itemId)) {
      return { status: 'not-owned', itemId };
    }

    const result = this.saveService.saveWithResult({
      ...save,
      profile: {
        ...save.profile,
        appearance: {
          ...save.profile.appearance,
          accessory: wearable.accessoryId,
          [TWINKLE_EQUIPPED_ITEM_APPEARANCE_KEY]: itemId,
        },
      },
    });
    if (result.status !== 'saved') {
      return { status: 'persistence-failed' };
    }

    const option = this.listOwnedWearables().find((candidate) => candidate.itemId === itemId);
    if (!option) {
      return { status: 'persistence-failed' };
    }
    return { status: 'equipped', option };
  }

  public removeAccessory(): TwinkleWardrobeEquipResult {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const appearance = { ...save.profile.appearance };
    delete appearance[TWINKLE_EQUIPPED_ITEM_APPEARANCE_KEY];
    appearance.accessory = 'none';

    const result = this.saveService.saveWithResult({
      ...save,
      profile: {
        ...save.profile,
        appearance,
      },
    });
    return result.status === 'saved' ? { status: 'removed' } : { status: 'persistence-failed' };
  }
}
