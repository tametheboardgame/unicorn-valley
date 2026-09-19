import type { ItemDefinition, ItemId } from './contentTypes';

/** Basic cottage pieces granted to every player; these are not progression rewards or shop stock. */
export const COTTAGE_STARTER_DECORATIONS: readonly ItemDefinition[] = [
  ['item:starter-moonflower-hoop', 'Moonflower Hoop', '🌸'],
  ['item:starter-star-bunting', 'Star Bunting', '⭐'],
  ['item:starter-meadow-rug', 'Meadow Rug', '🌼'],
  ['item:starter-daisy-vase', 'Daisy Vase', '💐'],
].map(([id, name, icon]) => ({ id: id as ItemId, name, icon, category: 'decoration' }));

export const COTTAGE_STARTER_DECORATION_IDS = COTTAGE_STARTER_DECORATIONS.map(
  ({ id }) => id,
) satisfies readonly ItemId[];
