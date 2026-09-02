import { describe, expect, it } from 'vitest';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { createDefaultSave } from '../save/createDefaultSave';
import { applyAvailableEconomyRewards, EconomyRewardService } from './EconomyRewardService';
import { getEconomyRewardMemoryId } from './EconomyRewardPolicy';
import { ShopPurchaseTapGuard } from './ShopPurchaseTapGuard';
import { ShopService } from './ShopService';
import { getShimmerBalanceFromSave, ShimmerEconomyService } from './ShimmerEconomyService';

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

function completedQuest() {
  return {
    status: 'completed' as const,
    currentStepId: null,
    completedAt: '2026-09-02T12:00:00.000Z',
  };
}

function raceRecord() {
  return {
    bestTimeMs: 42_000,
    ribbonIds: [],
  };
}

describe('R6.5 economy reward loop', () => {
  it('awards earned quest and discovery rewards once, then records claims idempotently', () => {
    const save = createDefaultSave();
    save.quests.byQuestId['quest:willows-moonflowers'] = completedQuest();
    save.collections.discoveryIds = [
      'discovery:test-1',
      'discovery:test-2',
      'discovery:test-3',
      'discovery:test-4',
      'discovery:test-5',
    ];

    const first = applyAvailableEconomyRewards(save);
    expect(first.claimed.map(({ id }) => id)).toEqual([
      'quest:quest:willows-moonflowers',
      'discovery-milestone:5',
    ]);
    expect(getShimmerBalanceFromSave(first.save)).toBe(3);
    expect(first.save.collections.memoryIds).toContain(
      getEconomyRewardMemoryId('quest:quest:willows-moonflowers'),
    );
    expect(first.save.collections.memoryIds).toContain(
      getEconomyRewardMemoryId('discovery-milestone:5'),
    );

    const second = applyAvailableEconomyRewards(first.save);
    expect(second.claimed).toEqual([]);
    expect(getShimmerBalanceFromSave(second.save)).toBe(3);
  });

  it('backfills genuinely earned rewards on an existing save and does not duplicate them after reload', () => {
    const repository = new MemorySaveRepository();
    const saveService = new SaveService(repository);
    const save = createDefaultSave();
    save.quests.byQuestId['quest:marigold-picnic'] = completedQuest();
    saveService.save(save);

    const first = new EconomyRewardService(saveService).reconcile();
    expect(first.totalAwarded).toBe(2);
    expect(first.balance).toBe(2);

    const reloadedService = new SaveService(repository);
    const second = new EconomyRewardService(reloadedService).reconcile();
    expect(second.totalAwarded).toBe(0);
    expect(second.balance).toBe(2);
  });

  it('keeps desirable starter stock open while later stock unlocks through varied normal play', () => {
    const repository = new MemorySaveRepository();
    const saveService = new SaveService(repository);
    saveService.save(createDefaultSave());
    const shop = new ShopService(saveService);

    const initial = new Map(shop.listStock().map((entry) => [entry.definition.id, entry]));
    expect(initial.get('item:starlight-bow')?.isUnlocked).toBe(true);
    expect(initial.get('item:cloud-cushion')?.isUnlocked).toBe(true);
    expect(initial.get('item:moonflower-hair-clip')?.isUnlocked).toBe(false);
    expect(initial.get('item:starlight-lamp')?.isUnlocked).toBe(false);
    expect(initial.get('item:rainbow-neck-ribbon')?.isUnlocked).toBe(false);
    expect(initial.get('item:rainbow-rug')?.isUnlocked).toBe(false);

    const progressed = saveService.load();
    expect(progressed).not.toBeNull();
    if (!progressed) {
      return;
    }
    progressed.quests.byQuestId['quest:willows-moonflowers'] = completedQuest();
    progressed.quests.byQuestId['quest:marigold-picnic'] = completedQuest();
    progressed.collections.discoveryIds = [
      'discovery:test-1',
      'discovery:test-2',
      'discovery:test-3',
      'discovery:test-4',
      'discovery:test-5',
    ];
    progressed.activities.racesById['race:test'] = raceRecord();
    saveService.save(progressed);

    const unlocked = new Map(shop.listStock().map((entry) => [entry.definition.id, entry]));
    expect([...unlocked.values()].every(({ isUnlocked }) => isUnlocked)).toBe(true);
  });

  it('does not charge for locked stock and preserves the balance', () => {
    const repository = new MemorySaveRepository();
    const saveService = new SaveService(repository);
    saveService.save(createDefaultSave());
    const economy = new ShimmerEconomyService(saveService);
    economy.earn(10);

    const result = new ShopService(saveService).purchase('item:rainbow-rug');
    expect(result.type).toBe('locked');
    expect(economy.getBalance()).toBe(10);
    expect(saveService.load()?.inventory.itemQuantities['item:rainbow-rug'] ?? 0).toBe(0);
  });

  it('blocks duplicate purchase taps inside the guard window but permits a later deliberate tap', () => {
    const guard = new ShopPurchaseTapGuard(300);
    expect(guard.tryBegin('item:cloud-cushion', 1_000)).toBe(true);
    expect(guard.tryBegin('item:cloud-cushion', 1_299)).toBe(false);
    expect(guard.tryBegin('item:cloud-cushion', 1_300)).toBe(true);
    expect(guard.tryBegin('item:starlight-bow', 1_301)).toBe(true);

    guard.reset();
    expect(guard.tryBegin('item:cloud-cushion', 1_302)).toBe(true);
  });
});
