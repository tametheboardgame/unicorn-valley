import { gameEventBus } from '../events/GameEventBus';
import { getBrowserSaveService } from '../save/browserSaveService';
import { EconomyRewardService } from './EconomyRewardService';

export class EconomyRewardWorldManager {
  private readonly rewardService = new EconomyRewardService(getBrowserSaveService());
  private readonly unsubscribe: (() => void)[] = [];

  public constructor() {
    this.reconcileAndAnnounce();
    this.unsubscribe.push(gameEventBus.on('SAVE_COMPLETED', () => this.reconcileAndAnnounce()));
  }

  public destroy(): void {
    for (const unsubscribe of this.unsubscribe.splice(0)) {
      unsubscribe();
    }
  }

  private reconcileAndAnnounce(): void {
    const result = this.rewardService.reconcile();
    if (result.totalAwarded <= 0 || result.balance === null) {
      return;
    }

    gameEventBus.emit('SHIMMER_REWARDED', {
      amount: result.totalAwarded,
      balance: result.balance,
      labels: result.claimed.map(({ label }) => label),
    });
  }
}

let browserEconomyRewardWorldManager: EconomyRewardWorldManager | null = null;

export function getEconomyRewardWorldManager(): EconomyRewardWorldManager {
  browserEconomyRewardWorldManager ??= new EconomyRewardWorldManager();
  return browserEconomyRewardWorldManager;
}
