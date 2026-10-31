import { describe, expect, it } from 'vitest';
import { RESONANCE_PATTERNS } from './CrystalariumFullRules';
import { estimateC20CampaignEconomy } from './CrystalariumPotionBalanceAnalysis';
import { createC20PotionTrial } from './CrystalariumPotionCandidateRules';

describe('C20 Gate D complete authored order economy projection (no saves)', () => {
  it('covers all fifty real authored patterns, never invented costs or IDs', () => {
    const candidate = createC20PotionTrial(100, 'brook-spring');
    const result = estimateC20CampaignEconomy(candidate);
    expect(result.orderCount).toBe(50);
    expect(result.estimatedOrders.map((order) => order.id)).toEqual(
      RESONANCE_PATTERNS.map((pattern) => pattern.id),
    );
    for (const order of result.estimatedOrders) {
      expect(order.basicShards).toBeGreaterThan(0);
      expect(order.merges).toBeGreaterThanOrEqual(0);
      expect(order.merges).toBe(order.basicShards - order.goalPieces - order.harmonies * 3);
      expect(order.netPotion).toBe(
        -order.basicShards * candidate.basicCost +
          order.merges * candidate.mergeReward +
          candidate.offerReward,
      );
    }
    expect(result.totalOfferRewards).toBe(50 * candidate.offerReward);
    expect(
      result.positiveNetOrders + result.neutralNetOrders + result.negativeNetOrders,
    ).toBe(50);
    // Exact current authored campaign totals; a future recipe edit must
    // explicitly requalify the preview's corresponding balancing figures.
    expect(result.basicShards).toBe(950);
    expect(result.merges).toBe(812);
    expect(result.netPotion).toBe(12);
    expect(result.positiveNetOrders).toBe(38);
    expect(result.neutralNetOrders).toBe(3);
    expect(result.negativeNetOrders).toBe(9);
  });

  it('detects when positive merge and offer rewards largely neutralise growth costs', () => {
    const candidate = createC20PotionTrial(100, 'brook-spring');
    const withRewards = estimateC20CampaignEconomy(candidate);
    const withoutRewards = estimateC20CampaignEconomy({
      ...candidate,
      mergeReward: 0,
      offerReward: 0,
    });
    expect(withoutRewards.netPotion).toBe(-withoutRewards.basicShards);
    expect(withRewards.netPotion).toBe(
      withoutRewards.netPotion +
        withRewards.merges * candidate.mergeReward +
        withRewards.totalOfferRewards,
    );
    expect(withRewards.netPotion).toBeGreaterThan(withoutRewards.netPotion);
    // An important usability question: is the meter useful when merge rebates
    // cancel much of the cost of basic crystals?
    expect(withRewards.positiveNetOrders).toBeGreaterThan(0);
  });

  it('shows why a larger bottle does not change net crafting economics', () => {
    const a = estimateC20CampaignEconomy(createC20PotionTrial(100, 'brook-spring'));
    const b = estimateC20CampaignEconomy(createC20PotionTrial(150, 'brook-spring'));
    const c = estimateC20CampaignEconomy(createC20PotionTrial(200, 'free-basic-at-zero'));
    expect([a.netPotion, b.netPotion, c.netPotion]).toEqual([
      a.netPotion,
      a.netPotion,
      a.netPotion,
    ]);
    expect(a.estimatedOrders).toEqual(b.estimatedOrders);
    expect(b.estimatedOrders).toEqual(c.estimatedOrders);
  });

  it('makes higher basic growth costs meaningfully different without changing the game', () => {
    const candidate = createC20PotionTrial(100, 'brook-spring');
    const inexpensive = estimateC20CampaignEconomy(candidate);
    const moreExpensive = estimateC20CampaignEconomy({
      ...candidate,
      basicCost: 2,
      refinedCost: 3,
    });
    expect(moreExpensive.netPotion).toBe(
      inexpensive.netPotion - inexpensive.basicShards,
    );
  });
});
