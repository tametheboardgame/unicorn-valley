import type { ItemId } from '../../content/contentTypes';

export class ShopPurchaseTapGuard {
  private readonly lastPurchaseAttemptByItem = new Map<ItemId, number>();

  public constructor(private readonly guardWindowMs = 300) {}

  public tryBegin(itemId: ItemId, nowMs: number): boolean {
    const previous = this.lastPurchaseAttemptByItem.get(itemId);
    if (previous !== undefined && nowMs - previous < this.guardWindowMs) {
      return false;
    }
    this.lastPurchaseAttemptByItem.set(itemId, nowMs);
    return true;
  }

  public reset(): void {
    this.lastPurchaseAttemptByItem.clear();
  }
}
