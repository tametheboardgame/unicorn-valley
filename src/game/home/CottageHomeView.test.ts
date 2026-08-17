import { describe, expect, it } from 'vitest';
import { createDefaultSave } from '../save/createDefaultSave';
import { buildCottageHomeView } from './CottageHomeView';

describe('Cottage home view', () => {
  it('rebuilds persisted decoration placements from stable slot IDs', () => {
    const save = createDefaultSave('2026-08-17T12:00:00.000Z');
    save.home.furnitureBySlot['cottage-slot:centre-rug'] = 'item:sunbeam-cushion';

    const view = buildCottageHomeView(save);

    expect(view.placements).toEqual([
      expect.objectContaining({
        slotId: 'cottage-slot:centre-rug',
        itemId: 'item:sunbeam-cushion',
        name: 'Sunbeam Cushion',
      }),
    ]);
  });

  it('ignores invalid and non-decoration home assignments safely', () => {
    const save = createDefaultSave('2026-08-17T12:00:00.000Z');
    save.home.furnitureBySlot['cottage-slot:window-nook'] = 'item:berry-bun';
    save.home.furnitureBySlot['cottage-slot:bedside'] = 'item:not-real';

    expect(buildCottageHomeView(save).placements).toEqual([]);
  });

  it('shows Willow\'s lantern on the treasure shelf until it is placed elsewhere', () => {
    const save = createDefaultSave('2026-08-17T12:00:00.000Z');
    save.inventory.itemQuantities['item:moonflower-lantern'] = 1;

    expect(buildCottageHomeView(save).treasureRewards).toEqual([
      expect.objectContaining({
        itemId: 'item:moonflower-lantern',
        name: 'Moonflower Lantern',
      }),
    ]);

    save.home.furnitureBySlot['cottage-slot:cosy-corner'] = 'item:moonflower-lantern';

    const placedView = buildCottageHomeView(save);
    expect(placedView.treasureRewards).toEqual([]);
    expect(placedView.placements).toEqual([
      expect.objectContaining({
        slotId: 'cottage-slot:cosy-corner',
        itemId: 'item:moonflower-lantern',
      }),
    ]);
  });
});
