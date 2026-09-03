import { describe, expect, it } from 'vitest';
import {
  CORAL_SHELL_STORIES_COMPLETE_FLAG,
  CORAL_SHELL_STORIES_QUEST_ID,
  SKIPPER_FOLLOW_THE_WIND_QUEST_ID,
  STARLIGHT_SHELL_RIBBON_ITEM_ID,
} from '../../content/r65StarlightBeach';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { createDefaultSave } from '../save/createDefaultSave';
import { EconomyRewardService } from './EconomyRewardService';
import { ShopService } from './ShopService';
import { ShimmerEconomyService } from './ShimmerEconomyService';

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
  const saveService = new SaveService(new MemorySaveRepository());
  saveService.save(createDefaultSave());
  return {
    saveService,
    rewards: new EconomyRewardService(saveService),
    economy: new ShimmerEconomyService(saveService),
    shop: new ShopService(saveService),
  };
}

describe('R6.5 Starlight Beach economy integration', () => {
  it('awards Shimmer once for each completed substantive Beach story', () => {
    const { saveService, rewards, economy } = createServices();
    const save = saveService.load();
    expect(save).not.toBeNull();
    if (!save) {
      return;
    }
    save.quests.byQuestId[CORAL_SHELL_STORIES_QUEST_ID] = {
      status: 'completed',
      currentStepId: null,
      completedAt: '2026-09-03T12:00:00.000Z',
    };
    save.quests.byQuestId[SKIPPER_FOLLOW_THE_WIND_QUEST_ID] = {
      status: 'completed',
      currentStepId: null,
      completedAt: '2026-09-03T12:05:00.000Z',
    };
    saveService.save(save);

    const first = rewards.reconcile();
    expect(first.claimed).toHaveLength(2);
    expect(first.totalAwarded).toBe(4);
    expect(economy.getBalance()).toBe(4);
    expect(rewards.reconcile().claimed).toHaveLength(0);
    expect(economy.getBalance()).toBe(4);
  });

  it('keeps the Starlight Shell Ribbon locked until Coral’s persistent story state is complete', () => {
    const { saveService, economy, shop } = createServices();
    const locked = shop
      .listStock()
      .find(({ definition }) => definition.id === STARLIGHT_SHELL_RIBBON_ITEM_ID);
    expect(locked).toMatchObject({ isUnlocked: false, price: 4 });
    expect(locked?.unlockHint).toContain('Coral');

    const save = saveService.load();
    expect(save).not.toBeNull();
    if (!save) {
      return;
    }
    save.world.flags[CORAL_SHELL_STORIES_COMPLETE_FLAG] = true;
    saveService.save(save);
    economy.earn(4);

    const unlocked = shop
      .listStock()
      .find(({ definition }) => definition.id === STARLIGHT_SHELL_RIBBON_ITEM_ID);
    expect(unlocked?.isUnlocked).toBe(true);
    expect(shop.purchase(STARLIGHT_SHELL_RIBBON_ITEM_ID).type).toBe('purchased');
    expect(saveService.load()?.inventory.ownedCosmeticIds).toContain(
      STARLIGHT_SHELL_RIBBON_ITEM_ID,
    );
  });
});
