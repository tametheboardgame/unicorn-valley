import { describe, expect, it } from 'vitest';
import {
  CORAL_BEACHCOMBING_ACTIVITY_ID,
  MAPLE_BAKING_ACTIVITY_ID,
  MOONFLOWER_BERRY_CAKE_DISCOVERY_ID,
  SUNSHINE_SPRINKLE_CAKE_DISCOVERY_ID,
  TIDEPOOL_STAR_NOTEBOOK_DISCOVERY_ID,
} from '../../content/r65RepeatableActivities';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { createDefaultSave } from '../save/createDefaultSave';
import {
  getCoralBeachcombingProgress,
  getNextBeachcombingTrail,
  recordCoralBeachcombingTrail,
} from './CoralBeachcombingActivity';
import { getMapleBakingProgress, recordMapleBakingCake } from './MapleBakingActivity';

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

function createHarness(): SaveService {
  const saveService = new SaveService(new MemorySaveRepository());
  saveService.save(createDefaultSave('2026-09-04T20:30:00.000Z'));
  return saveService;
}

describe('R6.5-WP14 repeatable activity progress', () => {
  it('records Maple cake styles as finite collection progress without repeat farming', () => {
    const saveService = createHarness();

    expect(getMapleBakingProgress(saveService).completedOutcomeCount).toBe(0);

    const first = recordMapleBakingCake(saveService, 'sunshine');
    expect(first.firstCompletion).toBe(true);
    expect(first.newOutcome).toBe(true);
    expect(first.completedOutcomeCount).toBe(1);
    expect(saveService.load()?.activities.miniGameRecords[MAPLE_BAKING_ACTIVITY_ID]).toBe(1);
    expect(saveService.load()?.collections.discoveryIds).toContain(
      SUNSHINE_SPRINKLE_CAKE_DISCOVERY_ID,
    );

    const repeat = recordMapleBakingCake(saveService, 'sunshine');
    expect(repeat.firstCompletion).toBe(false);
    expect(repeat.newOutcome).toBe(false);
    expect(repeat.completedOutcomeCount).toBe(1);

    const second = recordMapleBakingCake(saveService, 'moonflower');
    expect(second.completedOutcomeCount).toBe(2);
    expect(saveService.load()?.collections.discoveryIds).toContain(
      MOONFLOWER_BERRY_CAKE_DISCOVERY_ID,
    );
    expect(saveService.load()?.activities.miniGameRecords[MAPLE_BAKING_ACTIVITY_ID]).toBe(2);
  });

  it('advances Coral through distinct observation trails and preserves a best progress record', () => {
    const saveService = createHarness();

    expect(getNextBeachcombingTrail(saveService)).toBe('crab-tracks');
    const first = recordCoralBeachcombingTrail(saveService, 'crab-tracks');
    expect(first.firstCompletion).toBe(true);
    expect(first.completedOutcomeCount).toBe(1);
    expect(getNextBeachcombingTrail(saveService)).toBe('tidepool-star');

    const second = recordCoralBeachcombingTrail(saveService, 'tidepool-star');
    expect(second.completedOutcomeCount).toBe(2);
    expect(saveService.load()?.collections.discoveryIds).toContain(
      TIDEPOOL_STAR_NOTEBOOK_DISCOVERY_ID,
    );
    expect(saveService.load()?.activities.miniGameRecords[CORAL_BEACHCOMBING_ACTIVITY_ID]).toBe(2);
    expect(getCoralBeachcombingProgress(saveService).bestProgress).toBe(2);
  });
});
