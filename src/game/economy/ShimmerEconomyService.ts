import type { ItemId } from '../../content/contentTypes';
import type { SaveService } from '../save/SaveService';
import type { SaveGame } from '../save/saveSchema';

export const SHIMMER_ITEM_ID: ItemId = 'item:rainbow-run-sparkle';

function assertAmount(amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`Shimmer amount must be a positive integer. Received: ${amount}`);
  }
}

export function getShimmerBalanceFromSave(save: SaveGame): number {
  const balance = save.inventory.itemQuantities[SHIMMER_ITEM_ID] ?? 0;
  return Number.isInteger(balance) && balance > 0 ? balance : 0;
}

export function applyShimmerEarnToSave(save: SaveGame, amount: number): SaveGame {
  assertAmount(amount);
  const balance = getShimmerBalanceFromSave(save);
  return {
    ...save,
    inventory: {
      ...save.inventory,
      itemQuantities: {
        ...save.inventory.itemQuantities,
        [SHIMMER_ITEM_ID]: balance + amount,
      },
    },
  };
}

export function applyShimmerSpendToSave(save: SaveGame, amount: number): SaveGame | null {
  assertAmount(amount);
  const balance = getShimmerBalanceFromSave(save);
  if (balance < amount) {
    return null;
  }

  const itemQuantities = { ...save.inventory.itemQuantities };
  const nextBalance = balance - amount;
  if (nextBalance === 0) {
    delete itemQuantities[SHIMMER_ITEM_ID];
  } else {
    itemQuantities[SHIMMER_ITEM_ID] = nextBalance;
  }

  return {
    ...save,
    inventory: {
      ...save.inventory,
      itemQuantities,
    },
  };
}

export class ShimmerEconomyService {
  public constructor(private readonly saveService: SaveService) {}

  public getBalance(): number {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    return getShimmerBalanceFromSave(save);
  }

  public earn(amount: number): number {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const nextSave = applyShimmerEarnToSave(save, amount);
    this.saveService.save(nextSave);
    return getShimmerBalanceFromSave(nextSave);
  }

  public canSpend(amount: number): boolean {
    assertAmount(amount);
    return this.getBalance() >= amount;
  }

  public spend(amount: number): boolean {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const nextSave = applyShimmerSpendToSave(save, amount);
    if (!nextSave) {
      return false;
    }

    this.saveService.save(nextSave);
    return true;
  }
}
