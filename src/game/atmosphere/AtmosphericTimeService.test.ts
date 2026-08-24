import { describe, expect, it } from 'vitest';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import {
  ATMOSPHERIC_TIME_STATES,
  AUTO_TIME_STATE_DURATION_MS,
  AtmosphericTimeService,
  chooseProgressionAtmosphericTime,
  nextAtmosphericTimeState,
  readManualAtmosphericTime,
} from './AtmosphericTimeService';

class MemoryRepository implements SaveRepository {
  private value: string | null = null;

  public read(): string | null {
    return this.value;
  }

  public write(value: string): void {
    this.value = value;
  }

  public remove(): void {
    this.value = null;
  }
}

function createService(): SaveService {
  const service = new SaveService(
    new MemoryRepository(),
    undefined,
    () => '2026-08-23T10:00:00.000Z',
  );
  service.save(service.createNewGame());
  return service;
}

describe('AtmosphericTimeService', () => {
  it('provides four visually distinct time definitions without using the real-world clock', () => {
    const saveService = createService();
    const service = new AtmosphericTimeService(saveService, saveService.load());

    expect(service.getState()).toBe('morning');
    expect(service.cycleMode()).toBe('morning');
    expect(service.cycleMode()).toBe('afternoon');
    expect(service.cycleMode()).toBe('sunset');
    expect(service.cycleMode()).toBe('night');
    expect(service.cycleMode()).toBe('auto');
    expect(ATMOSPHERIC_TIME_STATES).toHaveLength(4);
    expect(ATMOSPHERIC_TIME_STATES[0].overlayColor).not.toBe(
      ATMOSPHERIC_TIME_STATES[1].overlayColor,
    );
    expect(ATMOSPHERIC_TIME_STATES[0].overlayAlpha).toBeGreaterThan(
      ATMOSPHERIC_TIME_STATES[1].overlayAlpha,
    );
  });

  it('uses progression only to choose the initial automatic atmosphere', () => {
    const saveService = createService();
    const save = saveService.load();
    expect(chooseProgressionAtmosphericTime(save)).toBe('morning');

    if (!save) {
      throw new Error('Expected save');
    }
    save.world.flags['flag:r5-brook-song-restored'] = true;
    expect(chooseProgressionAtmosphericTime(save)).toBe('afternoon');

    save.world.flags['flag:r5-woods-starwell-revealed'] = true;
    expect(chooseProgressionAtmosphericTime(save)).toBe('sunset');

    save.collections.memoryIds.push('memory:r5-firefly-lantern-first-completion');
    expect(chooseProgressionAtmosphericTime(save)).toBe('night');
  });

  it('cycles automatic game time every three minutes in the locked order', () => {
    const saveService = createService();
    const service = new AtmosphericTimeService(saveService, saveService.load());

    expect(nextAtmosphericTimeState('morning')).toBe('afternoon');
    expect(nextAtmosphericTimeState('afternoon')).toBe('sunset');
    expect(nextAtmosphericTimeState('sunset')).toBe('night');
    expect(nextAtmosphericTimeState('night')).toBe('morning');

    service.advanceAutomatic(AUTO_TIME_STATE_DURATION_MS - 1);
    expect(service.getState()).toBe('morning');
    service.advanceAutomatic(1);
    expect(service.getState()).toBe('afternoon');
    service.advanceAutomatic(AUTO_TIME_STATE_DURATION_MS * 3);
    expect(service.getState()).toBe('morning');
  });

  it('keeps the automatic clock moving during a manual override and resumes predictably', () => {
    const saveService = createService();
    const service = new AtmosphericTimeService(saveService, saveService.load());

    service.setMode('night');
    expect(readManualAtmosphericTime(saveService.load())).toBe('night');
    service.advanceAutomatic(AUTO_TIME_STATE_DURATION_MS * 2);
    expect(service.getState()).toBe('night');
    expect(service.getAutomaticState()).toBe('sunset');

    service.setMode('auto');
    expect(readManualAtmosphericTime(saveService.load())).toBeNull();
    expect(service.getState()).toBe('sunset');
  });

  it('persists a manual override across a save reload', () => {
    const saveService = createService();
    const service = new AtmosphericTimeService(saveService, saveService.load());

    service.setMode('night');
    const reloaded = new AtmosphericTimeService(saveService, saveService.load());
    expect(reloaded.getMode()).toBe('night');
    expect(reloaded.getState()).toBe('night');
  });
});
