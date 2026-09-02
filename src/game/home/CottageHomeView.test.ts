import { describe, expect, it } from 'vitest';
import { createDefaultSave } from '../save/createDefaultSave';
import { buildCottageHomeView } from './CottageHomeView';

describe('Cottage home view', () => {
  it('rebuilds persisted owned decoration placements from stable slot IDs', () => {
    const save = createDefaultSave('2026-08-17T12:00:00.000Z');
    save.inventory.itemQuantities['item:sunbeam-cushion'] = 1;
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

  it('ignores invalid, non-decoration and unowned home assignments safely', () => {
    const save = createDefaultSave('2026-08-17T12:00:00.000Z');
    save.home.furnitureBySlot['cottage-slot:window-nook'] = 'item:berry-bun';
    save.home.furnitureBySlot['cottage-slot:bedside'] = 'item:not-real';
    save.home.furnitureBySlot['cottage-slot:centre-rug'] = 'item:sunbeam-cushion';

    expect(buildCottageHomeView(save).placements).toEqual([]);
  });

  it('never renders more copies of a decoration than the player owns', () => {
    const save = createDefaultSave('2026-08-17T12:00:00.000Z');
    save.inventory.itemQuantities['item:sunbeam-cushion'] = 1;
    save.home.furnitureBySlot['cottage-slot:window-nook'] = 'item:sunbeam-cushion';
    save.home.furnitureBySlot['cottage-slot:bedside'] = 'item:sunbeam-cushion';

    expect(buildCottageHomeView(save).placements).toHaveLength(1);
  });

  it("shows Willow's lantern on the treasure shelf until every owned copy is placed elsewhere", () => {
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

  it('shows race and Glade accomplishments as physical home evidence', () => {
    const save = createDefaultSave('2026-09-02T15:00:00.000Z');
    save.inventory.itemQuantities['item:rainbow-run-finisher-ribbon'] = 1;
    save.inventory.itemQuantities['item:hollow-tree-star-jar'] = 1;
    save.inventory.itemQuantities['item:butterfly-window-charm'] = 1;

    expect(buildCottageHomeView(save).treasureRewards.map(({ itemId }) => itemId)).toEqual(
      expect.arrayContaining([
        'item:rainbow-run-finisher-ribbon',
        'item:hollow-tree-star-jar',
        'item:butterfly-window-charm',
      ]),
    );
  });
});
