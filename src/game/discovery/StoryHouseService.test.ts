import { describe, expect, it } from 'vitest';
import {
  TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID,
  TANSY_MAP_HUNT_ACTIVE_FLAG,
  TANSY_MAP_RESTORED_FLAG,
  TANSY_NOTICE_MAP_CORNER_DISCOVERY_ID,
  TANSY_SUNDIAL_MAP_CORNER_DISCOVERY_ID,
} from '../../content/r6VillageContent';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { createDefaultSave } from '../save/createDefaultSave';
import { StoryHouseService } from './StoryHouseService';

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

describe('Story House service', () => {
  it('always offers a welcome card and remembers cards that have been read', () => {
    const repository = new MemorySaveRepository();
    const saveService = new SaveService(repository);
    saveService.save(createDefaultSave());
    const storyHouse = new StoryHouseService(saveService);

    const welcome = storyHouse.listCards().find(({ id }) => id === 'welcome-to-sunbeam');
    expect(welcome?.unlocked).toBe(true);
    expect(welcome?.read).toBe(false);

    expect(storyHouse.readCard('welcome-to-sunbeam')?.read).toBe(true);
    expect(new StoryHouseService(new SaveService(repository)).listCards().find(({ id }) => id === 'welcome-to-sunbeam')?.read).toBe(true);
  });

  it('unlocks story cards from normal quest and discovery progress without a purchase', () => {
    const saveService = new SaveService(new MemorySaveRepository());
    const save = createDefaultSave();
    save.quests.byQuestId['quest:willows-moonflowers'] = {
      status: 'completed',
      currentStepId: null,
      completedAt: '2026-09-02T14:00:00.000Z',
    };
    save.collections.discoveryIds.push('discovery:woods-starwell');
    saveService.save(save);

    const unlocked = new StoryHouseService(saveService)
      .listCards()
      .filter(({ unlocked }) => unlocked)
      .map(({ id }) => id);
    expect(unlocked).toContain('moonflowers-after-help');
    expect(unlocked).toContain('starwell-page');
  });

  it('progresses Tansy clue text in the same order as the map-corner quest', () => {
    const saveService = new SaveService(new MemorySaveRepository());
    const save = createDefaultSave();
    save.world.flags[TANSY_MAP_HUNT_ACTIVE_FLAG] = true;
    saveService.save(save);
    const storyHouse = new StoryHouseService(saveService);

    expect(storyHouse.getCurrentClue()).toContain('notices');

    let next = saveService.load();
    expect(next).not.toBeNull();
    if (!next) return;
    next.collections.discoveryIds.push(TANSY_NOTICE_MAP_CORNER_DISCOVERY_ID);
    saveService.save(next);
    expect(storyHouse.getCurrentClue()).toContain('Bakery');

    next = saveService.load();
    expect(next).not.toBeNull();
    if (!next) return;
    next.collections.discoveryIds.push(TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID);
    saveService.save(next);
    expect(storyHouse.getCurrentClue()).toContain('sunny');

    next = saveService.load();
    expect(next).not.toBeNull();
    if (!next) return;
    next.collections.discoveryIds.push(TANSY_SUNDIAL_MAP_CORNER_DISCOVERY_ID);
    saveService.save(next);
    expect(storyHouse.getCurrentClue()).toContain('All three');

    next = saveService.load();
    expect(next).not.toBeNull();
    if (!next) return;
    next.world.flags[TANSY_MAP_RESTORED_FLAG] = true;
    saveService.save(next);
    expect(storyHouse.getCurrentClue()).toContain('repaired map');
  });

  it('summarises unique discoveries without double-counting save mirrors', () => {
    const saveService = new SaveService(new MemorySaveRepository());
    const save = createDefaultSave();
    save.collections.discoveryIds.push('discovery:rainbow-meadow');
    save.world.uniqueDiscoveryIds.push('discovery:rainbow-meadow');
    saveService.save(save);

    expect(new StoryHouseService(saveService).getWonderbookSummary()).toContain('1 discoveries');
  });
});
