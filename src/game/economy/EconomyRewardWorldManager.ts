import { gameEventBus } from '../events/GameEventBus';
import { getBrowserSaveService } from '../save/browserSaveService';
import { EconomyRewardService } from './EconomyRewardService';

export class EconomyRewardWorldManager {
  private readonly rewardService = new EconomyRewardService(getBrowserSaveService());
  private readonly unsubscribe: (() => void)[] = [];

  public constructor() {
    this.rewardService.reconcile();
    this.unsubscribe.push(
      gameEventBus.on('SAVE_COMPLETED', () => this.rewardService.reconcile()),
    );
  }

  public destroy(): void {
    for (const unsubscribe of this.unsubscribe.splice(0)) {
      unsubscribe();
    }
  }
}

let browserEconomyRewardWorldManager: EconomyRewardWorldManager | null = null;

export function getEconomyRewardWorldManager(): EconomyRewardWorldManager {
  browserEconomyRewardWorldManager ??= new EconomyRewardWorldManager();
  return browserEconomyRewardWorldManager;
}
