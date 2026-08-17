import { describe, expect, it } from 'vitest';
import type { ItemId } from '../../content/contentTypes';
import { InventoryService } from '../inventory/InventoryService';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { HomeDecorationService } from './HomeDecorationService';

class MemorySaveRepository implements SaveRepository {
  private value: string | null = null;

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

function createServices(): {
  saveService: SaveService;
  inventory: InventoryService;
  decorating: HomeDecorationService;
} {
  const saveService = new SaveService(new MemorySaveRepository());
  return {
    saveService,
    inventory: new InventoryService(saveService),
    decorating: new HomeDecorationService(saveService),
  };
}

describe('HomeDecorationService', () => {
  it('lists decoration ownership directly from persistent inventory', () => {
    const { inventory, decorating } = createServices();
    inventory.addItem('item:berry-bun');
    inventory.addItem('item:moonflower-lantern');
    inventory.addItem('item:sunbeam-cushion', 2);

    expect(
      decorating.listOwnedDecorations().map(({ definition, quantity, placedQuantity }) => ({
        id: definition.id,
        quantity,
        placedQuantity,
      })),
    ).toEqual([
      { id: 'item:moonflower-lantern', quantity: 1, placedQuantity: 0 },
      { id: 'item:sunbeam-cushion', quantity: 2, placedQuantity: 0 },
    ]);
  });

  it('places, removes and persists decorations by stable slot ID', () => {
    const { saveService, inventory, decorating } = createServices();
    inventory.addItem('item:moonflower-lantern');

    decorating.placeDecoration('cottage-slot:window-nook', 'item:moonflower-lantern');
    expect(decorating.getPlacement('cottage-slot:window-nook')?.id).toBe(
      'item:moonflower-lantern',
    );

    const reloaded = new HomeDecorationService(saveService);
    expect(reloaded.getPlacement('cottage-slot:window-nook')?.name).toBe('Moonflower Lantern');

    expect(reloaded.removeDecoration('cottage-slot:window-nook')?.id).toBe(
      'item:moonflower-lantern',
    );
    expect(reloaded.getPlacement('cottage-slot:window-nook')).toBeNull();
  });

  it('moves a single owned decoration instead of duplicating it', () => {
    const { inventory, decorating } = createServices();
    inventory.addItem('item:moonflower-lantern');
    decorating.placeDecoration('cottage-slot:window-nook', 'item:moonflower-lantern');

    const result = decorating.placeDecoration('cottage-slot:bedside', 'item:moonflower-lantern');

    expect(result.movedFromSlot?.id).toBe('cottage-slot:window-nook');
    expect(decorating.getPlacement('cottage-slot:window-nook')).toBeNull();
    expect(decorating.getPlacement('cottage-slot:bedside')?.id).toBe('item:moonflower-lantern');
  });

  it('cycles through owned decorations and then back to an empty slot', () => {
    const { inventory, decorating } = createServices();
    inventory.addItem('item:moonflower-lantern');
    inventory.addItem('item:sunbeam-cushion');

    expect(decorating.cycleDecoration('cottage-slot:centre-rug')).toMatchObject({
      type: 'placed',
      item: { id: 'item:moonflower-lantern' },
    });
    expect(decorating.cycleDecoration('cottage-slot:centre-rug')).toMatchObject({
      type: 'placed',
      item: { id: 'item:sunbeam-cushion' },
    });
    expect(decorating.cycleDecoration('cottage-slot:centre-rug')).toMatchObject({
      type: 'removed',
      item: { id: 'item:sunbeam-cushion' },
    });
    expect(decorating.getPlacement('cottage-slot:centre-rug')).toBeNull();
  });

  it('rejects unknown slots, non-decoration items and decorations the player does not own', () => {
    const { inventory, decorating } = createServices();
    inventory.addItem('item:berry-bun');

    expect(() =>
      decorating.placeDecoration('cottage-slot:not-real', 'item:moonflower-lantern'),
    ).toThrow('Unknown cottage decoration slot');
    expect(() =>
      decorating.placeDecoration('cottage-slot:window-nook', 'item:berry-bun'),
    ).toThrow('cannot be placed as a cottage decoration');
    expect(() =>
      decorating.placeDecoration('cottage-slot:window-nook', 'item:moonflower-lantern'),
    ).toThrow('Decoration is not owned');
    expect(() =>
      decorating.placeDecoration('cottage-slot:window-nook', 'item:not-real' as ItemId),
    ).toThrow('Unknown item ID');
  });
});
