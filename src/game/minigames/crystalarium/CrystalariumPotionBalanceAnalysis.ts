import { RESONANCE_PATTERNS } from './CrystalariumFullRules';
import type { C20PotionCandidate } from './CrystalariumPotionCandidateRules';

/**
 * Design-only, independent-order lower-bound estimate. Does not run gameplay.
 *
 * Every authored order starts with no reusable crafted crystals and is built
 * using ONLY tier-zero growth and pairwise merges. Each extra crafted harmony
 * consumes one tier-one shard of each of the three families (six basic shards
 * and three merges). Starting pieces, leftover inventory, queue overlap,
 * free wash and refined-growth shortcuts are intentionally ignored.
 */
export interface C20OrderEstimate {
  readonly id: string;
  readonly basicShards: number;
  readonly merges: number;
  readonly goalPieces: number;
  readonly harmonies: number;
  /** Change in stock assuming sufficient stock for the entire pattern. */
  readonly netPotion: number;
}

export interface C20CampaignEstimate {
  readonly orderCount: number;
  readonly basicShards: number;
  readonly merges: number;
  readonly totalOfferRewards: number;
  readonly netPotion: number;
  readonly positiveNetOrders: number;
  readonly neutralNetOrders: number;
  readonly negativeNetOrders: number;
  readonly estimatedOrders: readonly C20OrderEstimate[];
}

/**
 * Compare how many potion units a full 50-pattern campaign would consume or
 * generate BEFORE clipping rewards to capacity or requiring free refills.
 * Not a 50-pattern gameplay solver or a forecast of play session length.
 */
export function estimateC20CampaignEconomy(candidate: C20PotionCandidate): C20CampaignEstimate {
  const estimatedOrders: C20OrderEstimate[] = RESONANCE_PATTERNS.map((pattern) => {
    const basicGoalShards = pattern.goals.reduce(
      (sum, goal) => sum + goal.quantity * 2 ** goal.tier,
      0,
    );
    const goalMerges = pattern.goals.reduce(
      (sum, goal) => sum + goal.quantity * (2 ** goal.tier - 1),
      0,
    );
    const basicShards = basicGoalShards + pattern.harmonies * 6;
    const merges = goalMerges + pattern.harmonies * 3;
    return {
      id: pattern.id,
      basicShards,
      merges,
      goalPieces: pattern.goals.reduce((sum, goal) => sum + goal.quantity, 0),
      harmonies: pattern.harmonies,
      netPotion:
        -basicShards * candidate.basicCost +
        merges * candidate.mergeReward +
        candidate.offerReward,
    };
  });
  return {
    orderCount: estimatedOrders.length,
    basicShards: estimatedOrders.reduce((sum, order) => sum + order.basicShards, 0),
    merges: estimatedOrders.reduce((sum, order) => sum + order.merges, 0),
    totalOfferRewards: estimatedOrders.length * candidate.offerReward,
    netPotion: estimatedOrders.reduce((sum, order) => sum + order.netPotion, 0),
    positiveNetOrders: estimatedOrders.filter((order) => order.netPotion > 0).length,
    neutralNetOrders: estimatedOrders.filter((order) => order.netPotion === 0).length,
    negativeNetOrders: estimatedOrders.filter((order) => order.netPotion < 0).length,
    estimatedOrders,
  };
}
