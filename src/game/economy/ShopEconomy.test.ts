import { describe, expect, it } from 'vitest';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { createDefaultSave } from '../save/createDefaultSave';
import { ShopService } from './ShopService';
import {
  SHIMMER_ITEM_ID,
  ShimmerEconomyService,
  getShimmerBalanceFromSave,
} from './ShimmerEconomyService';

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

function createServices() {
  const repository = new MemorySaveRepository();
  const saveService = new SaveService(repository);
  return {
    repository,
    saveService,
    economy: new ShimmerEconomyService(saveService),
    shop: new ShopService(saveService),
  };
}

describe('Shimmer economy', () => {
  it('earns, spends and refuses overspending without changing the balance', () => {
    const { economy } = createServices();

    expect(economy.getBalance()).toBe(0);
    expect(economy.earn(5)).toBe(5);
    expect(economy.canSpend(3)).toBe(true);
    expect(economy.spend(3)).toBe(true);
    expect(economy.getBalance()).toBe(2);
    expect(economy.spend(3)).toBe(false);
    expect(economy.getBalance()).toBe(2);
  });

  it('recognises previously earned Rainbow Run sparkles as Shimmer', () => {
    const { saveService } = createServices();
    const save = createDefaultSave();
    save.inventory.itemQuantities[SHIMMER_ITEM_ID] = 7;
    saveService.save(save);

    const reloaded = saveService.load();
    expect(reloaded).not.toBeNull();
    expect(getShimmerBalanceFromSave(reloaded!)).toBe(7);
  });

  it('rejects invalid transaction amounts', () => {
    const { economy } = createServices();
    expect(() => economy.earn(0)).toThrow('positive integer');
    expect(() => economy.spend(-1)).toThrow('positive integer');
  });
});

describe('Twinkle & Thread shop', () => {
  it('offers both accessories and cottage decorations at generous prices', () => {
    const { shop } = createServices();
    const stock = shop.listStock();

    expect(stock.some(({ definition }) => definition.category === 'accessory')).toBe(true);
    expect(stock.some(({ definition }) => definition.category === 'decoration')).toBe(true);
    expect(Math.min(...stock.map(({ price }) => price))).toBeLessThanOrEqual(2);
    expect(Math.max(...stock.map(({ price }) => price)).toBeLessThanOrEqual(6);
  });

  it('purchases an accessory once and persists ownership and the reduced balance', () => {
    const { repository, economy, shop } = createServices();
    economy.earn(6);

    const result = shop.purchase('item:starlight-bow');
    expect(result.type).toBe('purchased');
    expect(result.balance).toBe(4);

    const reloadedService = new SaveService(repository);
    const reloaded = reloadedService.load();
    expect(reloaded?.inventory.itemQuantities['item:starlight-bow']).toBe(1);
    expect(reloaded?.inventory.ownedCosmeticIds).toContain('item:starlight-bow');
    expect(reloaded ? getShimmerBalanceFromSave(reloaded) : -1).toBe(4);

    const secondPurchase = new ShopService(reloadedService).purchase('item:starlight-bow');
    expect(secondPurchase.type).toBe('already-owned');
    expect(reloadedService.load()?.inventory.itemQuantities['item:starlight-bow']).toBe(1);
  });

  it('allows repeat furniture purchases for cottage placement', () => {
    const { saveService, economy, shop } = createServices();
    economy.earn(6);

    expect(shop.purchase('item:cloud-cushion').type).toBe('purchased');
    expect(shop.purchase('item:cloud-cushion').type).toBe('purchased');

    const save = saveService.load();
    expect(save?.inventory.itemQuantities['item:cloud-cushion']).toBe(2);
    expect(save?.inventory.ownedDecorationIds).toContain('item:cloud-cushion');
    expect(save?.home.ownedFurnitureIds).toContain('item:cloud-cushion');
    expect(save ? getShimmerBalanceFromSave(save) : -1).toBe(2);
  });

  it('gives clear insufficient-funds data and does not grant the item', () => {
    const { saveService, economy, shop } = createServices();
    economy.earn(1);

    const result = shop.purchase('item:rainbow-rug');
    expect(result).toMatchObject({
      type: 'insufficient-funds',
      price: 6,
      balance: 1,
      shortfall: 5,
    });
    expect(saveService.load()?.inventory.itemQuantities['item:rainbow-rug'] ?? 0).toBe(0);
    expect(economy.getBalance()).toBe(1);
  });
});
