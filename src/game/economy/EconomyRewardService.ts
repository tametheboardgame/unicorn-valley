import type { SaveService } from '../save/SaveService';
import type { SaveGame } from '../save/saveSchema';
import {
  R6_ECONOMY_REWARD_DEFINITIONS,
  getEconomyRewardMemoryId,
  isEconomyRewardClaimed,
  type EconomyRewardDefinition,
  type EconomyRewardSource,
} from './EconomyRewardPolicy';
import { applyShimmerEarnToSave, getShimmerBalanceFromSave } from './ShimmerEconomyService';

export interface ClaimedEconomyReward {
  id: string;
  source: EconomyRewardSource;
  amount: number;
  label: string;
}

export interface EconomyRewardReconcileResult {
  claimed: readonly ClaimedEconomyReward[];
  totalAwarded: number;
  balance: number | null;
}

function appendMemory(save: SaveGame, memoryId: string): SaveGame {
  if (save.collections.memoryIds.includes(memoryId)) {
    return save;
  }
  return {
    ...save,
    collections: {
      ...save.collections,
      memoryIds: [...save.collections.memoryIds, memoryId],
    },
  };
}

export function applyAvailableEconomyRewards(
  save: SaveGame,
  definitions: readonly EconomyRewardDefinition[] = R6_ECONOMY_REWARD_DEFINITIONS,
): { save: SaveGame; claimed: readonly ClaimedEconomyReward[] } {
  let nextSave = save;
  const claimed: ClaimedEconomyReward[] = [];

  for (const reward of definitions) {
    if (isEconomyRewardClaimed(nextSave, reward.id) || !reward.isEarned(nextSave)) {
      continue;
    }

    nextSave = applyShimmerEarnToSave(nextSave, reward.amount);
    nextSave = appendMemory(nextSave, getEconomyRewardMemoryId(reward.id));
    claimed.push({
      id: reward.id,
      source: reward.source,
      amount: reward.amount,
      label: reward.label,
    });
  }

  return { save: nextSave, claimed };
}

export class EconomyRewardService {
  public constructor(private readonly saveService: SaveService) {}

  public reconcile(): EconomyRewardReconcileResult {
    const save = this.saveService.load();
    if (!save) {
      return { claimed: [], totalAwarded: 0, balance: null };
    }

    const result = applyAvailableEconomyRewards(save);
    if (result.claimed.length === 0) {
      return {
        claimed: [],
        totalAwarded: 0,
        balance: getShimmerBalanceFromSave(save),
      };
    }

    const saved = this.saveService.save(result.save);
    return {
      claimed: result.claimed,
      totalAwarded: result.claimed.reduce((total, reward) => total + reward.amount, 0),
      balance: getShimmerBalanceFromSave(saved),
    };
  }
}
