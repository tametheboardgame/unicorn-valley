import type { ItemDefinition, ItemId } from './contentTypes';

export interface ShopStockEntry {
  itemId: ItemId;
  price: number;
}

export const R4_SHOP_ITEMS = [
  {
    id: 'item:starlight-bow',
    name: 'Starlight Bow',
    description: 'A soft lavender bow with a tiny star at its centre.',
    category: 'accessory',
    icon: '🎀',
  },
  {
    id: 'item:moonflower-hair-clip',
    name: 'Moonflower Clip',
    description: 'A little flower clip that glows like Moonflower Glade at dusk.',
    category: 'accessory',
    icon: '🌸',
  },
  {
    id: 'item:rainbow-neck-ribbon',
    name: 'Rainbow Neck Ribbon',
    description: 'A bright ribbon for a unicorn who likes carrying a rainbow everywhere.',
    category: 'accessory',
    icon: '🌈',
  },
  {
    id: 'item:cloud-cushion',
    name: 'Cloud Cushion',
    description: 'A squashy cloud-shaped cushion for a cosy cottage corner.',
    category: 'decoration',
    icon: '☁️',
  },
  {
    id: 'item:starlight-lamp',
    name: 'Starlight Lamp',
    description: 'A small cottage lamp filled with warm starry light.',
    category: 'decoration',
    icon: '🌟',
  },
  {
    id: 'item:rainbow-rug',
    name: 'Rainbow Rug',
    description: 'A cheerful rainbow rug made for muddy hooves and happy homes.',
    category: 'decoration',
    icon: '🪄',
  },
] as const satisfies readonly ItemDefinition[];

export const R4_SHOP_STOCK = [
  { itemId: 'item:starlight-bow', price: 2 },
  { itemId: 'item:cloud-cushion', price: 2 },
  { itemId: 'item:moonflower-hair-clip', price: 4 },
  { itemId: 'item:starlight-lamp', price: 4 },
  { itemId: 'item:rainbow-neck-ribbon', price: 6 },
  { itemId: 'item:rainbow-rug', price: 6 },
] as const satisfies readonly ShopStockEntry[];
