import { describe, expect, it } from 'vitest';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { createDefaultSave } from '../save/createDefaultSave';
import {
  TWINKLE_EQUIPPED_ITEM_APPEARANCE_KEY,
  TwinkleWardrobeService,
} from './TwinkleWardrobeService';

class MemorySaveRepository implements SaveRepository {
  public value: string | null = null;

  public read(): string | null {
    return this.value;
  }

  public write(serialisedSave: string): void {
    this.value = serialisedSave;
  }

  public remove(): void {
    this.value = null;
  }
}

function createWardrobe(ownedCosmeticIds: string[] = []) {
  const repository = new MemorySaveRepository();
  const saveService = new SaveService(repository);
  const save = createDefaultSave();
  save.inventory.ownedCosmeticIds = ownedCosmeticIds;
  saveService.save(save);
  return { saveService, wardrobe: new TwinkleWardrobeService(saveService) };
}

describe('TwinkleWardrobeService', () => {
  it('only offers recognised Twinkle wearables that the player owns', () => {
    const { wardrobe } = createWardrobe([
      'item:starlight-bow',
      'item:cloud-cushion',
      'item:rainbow-neck-ribbon',
    ]);

    expect(wardrobe.listOwnedWearables().map(({ itemId }) => itemId)).toEqual([
      'item:starlight-bow',
      'item:rainbow-neck-ribbon',
    ]);
  });

  it('equips an owned shop item through the canonical unicorn accessory appearance', () => {
    const { saveService, wardrobe } = createWardrobe(['item:starlight-bow']);

    expect(wardrobe.equip('item:starlight-bow')).toMatchObject({
      status: 'equipped',
      option: { itemId: 'item:starlight-bow', isEquipped: true },
    });
    expect(saveService.load()?.profile.appearance.accessory).toBe('bow');
    expect(saveService.load()?.profile.appearance[TWINKLE_EQUIPPED_ITEM_APPEARANCE_KEY]).toBe(
      'item:starlight-bow',
    );
  });

  it('remembers which purchased ribbon is equipped even when two products share one art family', () => {
    const { saveService, wardrobe } = createWardrobe([
      'item:rainbow-neck-ribbon',
      'item:starlight-shell-ribbon',
    ]);

    expect(wardrobe.equip('item:starlight-shell-ribbon').status).toBe('equipped');
    expect(saveService.load()?.profile.appearance.accessory).toBe('ribbon');
    expect(saveService.load()?.profile.appearance[TWINKLE_EQUIPPED_ITEM_APPEARANCE_KEY]).toBe(
      'item:starlight-shell-ribbon',
    );
    expect(
      wardrobe.listOwnedWearables().find(({ itemId }) => itemId === 'item:starlight-shell-ribbon')
        ?.isEquipped,
    ).toBe(true);
  });

  it('refuses unowned items and can remove the currently equipped accessory', () => {
    const { saveService, wardrobe } = createWardrobe(['item:moonflower-hair-clip']);

    expect(wardrobe.equip('item:starlight-bow')).toEqual({
      status: 'not-owned',
      itemId: 'item:starlight-bow',
    });
    expect(wardrobe.equip('item:moonflower-hair-clip').status).toBe('equipped');
    expect(wardrobe.removeAccessory()).toEqual({ status: 'removed' });
    expect(saveService.load()?.profile.appearance.accessory).toBe('none');
    expect(
      saveService.load()?.profile.appearance[TWINKLE_EQUIPPED_ITEM_APPEARANCE_KEY],
    ).toBeUndefined();
  });
});
